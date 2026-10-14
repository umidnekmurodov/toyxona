import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import hallRoutes from './routes/hallRoutes';
import bookingRoutes from './routes/bookingRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import adminRoutes from './routes/adminRoutes';
import singersRoutes from './routes/singersRoutes';
import carsRoutes from './routes/carsRoutes';
import foodsRoutes from './routes/foodsRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5001;

// ✅ FIX: CORS - barcha rivojlanish originlariga ruxsat
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://192.168.1.100:5173',
  'http://192.168.1.100:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Ruxsat etilmagan origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/halls', hallRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/singers', singersRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/foods', foodsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ message: 'Server ishlayapti ✅', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({ message: "To'yxona Online Band Qilish Tizimi API" });
});

// ✅ Global error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Server xatosi:', err.stack);
  // Production da stack trace ni yashir
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    message: err.message || 'Server xatosi',
    ...(isDev && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server http://localhost:${PORT} da ishlamoqda...`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`  POST   /api/users/register`);
  console.log(`  POST   /api/users/login`);
  console.log(`  GET    /api/halls`);
  console.log(`  POST   /api/bookings`);
  console.log(`  POST   /api/reviews`);
  console.log(`  POST   /api/payments`);
  console.log(`  POST   /api/favorites\n`);
});

export default app;
