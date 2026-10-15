import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Parolni javobdan xavfsiz olib tashlash
const sanitizeUser = (user: any) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Ro'yxatdan o'tish (Register)
 */
export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({ message: "Barcha maydonlarni to'ldiring!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email formati noto'g'ri kiritildi!" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak!" });
    }

    const existing = await query('SELECT user_id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Bu email yoki telefon raqam allaqachon ro'yxatdan o'tgan!" });
    }

    const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await query(
      'INSERT INTO users (fullname, username, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [fullname, username, email, phone, hashedPassword, 'user']
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      { id: newUser.user_id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "Ro'yxatdan muvaffaqiyatli o'tdingiz!",
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: "Bu email yoki telefon raqam allaqachon mavjud!" });
    }
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Tizimga kirish (Login)
 */
export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email va parolni kiriting!' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Email yoki parol noto'g'ri!" });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "Hisobingiz bloklangan. Administrator bilan bog'laning." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Email yoki parol noto'g'ri!" });
    }

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Muvaffaqiyatli kirdingiz!',
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Profil ma'lumotlarini olish
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT user_id, fullname, username, email, phone, role, avatar, is_active, created_at, updated_at FROM users WHERE user_id = $1',
      [req.user?.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi!' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Profilni yangilash
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { fullname, email, phone, avatar } = req.body;

    const result = await query(
      `UPDATE users SET
        fullname = COALESCE($1, fullname),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        avatar = COALESCE($4, avatar),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $5
       RETURNING user_id, fullname, username, email, phone, role, avatar, is_active, created_at, updated_at`,
      [fullname, email, phone, avatar, req.user?.id]
    );

    res.json({ message: 'Profil muvaffaqiyatli yangilandi!', user: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Bu email yoki telefon raqam allaqachon mavjud!' });
    }
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * Barcha foydalanuvchilar (Admin uchun)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT user_id, fullname, username, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};

/**
 * To'yxona egasi (Owner) bo'lish
 */
export const becomeOwner = async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, passportNumber, region, district, address, bankAccount } = req.body;

    const existing = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user?.id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Siz allaqachon to'yxona egasi (owner) sifatida ro'yxatdan o'tgansiz!" });
    }

    const ownerRes = await query(
      `INSERT INTO owners (user_id, company_name, passport_number, region, district, address, bank_account, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user?.id, companyName || null, passportNumber || null, region || null, district || null, address || null, bankAccount || null, false]
    );

    await query('UPDATE users SET role = $1 WHERE user_id = $2', ['owner', req.user?.id]);

    const updatedUserRes = await query(
      'SELECT user_id, fullname, username, email, phone, role, avatar, is_active FROM users WHERE user_id = $1',
      [req.user?.id]
    );
    const user = updatedUserRes.rows[0];

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: "Tabriklaymiz! Siz to'yxona egasi (owner) bo'ldingiz.",
      owner: ownerRes.rows[0],
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Serverda xatolik yuz berdi' });
  }
};
