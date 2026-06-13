const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Running database schema initializations...');

    // 1. Ensure users.password_hash is nullable (for Google-only users)
    try {
      await connection.query('ALTER TABLE himalix_auth.users MODIFY COLUMN password_hash VARCHAR(255) NULL');
    } catch (err) {
      // Column may already be nullable — ignore
    }

    // 2. Add google_id column if not exists
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM himalix_auth.users LIKE 'google_id'");
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE himalix_auth.users 
          ADD COLUMN google_id VARCHAR(255) NULL AFTER password_hash,
          ADD UNIQUE KEY uq_users_google_id (google_id)
        `);
        console.log('google_id column added to users table');
      }
    } catch (err) {
      // Ignore if already exists
    }

    // 3. Add avatar_url column if not exists
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM himalix_auth.users LIKE 'avatar_url'");
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE himalix_auth.users 
          ADD COLUMN avatar_url VARCHAR(500) NULL AFTER google_id
        `);
        console.log('avatar_url column added to users table');
      }
    } catch (err) {
      // Ignore
    }

    // Add name column if not exists
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM himalix_auth.users LIKE 'name'");
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE himalix_auth.users 
          ADD COLUMN name VARCHAR(255) NULL AFTER email
        `);
        console.log('name column added to users table');
      }
    } catch (err) {
      // Ignore
    }

    // Add phone column if not exists
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM himalix_auth.users LIKE 'phone'");
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE himalix_auth.users 
          ADD COLUMN phone VARCHAR(50) NULL AFTER avatar_url
        `);
        console.log('phone column added to users table');
      }
    } catch (err) {
      // Ignore
    }

    // Add address column if not exists
    try {
      const [columns] = await connection.query("SHOW COLUMNS FROM himalix_auth.users LIKE 'address'");
      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE himalix_auth.users 
          ADD COLUMN address TEXT NULL AFTER phone
        `);
        console.log('address column added to users table');
      }
    } catch (err) {
      // Ignore
    }

    // 4. Create settings table if not exists
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key_name VARCHAR(255) NOT NULL,
          key_value TEXT DEFAULT NULL,
          PRIMARY KEY (key_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (err) {
      // Ignore
    }

    // 5. Seed default store settings (only inserts if keys don't exist)
    try {
      const defaultSettings = [
        ['low_stock_threshold', '5'],
        ['sales_tax_rate', '13'],
        ['maintenance_mode', '0'],
        ['store_banner_text', 'Welcome to Himalix Electronics Store - Quality Components, Fast Shipping!'],
        ['google_client_id', '1080725502217-frvhi8kdv21m9hlt77o7pk0fruq2j1gn.apps.googleusercontent.com'],
        ['google_client_secret', '[OAUTH_CLIENT_SECRET]'],
        ['google_auth_enabled', '1']
      ];

      for (const [key, val] of defaultSettings) {
        const [existing] = await connection.query('SELECT key_name FROM settings WHERE key_name = ?', [key]);
        if (existing.length === 0) {
          await connection.query('INSERT INTO settings (key_name, key_value) VALUES (?, ?)', [key, val]);
        }
      }
    } catch (err) {
      console.error('Error seeding default settings:', err.message);
    }

    console.log('Database schema initializations completed successfully');
  } catch (error) {
    console.error('MySQL connection or initialization failed:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

async function initDB() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully');
    connection.release();
    await initializeDatabase();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, initDB };
