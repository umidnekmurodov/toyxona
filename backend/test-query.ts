import pool, { query } from './db';

async function test() {
  try {
    console.log('Testing SQL query...');
    const sql = `
        SELECT w.*,
          COALESCE((SELECT COUNT(*) FROM favorites WHERE hall_id = w.hall_id), 0)::integer AS favorites_count,
          false AS is_favorited
        FROM wedding_halls w
        WHERE w.is_active = true
    `;
    const result = await query(sql);
    console.log("✅ Query succeeded! Found halls count:", result.rows.length);
    console.log("Halls data:", result.rows);
  } catch (error) {
    console.error("❌ Query failed:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}
test();
