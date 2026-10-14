import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// Sevimli qo'shish
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.body;

    // Tekshirish - allaqachon sevimli qo'shilganmi
    const existResult = await query('SELECT * FROM favorites WHERE user_id = $1 AND hall_id = $2', [req.user.id, hallId]);

    if (existResult.rows.length > 0) {
      return res.status(400).json({ message: 'Bu to\'yxona allaqachon sevimliga qo\'shilgan' });
    }

    const result = await query('INSERT INTO favorites (user_id, hall_id) VALUES ($1, $2) RETURNING *', [req.user.id, hallId]);

    res.status(201).json({ message: 'Sevimliga qo\'shildi', favorite: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Sevimlilarni olish
export const getUserFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT h.* FROM favorites f JOIN wedding_halls h ON f.hall_id = h.hall_id WHERE f.user_id = $1 ORDER BY f.created_at DESC', [req.user.id]);

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Sevimlilardan o'chirish
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;

    await query('DELETE FROM favorites WHERE user_id = $1 AND hall_id = $2', [req.user.id, hallId]);

    res.json({ message: 'Sevimlilardan o\'chirildi' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Barcha sevimlilar (admin)
export const getAllFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT f.*, u.fullname, h.hall_name FROM favorites f JOIN users u ON f.user_id = u.user_id JOIN wedding_halls h ON f.hall_id = h.hall_id ORDER BY f.created_at DESC');

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
