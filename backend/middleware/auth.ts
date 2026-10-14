import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ FIX [BUG-001]: Ensure JWT_SECRET is set — crash on startup if missing
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET muhit o\'zgaruvchisi o\'rnatilmagan! .env faylini tekshiring.');
  process.exit(1);
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Avtorizatsiya token\'i yo\'q' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Token bo\'sh' });
    }

    const decoded = jwt.verify(token, JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token muddati tugagan. Qayta kiring.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token noto\'g\'ri' });
    }
    return res.status(401).json({ message: 'Autentifikatsiya xatosi' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Foydalanuvchi aniqlanmadi' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Bu amalni bajarish uchun ruxsat yo'q. Talab qilingan rol: ${roles.join(' yoki ')}`,
      });
    }
    next();
  };
};
