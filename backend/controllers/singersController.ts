import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Barcha san'atkorlarni olish
 */
export const getSingers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM singers WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Yangi san'atkor qo'shish (Admin)
 */
export const createSinger = async (req: AuthRequest, res: Response) => {
  try {
    const { fullname, price, image_url, description } = req.body;

    if (!fullname?.trim()) return res.status(400).json({ message: 'San\'atkor ismi majburiy!' });
    if (!price || Number(price) <= 0) return res.status(400).json({ message: "Xizmat narxi 0 dan katta bo'lishi kerak!" });

    const result = await query(
      `INSERT INTO singers (fullname, price, image_url, description) VALUES ($1, $2, $3, $4) RETURNING *`,
      [fullname.trim(), Number(price), image_url || null, description || null]
    );

    res.status(201).json({ message: "San'atkor muvaffaqiyatli qo'shildi", singer: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * San'atkorni tahrirlash (Admin)
 */
export const updateSinger = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullname, price, image_url, description } = req.body;

    const result = await query(
      `UPDATE singers SET
        fullname = COALESCE($1, fullname), price = COALESCE($2, price),
        image_url = COALESCE($3, image_url), description = COALESCE($4, description),
        updated_at = CURRENT_TIMESTAMP
       WHERE singer_id = $5 AND is_active = TRUE RETURNING *`,
      [fullname?.trim() || null, price ? Number(price) : null, image_url || null, description || null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "San'atkor topilmadi" });
    res.json({ message: "San'atkor ma'lumotlari yangilandi", singer: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * San'atkorni o'chirish (Admin)
 */
export const deleteSinger = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE singers SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE singer_id = $1 RETURNING singer_id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "San'atkor topilmadi" });
    res.json({ message: "San'atkor o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
