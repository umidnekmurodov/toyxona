import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// Sharh yaratish
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId, rating, comment } = req.body;

    if (!hallId || !rating) {
      return res.status(400).json({ message: 'Barcha maydonni to\'ldiring' });
    }

    const result = await query(
      'INSERT INTO reviews (user_id, hall_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, hallId, rating, comment || null]
    );

    // To'yxona reyting o'rtachalasin yangilash
    await updateHallRating(hallId);

    res.status(201).json({ message: 'Sharh qo\'shildi', review: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// To'yxona uchun sharh olish
export const getHallReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { hallId } = req.params;

    const result = await query(
      'SELECT r.*, u.fullname, u.avatar FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.hall_id = $1 ORDER BY r.created_at DESC',
      [hallId]
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Sharh yangilash
export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    // Tekshirish - bu sharh foydalanuvchiga tegishli
    const reviewResult = await query('SELECT * FROM reviews WHERE review_id = $1 AND user_id = $2', [reviewId, req.user.id]);

    if (reviewResult.rows.length === 0) {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }

    const result = await query('UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment) WHERE review_id = $3 RETURNING *', [rating, comment, reviewId]);

    // Reyting o'rtachasini yangilash
    const hallId = reviewResult.rows[0].hall_id;
    await updateHallRating(hallId);

    res.json({ message: 'Sharh yangilandi', review: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Sharh o'chirish
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;

    // Tekshirish
    const reviewResult = await query('SELECT * FROM reviews WHERE review_id = $1 AND user_id = $2', [reviewId, req.user.id]);

    if (reviewResult.rows.length === 0) {
      return res.status(403).json({ message: 'Ruxsat yo\'q' });
    }

    const hallId = reviewResult.rows[0].hall_id;

    await query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);

    // Reyting o'rtachasini yangilash
    await updateHallRating(hallId);

    res.json({ message: 'Sharh o\'chirildi' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Foydalanuvchining o'z sharhlarini olish
export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT r.*, u.fullname, u.avatar, h.hall_name FROM reviews r JOIN users u ON r.user_id = u.user_id JOIN wedding_halls h ON r.hall_id = h.hall_id WHERE r.user_id = $1 ORDER BY r.created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Yordamchi: To'yxona reyting o'rtachasini yangilash
async function updateHallRating(hallId: string) {
  try {
    const result = await query('SELECT AVG(rating)::NUMERIC(2,1) as avg_rating FROM reviews WHERE hall_id = $1', [hallId]);

    const avgRating = result.rows[0].avg_rating || 0;

    await query('UPDATE wedding_halls SET rating = $1 WHERE hall_id = $2', [avgRating, hallId]);
  } catch (error) {
    console.error('Reyting o\'rtachasini yangilashda xato:', error);
  }
}
