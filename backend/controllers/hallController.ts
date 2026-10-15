import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper: owner_id ni olish yoki yaratish
async function getOwnerIdByUserId(userId: string): Promise<string> {
  const existingOwner = await query('SELECT owner_id FROM owners WHERE user_id = $1', [userId]);
  if (existingOwner.rows.length > 0) {
    return existingOwner.rows[0].owner_id;
  }
  const userRes = await query('SELECT fullname FROM users WHERE user_id = $1', [userId]);
  const companyName = (userRes.rows[0]?.fullname || 'Mening Biznesim') + ' To\'yxonasi';
  const newOwner = await query(
    'INSERT INTO owners (user_id, company_name, verified) VALUES ($1, $2, false) RETURNING owner_id',
    [userId, companyName]
  );
  return newOwner.rows[0].owner_id;
}

/**
 * Barcha to'yxonalarni olish
 */
export const getAllHalls = async (req: AuthRequest, res: Response) => {
  try {
    const { region, capacity, sortBy } = req.query;

    const token = req.headers.authorization?.split(' ')[1];
    let userId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Mehmon
      }
    }

    let sql = `
      SELECT w.*,
        COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
        ${userId ? 'EXISTS(SELECT 1 FROM favorites WHERE hall_id = w.hall_id AND user_id = $1)' : 'false'} AS is_favorited
      FROM wedding_halls w
      WHERE w.is_active = true
    `;
    const params: any[] = userId ? [userId] : [];

    if (region) {
      params.push(`%${region}%`);
      sql += ` AND w.region ILIKE $${params.length}`;
    }

    if (capacity) {
      params.push(parseInt(capacity as string, 10));
      sql += ` AND w.capacity >= $${params.length}`;
    }

    if (sortBy === 'price') {
      sql += ' ORDER BY w.price_per_seat ASC';
    } else if (sortBy === 'rating') {
      sql += ' ORDER BY w.rating DESC';
    } else {
      sql += ' ORDER BY w.created_at DESC';
    }

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxonani ID bo'yicha olish
 */
export const getHallById = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;

    const token = req.headers.authorization?.split(' ')[1];
    let userId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Mehmon
      }
    }

    const sql = `
      SELECT w.*,
        COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
        ${userId ? 'EXISTS(SELECT 1 FROM favorites WHERE hall_id = w.hall_id AND user_id = $2)' : 'false'} AS is_favorited
      FROM wedding_halls w WHERE w.hall_id = $1
    `;
    const params = userId ? [hallId, userId] : [hallId];

    const result = await query(sql, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "To'yxona topilmadi!" });
    }

    const imagesResult = await query('SELECT image_url FROM hall_images WHERE hall_id = $1 ORDER BY created_at ASC', [hallId]);
    const hall = result.rows[0];
    hall.images = imagesResult.rows.map((img) => img.image_url);

    res.json(hall);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxona yaratish
 */
