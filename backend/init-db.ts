import { readFileSync } from 'fs';
import pool, { query } from './db';

async function initDatabase() {
  try {
    console.log('📊 Jadvallar yaratilmoqdagi...');
    
    const schema = readFileSync('./schema.sql', 'utf-8');
    
    // Split safely by semicolon at the end of lines to prevent splitting inside strings or comments
    const statements = schema.split(/;\r?\n/).map(s => s.trim()).filter(Boolean);
    
    for (let statement of statements) {
      statement = statement.trim();
      if (!statement) continue;
      try {
        await query(statement);
      } catch (err: any) {
        // Ignore "already exists" errors
        if (!err.message.includes('already exists') && !err.message.includes('duplicate key')) {
          console.error('Xato:', err.message);
        }
      }
    }
    
    console.log('✅ Barcha jadvallar muvaffaqiyatli yaratildi!');
  } catch (error) {
    console.error('❌ Xato yuz berdi:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

initDatabase();
