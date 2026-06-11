const { pool } = require('./config/db');

async function test() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
    
    // Check if products table exists
    const hasProducts = tables.some(t => Object.values(t)[0] === 'products');
    if (hasProducts) {
      const [count] = await pool.query('SELECT COUNT(*) as count FROM products');
      console.log('Number of products:', count[0].count);
      const [samples] = await pool.query('SELECT * FROM products LIMIT 2');
      console.log('Sample products:', samples);
    } else {
      console.log('Products table does not exist!');
    }
  } catch (error) {
    console.error('Database query failed:', error);
  } finally {
    process.exit(0);
  }
}

test();
