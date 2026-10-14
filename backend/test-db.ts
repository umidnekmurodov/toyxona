import pool, { query } from './db';

async function testConnection() {
  try {
    console.log('🔄 Bazaga ulanishni tekshirmoqdaman...');
    
    const result = await query('SELECT NOW()');
    console.log('✅ Baza ulanishi muvaffaqiyatli!');
    console.log('Vaqt:', result.rows[0].now);
    
    // Test with a simple query
    const versionResult = await query('SELECT version()');
    console.log('PostgreSQL versiyasi:', versionResult.rows[0].version);
    
  } catch (error) {
    console.error('❌ Xato yuz berdi:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testConnection();

import bcrypt from "bcrypt";

async function generateTestHash() {
  const hash = await bcrypt.hash("123456", 10);
  console.log(hash);
}

generateTestHash();