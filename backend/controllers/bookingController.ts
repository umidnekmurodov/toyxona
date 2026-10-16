import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

async function getOwnerIdByUserId(userId: string): Promise<string> {
  const existingOwner = await query('SELECT owner_id FROM owners WHERE user_id = $1', [userId]);
  if (existingOwner.rows.length > 0) return existingOwner.rows[0].owner_id;
  const userRes = await query('SELECT fullname FROM users WHERE user_id = $1', [userId]);
  const companyName = (userRes.rows[0]?.fullname || 'Mening Biznesim') + ' To\'yxonasi';
  const newOwner = await query(
    'INSERT INTO owners (user_id, company_name, verified) VALUES ($1, $2, false) RETURNING owner_id',
    [userId, companyName]
  );
  return newOwner.rows[0].owner_id;
}

/**
 * Bron qilish
 */
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId, bookingDate, guestCount, note, singerId, carId, foodId } = req.body;

    if (!hallId || !bookingDate || guestCount === undefined || guestCount === null) {
      return res.status(400).json({ message: "Barcha maydonlarni to'ldiring: to'yxona, sana, mehmonlar soni" });
    }

    const parsedGuestCount = Number(guestCount);
    if (!Number.isInteger(parsedGuestCount) || parsedGuestCount < 1) {
      return res.status(400).json({ message: "Mehmonlar soni musbat butun son bo'lishi kerak" });
    }

    if (isNaN(Date.parse(bookingDate))) {
      return res.status(400).json({ message: "Noto'g'ri sana kiritildi" });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const bookingDateStr = new Date(bookingDate).toISOString().split('T')[0];

    if (bookingDateStr < todayStr) {
      return res.status(400).json({ message: "O'tgan sanani bron qilib bo'lmaydi" });
    }

    const hallResult = await query('SELECT price_per_seat, capacity FROM wedding_halls WHERE hall_id = $1', [hallId]);
    if (hallResult.rows.length === 0) {
      return res.status(404).json({ message: "To'yxona topilmadi" });
    }

    const hall = hallResult.rows[0];
    if (parsedGuestCount > hall.capacity) {
      return res.status(400).json({ message: `Mehmonlar soni to'yxona sig'imidan (${hall.capacity} kishi) oshib ketmasligi kerak!` });
    }

    const checkBooking = await query(
      "SELECT booking_id FROM bookings WHERE hall_id = $1 AND booking_date = $2 AND status IN ('pending', 'confirmed')",
      [hallId, bookingDateStr]
    );
    if (checkBooking.rows.length > 0) {
      return res.status(400).json({ message: "Ushbu sanada to'yxona allaqachon band qilingan!" });
    }

    let singerPrice = 0;
    let carPrice = 0;
    let foodPricePerGuest = 0;

    if (singerId) {
      const singerRes = await query('SELECT price FROM singers WHERE singer_id = $1 AND is_active = TRUE', [singerId]);
      if (singerRes.rows.length === 0) {
        return res.status(400).json({ message: "Tanlangan san'atkor topilmadi yoki faol emas" });
      }
      singerPrice = parseFloat(singerRes.rows[0].price);
    }

    if (carId) {
      const carRes = await query('SELECT price FROM cars WHERE car_id = $1 AND is_active = TRUE', [carId]);
      if (carRes.rows.length === 0) {
        return res.status(400).json({ message: 'Tanlangan avtomobil topilmadi yoki faol emas' });
      }
      carPrice = parseFloat(carRes.rows[0].price);
    }

    if (foodId) {
      const foodRes = await query('SELECT price_per_guest FROM foods WHERE food_id = $1 AND is_active = TRUE', [foodId]);
      if (foodRes.rows.length === 0) {
        return res.status(400).json({ message: 'Tanlangan taom menyusi topilmadi yoki faol emas' });
      }
      foodPricePerGuest = parseFloat(foodRes.rows[0].price_per_guest);
    }

    const hallPrice = parseFloat(hall.price_per_seat) * parsedGuestCount;
    const totalPrice = hallPrice + singerPrice + carPrice + (foodPricePerGuest * parsedGuestCount);

    const result = await query(
      `INSERT INTO bookings (user_id, hall_id, booking_date, guest_count, total_price, note, singer_id, car_id, food_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, singer_id, car_id, food_id, created_at`,
      [req.user?.id, hallId, bookingDateStr, parsedGuestCount, totalPrice, note || null, singerId || null, carId || null, foodId || null]
    );

    res.status(201).json({ message: 'Bron muvaffaqiyatli yaratildi!', booking: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
  }
};

/**
 * Foydalanuvchining o'z bronlari
 */
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bitta bron ma'lumotlari
 */
export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const result = await query(
      'SELECT booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at FROM bookings WHERE booking_id = $1',
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bron topilmadi' });
    }

    if (req.user?.role !== 'admin' && result.rows[0].user_id !== req.user?.id) {
      return res.status(403).json({ message: "Sizda ushbu bron ma'lumotlarini ko'rish huquqi yo'q" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bron holatini yangilash (Owner / Admin)
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Bron holati noto'g'ri" });
    }

    if (req.user?.role === 'owner') {
      const ownerId = await getOwnerIdByUserId(req.user.id);
      const bookingRes = await query(
        `SELECT b.booking_id FROM bookings b
         JOIN wedding_halls h ON b.hall_id = h.hall_id
         WHERE b.booking_id = $1 AND h.owner_id = $2`,
        [bookingId, ownerId]
      );
      if (bookingRes.rows.length === 0) {
        return res.status(403).json({ message: 'Ruxsat yo\'q yoki bu buyurtma sizning to\'yxonangizga tegishli emas' });
      }
    }

    const result = await query(
      'UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING booking_id, user_id, hall_id, booking_date::text, guest_count, total_price, status, note, created_at',
      [status, bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bron topilmadi' });
    }

    res.json({ message: 'Bron holati yangilandi', booking: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bronni bekor qilish
 */
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    const bookingCheck = await query('SELECT user_id FROM bookings WHERE booking_id = $1', [bookingId]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Bron topilmadi' });
    }

    if (req.user?.role !== 'admin' && bookingCheck.rows[0].user_id !== req.user?.id) {
      return res.status(403).json({ message: "Sizda ushbu bronni bekor qilish huquqi yo'q" });
    }

    const result = await query(
      "UPDATE bookings SET status = 'cancelled' WHERE booking_id = $1 RETURNING booking_id, status",
      [bookingId]
    );

    res.json({ message: 'Bron bekor qilindi', booking: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Barcha bronlar (Admin)
 */
export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT b.booking_id, b.user_id, b.hall_id, b.booking_date::text, b.guest_count,
             b.total_price, b.status, b.note, b.created_at, u.fullname, h.hall_name
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN wedding_halls h ON b.hall_id = h.hall_id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Owner zallari bo'yicha bronlar
 */
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = await getOwnerIdByUserId(req.user!.id);
    const result = await query(`
      SELECT b.booking_id, b.user_id, b.hall_id, b.booking_date::text, b.guest_count,
             b.total_price, b.status, b.note, b.created_at, u.fullname, h.hall_name
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN wedding_halls h ON b.hall_id = h.hall_id
      WHERE h.owner_id = $1
      ORDER BY b.created_at DESC
    `, [ownerId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Owner statistikasi
 */
export const getOwnerStats = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = await getOwnerIdByUserId(req.user!.id);

    const [hallsRes, bookingsRes, revenueRes] = await Promise.all([
      query('SELECT COUNT(*) FROM wedding_halls WHERE owner_id = $1', [ownerId]),
      query('SELECT COUNT(*) FROM bookings b JOIN wedding_halls h ON b.hall_id = h.hall_id WHERE h.owner_id = $1', [ownerId]),
      query('SELECT COALESCE(SUM(p.amount),0) as revenue FROM payments p JOIN bookings b ON p.booking_id = b.booking_id JOIN wedding_halls h ON b.hall_id = h.hall_id WHERE h.owner_id = $1', [ownerId]),
    ]);

    res.json({
      halls: parseInt(hallsRes.rows[0].count, 10),
      bookings: parseInt(bookingsRes.rows[0].count, 10),
      revenue: parseFloat(revenueRes.rows[0].revenue),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
