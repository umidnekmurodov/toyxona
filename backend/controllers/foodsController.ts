import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Barcha faol taom menyularini olish
 */
export const getFoods = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM foods WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Yangi taom menyusi qo'shish (Admin)
 */
export const createFood = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price_per_guest, image_url } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Taom nomi majburiy!' });
    if (!price_per_guest || Number(price_per_guest) <= 0) {
      return res.status(400).json({ message: "Kishi boshiga narx 0 dan katta bo'lishi kerak!" });
    }

    const result = await query(
      `INSERT INTO foods (name, description, price_per_guest, image_url) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), description || null, Number(price_per_guest), image_url || null]
    );

    res.status(201).json({ message: 'Taom menyusi yaratildi', food: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Taom menyusini yangilash (Admin)
 */
export const updateFood = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price_per_guest, image_url } = req.body;

    const result = await query(
      `UPDATE foods SET
         name = COALESCE($1, name), description = COALESCE($2, description),
         price_per_guest = COALESCE($3, price_per_guest), image_url = COALESCE($4, image_url),
         updated_at = CURRENT_TIMESTAMP
       WHERE food_id = $5 RETURNING *`,
      [name?.trim() || null, description !== undefined ? description : null, price_per_guest ? Number(price_per_guest) : null, image_url || null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Taom menyusi topilmadi' });
    res.json({ message: 'Taom menyusi yangilandi', food: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Taom menyusini o'chirish (Admin)
 */
export const deleteFood = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE foods SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE food_id = $1 RETURNING food_id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Taom menyusi topilmadi' });
    res.json({ message: "Taom menyusi o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
