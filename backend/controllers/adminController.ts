import { Response } from 'express';
import { query, getClient } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Barcha foydalanuvchilar (Admin uchun)
 */
export const getAllUsersAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT user_id, fullname, username, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Foydalanuvchini bloklash / blokdan chiqarish
 */
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { block } = req.body;

    if (userId === req.user?.id) {
      return res.status(400).json({ message: "O'zingizni bloklay olmaysiz!" });
    }

    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, fullname, is_active',
      [!block, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi!' });
    }

    await query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user?.id, block ? 'BLOCK_USER' : 'UNBLOCK_USER', `Foydalanuvchi: ${result.rows[0].fullname} (ID: ${userId})`]
    );

    res.json({
      message: block ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi faollashtirildi',
      user: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Foydalanuvchini o'chirish
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId === req.user?.id) {
      return res.status(400).json({ message: "O'z profilingizni o'chira olmaysiz!" });
    }

    const result = await query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi!' });
    }

    res.json({ message: "Foydalanuvchi muvaffaqiyatli o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxonani tasdiqlash / faollashtirish
 */
export const approveHall = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { approve } = req.body;

    const result = await query(
      'UPDATE wedding_halls SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE hall_id = $2 RETURNING hall_id, hall_name, is_active',
      [approve, hallId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "To'yxona topilmadi!" });
    }

    res.json({
      message: approve ? "To'yxona tasdiqlandi" : "To'yxona faolsizlantirildi",
      hall: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxonani butunlay o'chirish
 */
export const deleteHallAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const result = await query('DELETE FROM wedding_halls WHERE hall_id = $1 RETURNING hall_id', [hallId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "To'yxona topilmadi!" });
    }

    res.json({ message: "To'yxona muvaffaqiyatli o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Barcha to'yxonalar (Admin ko'rinishi)
 */
export const getAllHallsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT w.*, o.company_name, u.fullname as owner_name
      FROM wedding_halls w
      LEFT JOIN owners o ON w.owner_id = o.owner_id
      LEFT JOIN users u ON o.user_id = u.user_id
      ORDER BY w.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Barcha to'yxona egalari
 */
export const getAllOwners = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT o.owner_id, o.company_name, u.fullname as owner_name, u.email, u.phone
      FROM owners o
      JOIN users u ON o.user_id = u.user_id
      ORDER BY u.fullname ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Admin statistikasi
 */
export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const [usersRes, hallsRes, bookingsRes, paymentsRes, pendingRes] = await Promise.all([
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM wedding_halls WHERE is_active = true'),
      query('SELECT COUNT(*) FROM bookings'),
      query('SELECT COUNT(*) FROM payments'),
      query("SELECT COUNT(*) FROM approval_requests WHERE status = 'pending'"),
    ]);

    res.json({
      users: parseInt(usersRes.rows[0].count, 10),
      halls: parseInt(hallsRes.rows[0].count, 10),
      bookings: parseInt(bookingsRes.rows[0].count, 10),
      payments: parseInt(paymentsRes.rows[0].count, 10),
      pendingRequests: parseInt(pendingRes.rows[0].count, 10),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxona so'rovlari
 */
export const getHallRequests = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT
        hr.request_id, hr.hall_id, hr.owner_id, hr.request_type, hr.status,
        hr.data, hr.admin_comment, hr.approved_by, hr.approved_at, hr.created_at,
        o.company_name, u.fullname as owner_name, w.hall_name as existing_hall_name
      FROM approval_requests hr
      JOIN owners o ON hr.owner_id = o.owner_id
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN wedding_halls w ON hr.hall_id = w.hall_id
      ORDER BY hr.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxona so'rovini tasdiqlash
 */
export const approveHallRequest = async (req: AuthRequest, res: Response) => {
  const client = await getClient();
  try {
    const { requestId } = req.params;
    await client.query('BEGIN');

    const requestRes = await client.query('SELECT * FROM approval_requests WHERE request_id = $1', [requestId]);
    if (requestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "So'rov topilmadi!" });
    }

    const request = requestRes.rows[0];
    if (request.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Bu so'rov allaqachon ko'rib chiqilgan!" });
    }

    const data = typeof request.data === 'string' ? JSON.parse(request.data) : request.data;

    if (request.request_type === 'create') {
      const hallRes = await client.query(
        `INSERT INTO wedding_halls (
          owner_id, hall_name, description, region, district, address,
          latitude, longitude, capacity, price_per_seat, phone, main_image,
          wifi, parking, air_conditioner, stage, music_system, is_active
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true)
        RETURNING hall_id`,
        [
          request.owner_id, data.hallName, data.description, data.region, data.district,
          data.address, data.latitude || 0, data.longitude || 0, data.capacity, data.pricePerSeat,
          data.phone, data.mainImage, data.amenities?.wifi || false, data.amenities?.parking || false,
          data.amenities?.airConditioner || false, data.amenities?.stage || false,
          data.amenities?.musicSystem || false,
        ]
      );

      const hallId = hallRes.rows[0].hall_id;

      if (Array.isArray(data.images)) {
        for (const imageUrl of data.images) {
          if (imageUrl?.trim()) {
            await client.query('INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)', [hallId, imageUrl.trim()]);
          }
        }
      }

      await client.query(
        `UPDATE approval_requests SET status = 'approved', hall_id = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE request_id = $3`,
        [hallId, req.user?.id, requestId]
      );
    } else if (request.request_type === 'update') {
      const hallId = request.hall_id;
      await client.query(
        `UPDATE wedding_halls SET
          hall_name = COALESCE($1, hall_name), description = COALESCE($2, description),
          capacity = COALESCE($3, capacity), price_per_seat = COALESCE($4, price_per_seat),
          phone = COALESCE($5, phone), wifi = COALESCE($6, wifi), parking = COALESCE($7, parking),
          air_conditioner = COALESCE($8, air_conditioner), stage = COALESCE($9, stage),
          music_system = COALESCE($10, music_system), main_image = COALESCE($11, main_image),
          updated_at = CURRENT_TIMESTAMP
        WHERE hall_id = $12`,
        [
          data.hallName, data.description, data.capacity, data.pricePerSeat, data.phone,
          data.amenities?.wifi, data.amenities?.parking, data.amenities?.airConditioner,
          data.amenities?.stage, data.amenities?.musicSystem, data.mainImage, hallId,
        ]
      );

      if (Array.isArray(data.images)) {
        await client.query('DELETE FROM hall_images WHERE hall_id = $1', [hallId]);
        for (const imageUrl of data.images) {
          if (imageUrl?.trim()) {
            await client.query('INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)', [hallId, imageUrl.trim()]);
          }
        }
      }

      await client.query(
        `UPDATE approval_requests SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE request_id = $2`,
        [req.user?.id, requestId]
      );
    }

    await client.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user?.id, 'APPROVE_HALL_REQUEST', `So'rov ID: ${requestId}, Turi: ${request.request_type}`]
    );

    await client.query('COMMIT');
    res.json({ message: "So'rov muvaffaqiyatli tasdiqlandi!" });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Serverda xatolik: ' + error.message });
  } finally {
    client.release();
  }
};

/**
 * To'yxona so'rovini rad etish
 */
export const rejectHallRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { comment, adminComment } = req.body;
    const finalComment = comment || adminComment;

    const result = await query(
      `UPDATE approval_requests SET
        status = 'rejected', admin_comment = $1, approved_by = $2,
        approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE request_id = $3 AND status = 'pending'
       RETURNING *`,
      [finalComment || null, req.user?.id, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "So'rov topilmadi yoki allaqachon ko'rib chiqilgan!" });
    }

    await query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user?.id, 'REJECT_HALL_REQUEST', `So'rov ID: ${requestId}, Sababi: ${finalComment || 'Izohsiz'}`]
    );

    res.json({ message: "So'rov rad etildi", request: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
