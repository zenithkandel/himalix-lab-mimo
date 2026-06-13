const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'himalix_portfolio'
    });

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS statistics (
          id            INT AUTO_INCREMENT PRIMARY KEY,
          icon_class    VARCHAR(100),
          stat_value    VARCHAR(50),
          suffix        VARCHAR(20),
          label         VARCHAR(255) NOT NULL,
          display_order INT DEFAULT 0,
          is_active     BOOLEAN DEFAULT TRUE,
          updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Fetch existing stats from landing_content if they exist
    const [rows] = await connection.execute('SELECT content_value FROM landing_content WHERE section = "stats" AND content_key = "items"');
    if (rows.length > 0 && rows[0].content_value) {
      const items = JSON.parse(rows[0].content_value);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await connection.execute(
          'INSERT INTO statistics (icon_class, stat_value, suffix, label, display_order) VALUES (?, ?, ?, ?, ?)',
          [item.icon || '', item.value || '', item.suffix || '', item.label || '', i]
        );
      }
      console.log('Migrated existing stats.');
    }

    console.log('Statistics table created successfully.');
    await connection.end();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

run();
