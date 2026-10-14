import { Response } from 'express';
import { query, getClient } from '../db';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';

// Barcha to'yxonalar olish
export const getAllHalls = async (req: AuthRequest, res: Response) => {
  try {
    const { region, capacity, sortBy } = req.query;

    const token = req.headers.authorization?.split(' ')[1];
    let userId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        userId = decoded.id;
      } catch {
        // ignore — guest user
      }
    }

    let sql = '';
    const params: any[] = [];

    if (userId) {
      sql = `
        SELECT w.*,
          COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
          EXISTS(SELECT 1 FROM favorites WHERE hall_id = w.hall_id AND user_id = $1) AS is_favorited
        FROM wedding_halls w
        WHERE w.is_active = true
      `;
      params.push(userId);
    } else {
      sql = `
        SELECT w.*,
          COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
          false AS is_favorited
        FROM wedding_halls w
        WHERE w.is_active = true
      `;
    }

    if (region) {
      sql += ' AND w.region ILIKE $' + (params.length + 1);
      params.push(`%${region}%`);
    }

    if (capacity) {
      sql += ' AND w.capacity >= $' + (params.length + 1);
      params.push(parseInt(capacity as string, 10));
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
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// To'yxona ID bo'yicha olish
export const getHallById = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;

    const token = req.headers.authorization?.split(' ')[1];
    let userId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        userId = decoded.id;
      } catch {
        // ignore
      }
    }

    let result;
    if (userId) {
      result = await query(
        `SELECT w.*,
           COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
           EXISTS(SELECT 1 FROM favorites WHERE hall_id = w.hall_id AND user_id = $2) AS is_favorited
         FROM wedding_halls w WHERE w.hall_id = $1`,
        [hallId, userId]
      );
    } else {
      result = await query(
        `SELECT w.*,
           COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
           false AS is_favorited
         FROM wedding_halls w WHERE w.hall_id = $1`,
        [hallId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'To\'yxona topilmadi' });
    }

    const imagesResult = await query('SELECT image_url FROM hall_images WHERE hall_id = $1 ORDER BY created_at ASC', [hallId]);

    const hall = result.rows[0];
    hall.images = imagesResult.rows.map((img) => img.image_url);

    res.json(hall);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// To'yxona yaratish (owner — request yuboradi, admin — to'g'ridan-to'g'ri)
