import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Har bir yo'nalish bo'yicha alohida route'lar
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import hallRoutes from './routes/hallRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import carsRoutes from './routes/carsRoutes';
import foodsRoutes from './routes/foodsRoutes';
import singersRoutes from './routes/singersRoutes';

// Muhit o'zgaruvchilarini (.env) yuklash
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// ─── 1. CORS Sozlamalari ───────────────────────────────────────────────────────
const allowedOrigins = new Set([
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]);

app.set('trust proxy', 1);
app.use((req, res, next) => cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const requestOrigin = `${req.protocol}://${req.get('host')}`;
      if (origin === requestOrigin || allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })(req, res, next));

// ─── 2. Body Parser ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 3. Xavfsizlik sarlavhalari (Security Headers) ─────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ─── 4. API Yo'llari (Ham /api prefiksi bilan, ham prefikssiz qabul qiladi) ───
const routeModules = [
  ['users', userRoutes],
  ['admin', adminRoutes],
  ['halls', hallRoutes],
  ['bookings', bookingRoutes],
  ['payments', paymentRoutes],
  ['reviews', reviewRoutes],
  ['favorites', favoriteRoutes],
  ['cars', carsRoutes],
  ['foods', foodsRoutes],
  ['singers', singersRoutes],
] as const;

for (const [path, router] of routeModules) {
  app.use(`/api/${path}`, router);
  app.use(`/${path}`, router);
}

// Server holatini tekshirish
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({ status: 'UP', message: 'Server faol ishlamoqda ✅', timestamp: new Date().toISOString() });
});

// Bosh sahifa
app.get(['/api', '/'], (_req: Request, res: Response) => {
  res.json({ message: "To'yxona Online Band Qilish Tizimi API xizmati" });
});

// ─── 5. Global Xatoliklarni Tutuvchi Middleware ───────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Server xatosi:', err.message || err);

  res.status(err.status || 500).json({
    message: err.message || 'Serverda ichki xatolik yuz berdi',
    error: String(err.message || err),
  });
});

// ─── 6. Serverni ishga tushirish ──────────────────────────────────────────────
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server http://localhost:${PORT} manzilida muvaffaqiyatli ishga tushdi!`);
    console.log(`📚 API yo'llari:`);
    console.log(`   - Foydalanuvchilar: /api/users`);
    console.log(`   - To'yxonalar:      /api/halls`);
    console.log(`   - Bronlar:          /api/bookings`);
    console.log(`   - To'lovlar:        /api/payments`);
    console.log(`   - Admin:            /api/admin\n`);
  });
}

export default app;
