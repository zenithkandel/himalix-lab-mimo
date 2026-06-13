const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  console.log('Connecting to MySQL server...');
  const connection = await mysql.createConnection({ host, user, password });

  try {
    await connection.query('USE himalix_auth');
    
    // First, let's check if shipping_address exists
    const [rows] = await connection.query(`
      SELECT COUNT(*) as col_count 
      FROM information_schema.columns 
      WHERE table_schema = 'himalix_auth' 
        AND table_name = 'users' 
        AND column_name = 'shipping_address'
    `);
    
    if (rows[0].col_count === 0) {
      console.log('Adding shipping_address JSON column...');
      // It's safer to just ADD shipping_address and let the old address column stay or be dropped.
      // Let's drop address and add shipping_address
      await connection.query('ALTER TABLE users DROP COLUMN address;');
      await connection.query('ALTER TABLE users ADD COLUMN shipping_address JSON DEFAULT NULL AFTER phone;');
      console.log('Migration successful.');
    } else {
      console.log('Column shipping_address already exists.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrate();
