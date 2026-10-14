import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// Booking yaratish
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId, bookingDate, guestCount, note, singerId, carId, foodId } = req.body;

    if (!hallId || !bookingDate || !guestCount) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring' });
    }

    // Sana tekshiruvlari
    if (isNaN(Date.parse(bookingDate))) {
      return res.status(400).json({ message: 'Noto\'g\'ri sana kiritildi' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const bookingDateStr = new Date(bookingDate).toISOString().split('T')[0];

    if (bookingDateStr < todayStr) {
      return res.status(400).json({ message: 'O\'tgan sanani bron qilib bo\'lmaydi' });
    }

    // To'yxona ma'lumotlarini olish
    const hallResult = await query('SELECT price_per_seat, capacity FROM wedding_halls WHERE hall_id = $1', [hallId]);

    if (hallResult.rows.length === 0) {
      return res.status(404).json({ message: 'To\'yxona topilmadi' });
    }

    const hall = hallResult.rows[0];
    if (guestCount > hall.capacity) {
      return res.status(400).json({ message: `Mehmonlar soni to'yxona sig'imidan (${hall.capacity}) oshib ketmasligi kerak` });
    }

    // Band qilinganligini tekshirish (Double Booking check)
    const checkBooking = await query(
      "SELECT * FROM bookings WHERE hall_id = $1 AND booking_date = $2 AND status IN ('pending', 'confirmed')",
      [hallId, bookingDateStr]
    );

    if (checkBooking.rows.length > 0) {
      return res.status(400).json({ message: 'Ushbu sanada to\'yxona allaqachon band qilingan' });
    }

    // Extras validatsiya va narx hisoblash
    let singerPrice = 0;
    let carPrice = 0;
    let foodPricePerGuest = 0;

    if (singerId) {
      const singerResult = await query('SELECT price FROM singers WHERE singer_id = $1 AND is_active = TRUE', [singerId]);
      if (singerResult.rows.length === 0) {
        return res.status(400).json({ message: "Qo'shiqchi topilmadi yoki faol emas" });
      }
      singerPrice = parseFloat(singerResult.rows[0].price);
    }

    if (carId) {
      const carResult = await query('SELECT price FROM cars WHERE car_id = $1 AND is_active = TRUE', [carId]);
      if (carResult.rows.length === 0) {
        return res.status(400).json({ message: 'Avtomobil topilmadi yoki faol emas' });
      }
      carPrice = parseFloat(carResult.rows[0].price);
    }

    if (foodId) {
      const foodResult = await query('SELECT price_per_guest FROM foods WHERE food_id = $1 AND is_active = TRUE', [foodId]);
      if (foodResult.rows.length === 0) {
        return res.status(400).json({ message: 'Ovqat menyusi topilmadi yoki faol emas' });
      }
      foodPricePerGuest = parseFloat(foodResult.rows[0].price_per_guest);
    }

    // Total narx: zal + xonanda + mashina + (ovqat × mehmonlar)
    const hallPrice = parseFloat(hall.price_per_seat) * guestCount;
    const totalPrice = hallPrice + singerPrice + carPrice + (foodPricePerGuest * guestCount);

    const result = await query(
      `INSERT INTO bookings (user_id, hall_id, booking_date, guest_count, total_price, note, singer_id, car_id, food_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, singer_id, car_id, food_id, created_at`,
      [req.user.id, hallId, bookingDateStr, guestCount, totalPrice, note || null, singerId || null, carId || null, foodId || null]
    );

    res.status(201).json({ message: 'Booking yaratildi', booking: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Barcha bookinglar (foydalanuvchi)
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Booking ID bo'yicha olish
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    const result = await query('SELECT booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at FROM bookings WHERE booking_id = $1', [bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking topilmadi' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Booking holatini yangilash (owner/admin)
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    // If owner is updating status, ensure booking belongs to one of their halls
    if (req.user.role === 'owner') {
      const ownerRes = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
      if (ownerRes.rows.length === 0) return res.status(403).json({ message: 'Owner topilmadi' });
      const ownerId = ownerRes.rows[0].owner_id;

      const bookingRes = await query('SELECT hall_id FROM bookings WHERE booking_id = $1', [bookingId]);
      if (bookingRes.rows.length === 0) return res.status(404).json({ message: 'Booking topilmadi' });

      const hallRes = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [bookingRes.rows[0].hall_id]);
      if (hallRes.rows.length === 0) return res.status(404).json({ message: 'To\'yxona topilmadi' });

      if (hallRes.rows[0].owner_id !== ownerId) {
        return res.status(403).json({ message: 'Ruxsat yo\'q' });
      }
    }

    const result = await query(
      'UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at',
      [status, bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking topilmadi' });
    }

    res.json({ message: 'Booking yangilandi', booking: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Booking bekor qilish
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    // ✅ Security check: check booking exists and belongs to the user (unless admin)
    const bookingCheck = await query('SELECT user_id FROM bookings WHERE booking_id = $1', [bookingId]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking topilmadi' });
    }

    if (req.user.role !== 'admin' && bookingCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Sizda bu bookingni bekor qilishga ruxsat yo\'q' });
    }

    const result = await query(
      'UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at',
      ['cancelled', bookingId]
    );

    res.json({ message: 'Booking bekor qilindi', booking: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Barcha bookinglar (admin)
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT b.booking_id, b.user_id, b.hall_id, b.booking_date::text, b.guest_count, b.total_price, b.status, b.note, b.created_at, u.fullname, h.hall_name FROM bookings b JOIN users u ON b.user_id = u.user_id JOIN wedding_halls h ON b.hall_id = h.hall_id ORDER BY b.created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Owner: get bookings for owner's halls
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    // get owner id
    const ownerRes = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
    if (ownerRes.rows.length === 0) return res.status(403).json({ message: 'Owner topilmadi' });
    const ownerId = ownerRes.rows[0].owner_id;

    const result = await query('SELECT b.booking_id, b.user_id, b.hall_id, b.booking_date::text, b.guest_count, b.total_price, b.status, b.note, b.created_at, u.fullname, h.hall_name FROM bookings b JOIN users u ON b.user_id = u.user_id JOIN wedding_halls h ON b.hall_id = h.hall_id WHERE h.owner_id = $1 ORDER BY b.created_at DESC', [ownerId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Owner stats: halls count, bookings count, revenue
export const getOwnerStats = async (req: AuthRequest, res: Response) => {
  try {
    const ownerRes = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
    if (ownerRes.rows.length === 0) return res.status(403).json({ message: 'Owner topilmadi' });
    const ownerId = ownerRes.rows[0].owner_id;

    const hallsRes = await query('SELECT COUNT(*) FROM wedding_halls WHERE owner_id = $1', [ownerId]);
    const bookingsRes = await query('SELECT COUNT(*) FROM bookings b JOIN wedding_halls h ON b.hall_id = h.hall_id WHERE h.owner_id = $1', [ownerId]);
    const revenueRes = await query('SELECT COALESCE(SUM(p.amount),0) as revenue FROM payments p JOIN bookings b ON p.booking_id = b.booking_id JOIN wedding_halls h ON b.hall_id = h.hall_id WHERE h.owner_id = $1', [ownerId]);

    res.json({
      halls: parseInt(hallsRes.rows[0].count, 10),
      bookings: parseInt(bookingsRes.rows[0].count, 10),
      revenue: parseFloat(revenueRes.rows[0].revenue),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
