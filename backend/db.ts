import { Pool } from 'pg';
import dotenv from 'dotenv';

// .env fayldan muhit o'zgaruvchilarini yuklash
dotenv.config();

// Ma'lumotlar bazasi ulanish manzili
const connectionString =
  process.env.DB_STRING ||
  'postgresql://neondb_owner:npg_6AovzBL8jKnG@ep-jolly-fog-anu8506n-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// PostgreSQL connection pool yaratish
// Pool — bir vaqtda ko'p ulanishlarni boshqaradi (samarali ishlash uchun)
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Neon va boshqa cloud DB lar uchun kerak
  },
});

// Pool da kutilmagan xato bo'lsa — consolega chiqar
pool.on('error', (err: Error) => {
  console.error('❌ DB pool xatosi:', err.message);
});

/**
 * SQL so'rov yuborish uchun yordamchi funksiya.
 * @param text - SQL so'rovi (masalan: 'SELECT * FROM users WHERE id = $1')
 * @param params - Parametrlar ro'yxati (masalan: [userId])
 */
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

/**
 * Tranzaksiyalar uchun alohida client olish.
 * Ishlatilgandan keyin client.release() qilish SHART!
 */
export const getClient = () => {
  return pool.connect();
};

export default pool;
