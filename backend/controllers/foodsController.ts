import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// Barcha faol ovqat menyu elementlarini olish (public)
export const getFoods = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM foods WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Yangi ovqat menyu elementi yaratish (admin only)
export const createFood = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price_per_guest, image_url } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Nomi majburiy' });
    }

    if (price_per_guest === undefined || price_per_guest === null || price_per_guest === '') {
      return res.status(400).json({ message: 'Kishi boshiga narx majburiy' });
    }

    if (Number(price_per_guest) <= 0) {
      return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak" });
    }

    if (image_url && !/^https?:\/\//i.test(image_url)) {
      return res.status(400).json({
        message: "Image URL noto'g'ri format (http:// yoki https:// bilan boshlanishi kerak)",
      });
    }

    const result = await query(
      `INSERT INTO foods (name, description, price_per_guest, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, Number(price_per_guest), image_url || null]
    );

    res.status(201).json({ message: 'Ovqat menyusi yaratildi', food: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Ovqat menyu elementini yangilash (admin only)
export const updateFood = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price_per_guest, image_url } = req.body;

    if (price_per_guest !== undefined && price_per_guest !== null && price_per_guest !== '') {
      if (Number(price_per_guest) <= 0) {
        return res.status(400).json({ message: "Narx 0 dan katta bo'lishi kerak" });
      }
    }

    if (image_url && !/^https?:\/\//i.test(image_url)) {
      return res.status(400).json({
        message: "Image URL noto'g'ri format (http:// yoki https:// bilan boshlanishi kerak)",
      });
    }

    const result = await query(
      `UPDATE foods SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         price_per_guest = COALESCE($3, price_per_guest),
         image_url = COALESCE($4, image_url),
         updated_at = CURRENT_TIMESTAMP
       WHERE food_id = $5
       RETURNING *`,
      [
        name || null,
        description !== undefined ? description : null,
        price_per_guest !== undefined && price_per_guest !== null && price_per_guest !== ''
          ? Number(price_per_guest)
          : null,
        image_url || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ovqat menyusi topilmadi' });
    }

    res.json({ message: 'Ovqat menyusi yangilandi', food: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Ovqat menyu elementini o'chirish — soft delete (admin only)
export const deleteFood = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE foods SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE food_id = $1 AND is_active = TRUE
       RETURNING food_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ovqat menyusi topilmadi' });
    }

    res.json({ message: "Ovqat menyusi o'chirildi" });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
