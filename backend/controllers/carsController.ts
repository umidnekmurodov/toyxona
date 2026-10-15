import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Barcha faol avtomobillarni olish
 */
export const getCars = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM cars WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Yangi avtomobil qo'shish (Admin)
 */
export const createCar = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, brand, model_year, image_url } = req.body;

    if (!name?.trim()) return res.status(400).json({ message: 'Avtomobil nomi majburiy!' });
    if (!price || Number(price) <= 0) return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak!" });

    const result = await query(
      `INSERT INTO cars (name, price, brand, model_year, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), Number(price), brand || null, model_year ? Number(model_year) : null, image_url || null]
    );

    res.status(201).json({ message: 'Avtomobil muvaffaqiyatli qo\'shildi', car: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Avtomobilni tahrirlash (Admin)
 */
export const updateCar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, brand, model_year, image_url } = req.body;

    const result = await query(
      `UPDATE cars SET
         name = COALESCE($1, name), price = COALESCE($2, price), brand = COALESCE($3, brand),
         model_year = COALESCE($4, model_year), image_url = COALESCE($5, image_url),
         updated_at = CURRENT_TIMESTAMP
       WHERE car_id = $6 RETURNING *`,
      [name?.trim() || null, price ? Number(price) : null, brand || null, model_year ? Number(model_year) : null, image_url || null, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Avtomobil topilmadi' });
    res.json({ message: 'Avtomobil yangilandi', car: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Avtomobilni o'chirish (Admin)
 */
export const deleteCar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('UPDATE cars SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE car_id = $1 RETURNING car_id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Avtomobil topilmadi' });
    res.json({ message: "Avtomobil o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
