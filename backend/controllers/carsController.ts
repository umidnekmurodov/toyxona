import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// Barcha faol avtomobillarni olish (public)
export const getCars = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM cars WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Avtomobil yaratish (admin only)
export const createCar = async (req: AuthRequest, res: Response) => {
  try {
    const { name, price, brand, model_year, image_url } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ message: 'Nomi majburiy' });
    }

    if (price === undefined || price === null || String(price).trim() === '') {
      return res.status(400).json({ message: 'Narx majburiy' });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak" });
    }

    if (model_year !== undefined && model_year !== null && String(model_year).trim() !== '') {
      const currentYear = new Date().getFullYear();
      const yearNum = Number(model_year);
      if (isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
        return res.status(400).json({ message: "Model yili noto'g'ri (1980 dan katta, joriy yildan oshmasin)" });
      }
    }

    if (image_url && !image_url.startsWith('http://') && !image_url.startsWith('https://')) {
      return res.status(400).json({ message: "Image URL noto'g'ri format (http:// yoki https:// bilan boshlanishi kerak)" });
    }

    const result = await query(
      `INSERT INTO cars (name, price, brand, model_year, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        String(name).trim(),
        priceNum,
        brand || null,
        model_year ? Number(model_year) : null,
        image_url || null,
      ]
    );

    res.status(201).json({ message: 'Avtomobil yaratildi', car: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Avtomobil yangilash (admin only)
export const updateCar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, brand, model_year, image_url } = req.body;

    if (price !== undefined && price !== null && Number(price) <= 0) {
      return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak" });
    }

    if (model_year !== undefined && model_year !== null && String(model_year).trim() !== '') {
      const currentYear = new Date().getFullYear();
      const yearNum = Number(model_year);
      if (isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
        return res.status(400).json({ message: "Model yili noto'g'ri (1980 dan katta, joriy yildan oshmasin)" });
      }
    }

    if (image_url && !image_url.startsWith('http://') && !image_url.startsWith('https://')) {
      return res.status(400).json({ message: "Image URL noto'g'ri format (http:// yoki https:// bilan boshlanishi kerak)" });
    }

    const result = await query(
      `UPDATE cars SET
         name       = COALESCE($1, name),
         price      = COALESCE($2, price),
         brand      = COALESCE($3, brand),
         model_year = COALESCE($4, model_year),
         image_url  = COALESCE($5, image_url),
         updated_at = CURRENT_TIMESTAMP
       WHERE car_id = $6
       RETURNING *`,
      [
        name ? String(name).trim() : null,
        price !== undefined && price !== null ? Number(price) : null,
        brand || null,
        model_year ? Number(model_year) : null,
        image_url || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Avtomobil topilmadi' });
    }

    res.json({ message: 'Avtomobil yangilandi', car: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Avtomobil o'chirish — soft delete (admin only)
export const deleteCar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE cars SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE car_id = $1 AND is_active = TRUE
       RETURNING car_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Avtomobil topilmadi' });
    }

    res.json({ message: "Avtomobil o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
