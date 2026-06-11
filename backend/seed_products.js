const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function seedProducts() {
  try {
    const seedSqlPath = path.join(__dirname, '..', 'himalix-store', 'database', 'seed.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

    // Split SQL by semicolon, but handle potential issues
    const statements = seedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} statements in seed.sql.`);

    let count = 0;
    for (const stmt of statements) {
      if (stmt.toLowerCase().startsWith('insert into products')) {
        console.log('Executing INSERT statement for products...');
        await pool.query(stmt);
        count++;
      }
    }

    console.log(`Successfully executed ${count} products insertion queries.`);
    
    // Verification
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM products');
    console.log(`Verified total products in database: ${rows[0].count}`);
  } catch (error) {
    console.error('Failed to seed products:', error);
  } finally {
    process.exit(0);
  }
}

seedProducts();
