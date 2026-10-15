import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Express Request interfeysiga "user" maydonini qo'shamiz
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'user' | 'owner' | 'admin';
  };
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET .env faylida yo'q!");
  process.exit(1);
}

/**
 * Tokenni tekshiruvchi middleware
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Token topilmadi. Avval tizimga kiring." });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET as string);
    req.user = decoded as AuthRequest['user'];

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token muddati tugagan. Qayta kiring.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Token noto'g'ri yoki yaroqsiz." });
    }
    return res.status(401).json({ message: 'Autentifikatsiya xatosi.' });
  }
};

/**
 * Rollarni tekshiruvchi middleware (admin, owner, user)
 */
export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Foydalanuvchi aniqlanmadi.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Ruxsat yo'q. Kerakli rol: ${roles.join(' yoki ')}.`,
      });
    }

    next();
  };
};