export const createHall = async (req: AuthRequest, res: Response) => {
  try {
    const {
      hallName, description, region, district, address,
      latitude, longitude, capacity, pricePerSeat, phone,
      mainImage, amenities, images,
    } = req.body;

    if (!hallName || !region || !district || !address || !capacity) {
      return res.status(400).json({ message: "Majburiy maydonlarni to'ldiring: nom, viloyat, tuman, manzil, sig'im" });
    }

    if (req.user?.role === 'admin') {
      const client = await getClient();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          `INSERT INTO wedding_halls (
            owner_id, hall_name, description, region, district, address,
            latitude, longitude, capacity, price_per_seat, phone, main_image,
            wifi, parking, air_conditioner, stage, music_system, is_active
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true) RETURNING *`,
          [
            req.body.ownerId || null, hallName, description, region, district,
            address, latitude || 0, longitude || 0, capacity, pricePerSeat,
            phone, mainImage, amenities?.wifi || false, amenities?.parking || false,
            amenities?.airConditioner || false, amenities?.stage || false,
            amenities?.musicSystem || false,
          ]
        );

        const hall = result.rows[0];

        if (Array.isArray(images)) {
          for (const imageUrl of images) {
            if (imageUrl?.trim()) {
              await client.query('INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)', [hall.hall_id, imageUrl.trim()]);
            }
          }
        }

        await client.query('COMMIT');
        return res.status(201).json({ message: "To'yxona muvaffaqiyatli yaratildi", hall });
      } catch (err: any) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: err.message });
      } finally {
        client.release();
      }
    } else {
      const ownerId = await getOwnerIdByUserId(req.user!.id);
      const requestData = {
        hallName, description, region, district, address,
        latitude, longitude, capacity, pricePerSeat, phone,
        mainImage, amenities, images,
      };

      await query(
        'INSERT INTO approval_requests (owner_id, request_type, status, data) VALUES ($1, $2, $3, $4)',
        [ownerId, 'create', 'pending', JSON.stringify(requestData)]
      );

      return res.status(202).json({
        message: "To'yxona qo'shish so'rovi adminga yuborildi. Tasdiqlangach e'londa ko'rinadi.",
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxonani tahrirlash
 */
export const updateHall = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { hallName, description, capacity, pricePerSeat, phone, amenities, mainImage, images } = req.body;

    if (req.user?.role === 'admin') {
      const client = await getClient();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          `UPDATE wedding_halls SET
             hall_name = COALESCE($1, hall_name), description = COALESCE($2, description),
             capacity = COALESCE($3, capacity), price_per_seat = COALESCE($4, price_per_seat),
             phone = COALESCE($5, phone), wifi = COALESCE($6, wifi), parking = COALESCE($7, parking),
             air_conditioner = COALESCE($8, air_conditioner), stage = COALESCE($9, stage),
             music_system = COALESCE($10, music_system), main_image = COALESCE($11, main_image),
             updated_at = CURRENT_TIMESTAMP
           WHERE hall_id = $12 RETURNING *`,
          [
            hallName, description, capacity, pricePerSeat, phone,
            amenities?.wifi, amenities?.parking, amenities?.airConditioner,
            amenities?.stage, amenities?.musicSystem, mainImage, hallId,
          ]
        );

        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: "To'yxona topilmadi!" });
        }

        if (Array.isArray(images)) {
          await client.query('DELETE FROM hall_images WHERE hall_id = $1', [hallId]);
          for (const imageUrl of images) {
            if (imageUrl?.trim()) {
              await client.query('INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)', [hallId, imageUrl.trim()]);
            }
          }
        }

        await client.query('COMMIT');
        return res.json({ message: "To'yxona ma'lumotlari yangilandi", hall: result.rows[0] });
      } catch (err: any) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: err.message });
      } finally {
        client.release();
      }
    } else {
      const hallResult = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
      if (hallResult.rows.length === 0) {
        return res.status(404).json({ message: "To'yxona topilmadi!" });
      }

      const ownerId = await getOwnerIdByUserId(req.user!.id);
      if (hallResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({ message: "Bu to'yxona sizga tegishli emas!" });
      }

      const requestData = { hallName, description, capacity, pricePerSeat, phone, amenities, mainImage, images };
      await query(
        'INSERT INTO approval_requests (hall_id, owner_id, request_type, status, data) VALUES ($1, $2, $3, $4, $5)',
        [hallId, ownerId, 'update', 'pending', JSON.stringify(requestData)]
      );

      return res.status(202).json({
        message: "Tahrirlash so'rovi adminga yuborildi. Tasdiqlangach o'zgaradi.",
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxonani o'chirish
 */
export const deleteHall = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;

    if (req.user?.role === 'owner') {
      const ownerId = await getOwnerIdByUserId(req.user.id);
      const hallResult = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
      if (hallResult.rows.length === 0) {
        return res.status(404).json({ message: "To'yxona topilmadi!" });
      }
      if (hallResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({ message: "Bu to'yxona sizga tegishli emas!" });
      }
    }

    const hallResult = await query('SELECT hall_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
    if (hallResult.rows.length === 0) {
      return res.status(404).json({ message: "To'yxona topilmadi!" });
    }

    await query('DELETE FROM wedding_halls WHERE hall_id = $1', [hallId]);
    res.json({ message: "To'yxona muvaffaqiyatli o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxonaga yangi rasm qo'shish
 */
export const addHallImages = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "Rasmlar ro'yxati bo'sh bo'lmasligi kerak" });
    }

    if (req.user?.role === 'owner') {
      const ownerId = await getOwnerIdByUserId(req.user.id);
      const hallResult = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
      if (hallResult.rows.length === 0 || hallResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({ message: "Bu to'yxona sizga tegishli emas!" });
      }
    }

    for (const imageUrl of images) {
      if (imageUrl?.trim()) {
        await query('INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)', [hallId, imageUrl.trim()]);
      }
    }

    res.status(201).json({ message: "Rasmlar muvaffaqiyatli qo'shildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Bo'sh sanalarni tekshirish
 */
export const getHallAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end
      ? new Date(end as string)
      : new Date(new Date().setDate(new Date().getDate() + 30));

    if (startDate > endDate) {
      return res.status(400).json({ message: "Boshlanish sanasi tugash sanasidan oldin bo'lishi kerak!" });
    }

    const bookedRes = await query(
      `SELECT booking_date::text FROM bookings
       WHERE hall_id = $1 AND booking_date BETWEEN $2 AND $3
       AND status IN ('pending', 'confirmed')`,
      [hallId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    const bookedSet = new Set(bookedRes.rows.map((r) => r.booking_date));
    const dates: string[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = new Date(d).toISOString().split('T')[0];
      if (!bookedSet.has(day)) dates.push(day);
    }

    res.json({ available: dates });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Ownerning o'z zallari
 */
export const getMyHalls = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = await getOwnerIdByUserId(req.user!.id);
    const result = await query(
      'SELECT * FROM wedding_halls WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Owner arizalari
 */
export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = await getOwnerIdByUserId(req.user!.id);
    const result = await query(
      `SELECT hr.*, w.hall_name as existing_hall_name
       FROM approval_requests hr
       LEFT JOIN wedding_halls w ON hr.hall_id = w.hall_id
       WHERE hr.owner_id = $1
       ORDER BY hr.created_at DESC`,
      [ownerId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
