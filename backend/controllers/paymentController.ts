import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

// To'lov yaratish
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, amount, paymentMethod } = req.body;

    // Booking ma'lumotlarini tekshirish
    const bookingResult = await query('SELECT * FROM bookings WHERE booking_id = $1 AND user_id = $2', [bookingId, req.user.id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking topilmadi' });
    }

    const result = await query(
      'INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [bookingId, amount, paymentMethod, 'unpaid']
    );

    res.status(201).json({ message: 'To\'lov yaratildi', payment: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// To'lovlarni olish (foydalanuvchi)
export const getUserPayments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT p.* FROM payments p JOIN bookings b ON p.booking_id = b.booking_id WHERE b.user_id = $1 ORDER BY p.created_at DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// To'lovni yangilash (paid qilish)
export const updatePaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, transactionId } = req.body;

    const result = await query(
      'UPDATE payments SET payment_status = $1, transaction_id = COALESCE($2, transaction_id), paid_at = CASE WHEN $1 = $3 THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE payment_id = $4 RETURNING *',
      [paymentStatus, transactionId, 'paid', paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'To\'lov topilmadi' });
    }

    res.json({ message: 'To\'lov yangilandi', payment: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Barcha to\'lovlar (admin)
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT p.*, b.booking_id, u.fullname FROM payments p JOIN bookings b ON p.booking_id = b.booking_id JOIN users u ON b.user_id = u.user_id ORDER BY p.created_at DESC');

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
