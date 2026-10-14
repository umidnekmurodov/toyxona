import { Response } from 'express';
import { query } from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET as string;

// ✅ Helper: password ni response dan olib tashlash
const sanitizeUser = (user: any) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// Register foydalanuvchi
export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({ message: 'Barcha maydonni to\'ldiring' });
    }

    // Email format tekshirish
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email formati noto\'g\'ri' });
    }

    // Parol uzunligi
    if (password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    // Email unique tekshirish
    const existing = await query('SELECT user_id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Bu email yoki telefon raqam allaqachon ro\'yxatdan o\'tgan' });
    }

    const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await query(
      'INSERT INTO users (fullname, username, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [fullname, username, email, phone, hashedPassword, 'user']
    );

    const token = jwt.sign(
      { id: result.rows[0].user_id, username: result.rows[0].username, role: result.rows[0].role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ FIX [BUG-004, BUG-011]: password ni HECH QACHON response da qaytarma
    res.status(201).json({
      message: 'Ro\'yxatdan o\'tdingiz',
      token,
      user: sanitizeUser(result.rows[0]),
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Bu email yoki telefon raqam allaqachon ro\'yxatdan o\'tgan' });
    }
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Login foydalanuvchi
export const loginUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email va parolni kiriting' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      // ✅ Security: Email yoki parol noto'g'ri (aniq xabar berma)
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Hisobingiz bloklangan. Admin bilan bog\'laning.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ FIX [BUG-004]: password ni response dan olib tashla
    res.json({ message: 'Muvaffaqiyatli kirdiniz', token, user: sanitizeUser(user) });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Profil olish
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT user_id, fullname, username, email, phone, role, avatar, is_active, created_at, updated_at FROM users WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    // ✅ FIX [BUG-011]: password field SELECT da yo'q
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Profil yangilash
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
      [fullname, email, phone, avatar, req.user.id]
    );

    res.json({ message: 'Profil yangilandi', user: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Bu email yoki telefon raqam allaqachon mavjud' });
    }
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Barcha foydalanuvchilar (admin)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT user_id, fullname, username, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Foydalanuvchi owner bo'lishini so'raydi
export const becomeOwner = async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, passportNumber, region, district, address, bankAccount } = req.body;

    // Allaqachon owner ekanligini tekshir
    const existingOwner = await query('SELECT owner_id FROM owners WHERE user_id = $1', [req.user.id]);
    if (existingOwner.rows.length > 0) {
      return res.status(409).json({ message: 'Siz allaqachon owner sifatida ro\'yxatdan o\'tgansiz' });
    }

    const userRes = await query('SELECT * FROM users WHERE user_id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    }

    const ownerRes = await query(
      'INSERT INTO owners (user_id, company_name, passport_number, region, district, address, bank_account, verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, companyName || null, passportNumber || null, region || null, district || null, address || null, bankAccount || null, false]
    );

    // Role ni owner ga o'zgartir
    await query('UPDATE users SET role = $1 WHERE user_id = $2', ['owner', req.user.id]);

    const user = (await query(
      'SELECT user_id, fullname, username, email, phone, role, avatar, is_active FROM users WHERE user_id = $1',
      [req.user.id]
    )).rows[0];

    const newToken = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Owner sifatida ro\'yxatdan o\'tdingiz',
      owner: ownerRes.rows[0],
      token: newToken,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
