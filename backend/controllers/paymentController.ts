import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * To'lov yaratish
 */
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    const bookingResult = await query(
      'SELECT booking_id FROM bookings WHERE booking_id = $1 AND user_id = $2',
      [bookingId, req.user?.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }

    const result = await query(
      'INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [bookingId, amount, paymentMethod, 'unpaid']
    );

    res.status(201).json({ message: "To'lov so'rovi yaratildi", payment: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Foydalanuvchi to'lovlari
 */
export const getUserPayments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT p.* FROM payments p
       JOIN bookings b ON p.booking_id = b.booking_id
       WHERE b.user_id = $1 ORDER BY p.created_at DESC`,
      [req.user?.id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * To'lov holatini yangilash (Admin)
 */
export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, transactionId } = req.body;

    const result = await query(
      `UPDATE payments SET
        payment_status = $1, transaction_id = COALESCE($2, transaction_id),
        paid_at = CASE WHEN $1 = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END
       WHERE payment_id = $3 RETURNING *`,
      [paymentStatus, transactionId, paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "To'lov topilmadi" });
    }

    res.json({ message: "To'lov holati yangilandi", payment: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Barcha to'lovlar (Admin)
 */
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT p.*, b.booking_id, u.fullname FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN users u ON b.user_id = u.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
