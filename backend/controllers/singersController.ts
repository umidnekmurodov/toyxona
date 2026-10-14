import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// ─── Qo'shiqchilar ────────────────────────────────────────────────────────────

export const getSingers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM singers WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const createSinger = async (req: AuthRequest, res: Response) => {
  try {
    const { fullname, price, image_url, description } = req.body;

    if (!fullname) {
      return res.status(400).json({ message: 'Ism majburiy' });
    }

    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Narx majburiy' });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak" });
    }

    if (image_url && !image_url.startsWith('http://') && !image_url.startsWith('https://')) {
      return res.status(400).json({ message: "Image URL noto'g'ri format (http:// yoki https:// bilan boshlanishi kerak)" });
    }

    const result = await query(
      `INSERT INTO singers (fullname, price, image_url, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [fullname, Number(price), image_url || null, description || null]
    );

    res.status(201).json({ message: "Qo'shiqchi yaratildi", singer: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const updateSinger = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullname, price, image_url, description } = req.body;

    if (price !== undefined && price !== null && price !== '' && Number(price) <= 0) {
      return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak" });
    }

    if (image_url && !image_url.startsWith('http://') && !image_url.startsWith('https://')) {
      return res.status(400).json({ message: "Image URL noto'g'ri format (http:// yoki https:// bilan boshlanishi kerak)" });
    }

    const result = await query(
      `UPDATE singers SET
        fullname    = COALESCE($1, fullname),
        price       = COALESCE($2, price),
        image_url   = COALESCE($3, image_url),
        description = COALESCE($4, description),
        updated_at  = CURRENT_TIMESTAMP
       WHERE singer_id = $5 AND is_active = TRUE
       RETURNING *`,
      [
        fullname || null,
        price !== undefined && price !== null && price !== '' ? Number(price) : null,
        image_url || null,
        description || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Qo'shiqchi topilmadi" });
    }

    res.json({ message: "Qo'shiqchi yangilandi", singer: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const deleteSinger = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE singers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE singer_id = $1 AND is_active = TRUE
       RETURNING singer_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Qo'shiqchi topilmadi" });
    }

    res.json({ message: "Qo'shiqchi o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