export const createHall = async (req: AuthRequest, res: Response) => {
  try {
    const {
      hallName, description, region, district, address,
      latitude, longitude, capacity, pricePerSeat, phone,
      mainImage, amenities, images,
    } = req.body;

    if (!hallName || !region || !district || !address || !capacity) {
      return res.status(400).json({ message: 'Majburiy maydonlarni to\'ldiring: nom, hudud, tuman, manzil, sig\'im' });
    }

    if (req.user.role === 'admin') {
      // Admin — to'g'ridan-to'g'ri yaratadi
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
            phone, mainImage,
            amenities?.wifi || false, amenities?.parking || false,
            amenities?.airConditioner || false, amenities?.stage || false,
            amenities?.musicSystem || false,
          ]
        );

        const hall = result.rows[0];

        if (images && Array.isArray(images)) {
          for (const imageUrl of images) {
            if (imageUrl && imageUrl.trim()) {
              await client.query(
                'INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)',
                [hall.hall_id, imageUrl.trim()]
              );
            }
          }
        }

        await client.query('COMMIT');
        return res.status(201).json({ message: 'To\'yxona yaratildi', hall });
      } catch (err: any) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: err.message });
      } finally {
        client.release();
      }

    } else {
      // ✅ Owner — request yuboradi (approval workflow)
      let ownerResult = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        // Auto-create missing owner record
        const userRes = await query('SELECT fullname FROM users WHERE user_id = $1', [req.user.id]);
        const companyName = (userRes.rows[0]?.fullname || 'Owner') + ' Kompaniyasi';
        ownerResult = await query(
          'INSERT INTO owners (user_id, company_name, verified) VALUES ($1, $2, false) RETURNING owner_id',
          [req.user.id, companyName]
        );
      }
      const ownerId = ownerResult.rows[0].owner_id;

      const requestData = {
        hallName, description, region, district, address,
        latitude, longitude, capacity, pricePerSeat, phone,
        mainImage, amenities, images,
      };

      await query(
        `INSERT INTO approval_requests (owner_id, request_type, status, data) VALUES ($1, $2, $3, $4)`,
        [ownerId, 'create', 'pending', JSON.stringify(requestData)]
      );

      return res.status(202).json({
        message: 'To\'yxona qo\'shish so\'rovi adminga yuborildi. Tasdiqlangach e\'lon qilinadi.',
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// To'yxona yangilash
export const updateHall = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { hallName, description, capacity, pricePerSeat, phone, amenities, mainImage, images } = req.body;

    if (req.user.role === 'admin') {
      const client = await getClient();
      try {
        await client.query('BEGIN');
        const result = await client.query(
          `UPDATE wedding_halls SET
             hall_name = COALESCE($1, hall_name),
             description = COALESCE($2, description),
             capacity = COALESCE($3, capacity),
             price_per_seat = COALESCE($4, price_per_seat),
             phone = COALESCE($5, phone),
             wifi = COALESCE($6, wifi),
             parking = COALESCE($7, parking),
             air_conditioner = COALESCE($8, air_conditioner),
             stage = COALESCE($9, stage),
             music_system = COALESCE($10, music_system),
             main_image = COALESCE($11, main_image),
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
          return res.status(404).json({ message: 'To\'yxona topilmadi' });
        }

        if (images && Array.isArray(images)) {
          await client.query('DELETE FROM hall_images WHERE hall_id = $1', [hallId]);
          for (const imageUrl of images) {
            if (imageUrl && imageUrl.trim()) {
              await client.query(
                'INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)',
                [hallId, imageUrl.trim()]
              );
            }
          }
        }

        await client.query('COMMIT');
        return res.json({ message: 'To\'yxona yangilandi', hall: result.rows[0] });
      } catch (err: any) {
        await client.query('ROLLBACK');
        return res.status(500).json({ message: err.message });
      } finally {
        client.release();
      }

    } else {
      // Owner — update request yuboradi
      const hallResult = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
      if (hallResult.rows.length === 0) {
        return res.status(404).json({ message: 'To\'yxona topilmadi' });
      }

      let ownerResult = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        const userRes = await query('SELECT fullname FROM users WHERE user_id = $1', [req.user.id]);
        const companyName = (userRes.rows[0]?.fullname || 'Owner') + ' Kompaniyasi';
        ownerResult = await query(
          'INSERT INTO owners (user_id, company_name, verified) VALUES ($1, $2, false) RETURNING owner_id',
          [req.user.id, companyName]
        );
      }
      if (hallResult.rows[0].owner_id !== ownerResult.rows[0].owner_id) {
        return res.status(403).json({ message: 'Bu to\'yxona sizga tegishli emas' });
      }
      const ownerId = ownerResult.rows[0].owner_id;
      const requestData = { hallName, description, capacity, pricePerSeat, phone, amenities, mainImage, images };

      await query(
        `INSERT INTO approval_requests (hall_id, owner_id, request_type, status, data) VALUES ($1, $2, $3, $4, $5)`,
        [hallId, ownerId, 'update', 'pending', JSON.stringify(requestData)]
      );

      return res.status(202).json({
        message: 'Tahrirlash so\'rovi adminga yuborildi. Tasdiqlangach o\'zgaradi.',
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// ✅ FIX [BUG-002, BUG-013]: To'yxona o'chirish
// Owner to'g'ridan-to'g'ri o'chira OLMAYDI — faqat admin o'chira oladi
export const deleteHall = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;

    if (req.user.role === 'owner') {
      const ownerResult = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        return res.status(403).json({ message: 'Owner topilmadi' });
      }
      const ownerId = ownerResult.rows[0].owner_id;

      const hallResult = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
      if (hallResult.rows.length === 0) {
        return res.status(404).json({ message: 'To\'yxona topilmadi' });
      }
      if (hallResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({ message: 'Bu to\'yxona sizga tegishli emas' });
      }
    }

    const hallResult = await query('SELECT hall_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
    if (hallResult.rows.length === 0) {
      return res.status(404).json({ message: 'To\'yxona topilmadi' });
    }

    await query('DELETE FROM wedding_halls WHERE hall_id = $1', [hallId]);
    res.json({ message: 'To\'yxona o\'chirildi' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// To'yxona rasmlarini qo'shish
export const addHallImages = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Rasmlar ro\'yxati bo\'sh' });
    }

    // ✅ Security [BOLA Fix]: check owner permission
    if (req.user.role === 'owner') {
      const ownerResult = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
      if (ownerResult.rows.length === 0) {
        return res.status(403).json({ message: 'Faqat to\'yxona egalari rasm qo\'sha oladi' });
      }
      const ownerId = ownerResult.rows[0].owner_id;

      const hallResult = await query('SELECT owner_id FROM wedding_halls WHERE hall_id = $1', [hallId]);
      if (hallResult.rows.length === 0 || hallResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({ message: 'Bu to\'yxona sizga tegishli emas yoki ruxsat yo\'q' });
      }
    }

    for (const imageUrl of images) {
      if (imageUrl && imageUrl.trim()) {
        await query('INSERT INTO hall_images (hall_id, image_url) VALUES ($1, $2)', [hallId, imageUrl.trim()]);
      }
    }

    res.status(201).json({ message: 'Rasmlar qo\'shildi' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Hall availability
export const getHallAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end
      ? new Date(end as string)
      : new Date(new Date().setDate(new Date().getDate() + 30));

    if (startDate > endDate) {
      return res.status(400).json({ message: 'Boshlanish sanasi tugash sanasidan oldin bo\'lishi kerak' });
    }

    const bookedRes = await query(
      `SELECT booking_date::text FROM bookings
       WHERE hall_id = $1 AND booking_date BETWEEN $2 AND $3
       AND status IN ('pending', 'confirmed')`,
      [hallId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    const bookedSet = new Set(
      bookedRes.rows.map((r) => r.booking_date)
    );

    const dates: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const day = new Date(d).toISOString().split('T')[0];
      if (!bookedSet.has(day)) dates.push(day);
    }

    res.json({ available: dates });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Owner o'zining to'yxonalarini olish
export const getMyHalls = async (req: AuthRequest, res: Response) => {
  try {
    // Auto-create owner record if missing (handles manually-set role='owner' users)
    let ownerResult = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
    if (ownerResult.rows.length === 0) {
      const userRes = await query('SELECT fullname FROM users WHERE user_id = $1', [req.user.id]);
      const companyName = (userRes.rows[0]?.fullname || 'Owner') + ' Kompaniyasi';
      ownerResult = await query(
        'INSERT INTO owners (user_id, company_name, verified) VALUES ($1, $2, false) RETURNING owner_id',
        [req.user.id, companyName]
      );
    }
    const ownerId = ownerResult.rows[0].owner_id;
    const result = await query(
      'SELECT * FROM wedding_halls WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Owner o'zining so'rovlarini olish
export const getMyRequests = async (req: AuthRequest, res: Response) => {
  try {
    // Auto-create owner record if missing
    let ownerResult = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
    if (ownerResult.rows.length === 0) {
      const userRes = await query('SELECT fullname FROM users WHERE user_id = $1', [req.user.id]);
      const companyName = (userRes.rows[0]?.fullname || 'Owner') + ' Kompaniyasi';
      ownerResult = await query(
        'INSERT INTO owners (user_id, company_name, verified) VALUES ($1, $2, false) RETURNING owner_id',
        [req.user.id, companyName]
      );
    }
    const ownerId = ownerResult.rows[0].owner_id;
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
    res.status(500).json({ message: 'Server xatosi' });
  }
};
