import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbString = process.env.DB_STRING || 'postgresql://neondb_owner:npg_6AovzBL8jKnG@ep-jolly-fog-anu8506n-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: dbString,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};

export default pool;
