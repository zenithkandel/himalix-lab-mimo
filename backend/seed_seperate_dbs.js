const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  console.log('Connecting to MySQL server...');
  const connection = await mysql.createConnection({ host, user, password });

  try {
    // 1. Drop old unified database
    console.log('Dropping old unified database "himalix_db" if exists...');
    await connection.query('DROP DATABASE IF EXISTS himalix_db');

    // 2. Create separate databases
    const dbs = [
      'himalix_auth',
      'himalix_portfolio',
      'himalix_store',
      'himalix_3d',
      'himalix_web',
      'himalix_project'
    ];

    for (const db of dbs) {
      console.log(`Creating database "${db}"...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }

    // ─── 3. SETUP AUTH DATABASE SCHEMA & SEED ───
    console.log('Setting up "himalix_auth" schema...');
    await connection.query('USE himalix_auth');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) DEFAULT NULL,
        google_id VARCHAR(255) DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        role ENUM('user','admin') NOT NULL DEFAULT 'user',
        wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        referral_code VARCHAR(50) DEFAULT NULL,
        referred_by INT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email),
        UNIQUE KEY uq_users_google_id (google_id),
        UNIQUE KEY uq_users_referral_code (referral_code),
        CONSTRAINT fk_users_referred_by FOREIGN KEY (referred_by) REFERENCES users (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Seeding users...');
    const hashedPwd = await bcrypt.hash('admin123', 10);
    const userHashedPwd = await bcrypt.hash('user123', 10);

    await connection.query(`
      INSERT INTO users (email, password_hash, role, referral_code, wallet_balance) VALUES
      ('admin@himalixlab.com', ?, 'admin', 'HMX-REF-ADMIN0', 0.00),
      ('admin@himalix.store', ?, 'admin', 'HMX-REF-ADMIN1', 0.00),
      ('user@himalix.store', ?, 'user', 'HMX-REF-USER12', 2500.00)
      ON DUPLICATE KEY UPDATE email=email
    `, [hashedPwd, hashedPwd, userHashedPwd]);


    // ─── 4. SETUP PORTFOLIO DATABASE SCHEMA & SEED ───
    console.log('Setting up "himalix_portfolio" schema...');
    await connection.query('USE himalix_portfolio');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS landing_content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        section VARCHAR(50) NOT NULL,
        content_key VARCHAR(100) NOT NULL,
        content_value LONGTEXT,
        content_type ENUM('text', 'html', 'json') DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_section_key (section, content_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        icon_class VARCHAR(100),
        features JSON,
        link_url VARCHAR(500),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        bio TEXT,
        image_url VARCHAR(500),
        social_links JSON,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        client_title VARCHAR(255),
        company VARCHAR(255),
        content TEXT NOT NULL,
        rating INT DEFAULT 5,
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS labs_site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value LONGTEXT,
        setting_type ENUM('text', 'image', 'json', 'boolean') DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Seeding portfolio landing content...');
    const contentRows = [
      ['hero', 'hero_headline', 'Innovating Nepal\'s Tech Future', 'text'],
      ['hero', 'hero_subline', 'Empowering Nepalese innovators with cutting-edge electronics, 3D printing, and custom tech solutions', 'text'],
      ['hero', 'hero_cta_text', 'Explore Our Services', 'text'],
      ['hero', 'hero_cta_link', '#services', 'text'],
      ['about', 'about_title', 'About Himalix Labs', 'text'],
      ['about', 'about_description', 'Himalix Labs is Nepal\'s premier technology solutions organization, dedicated to making advanced electronics and digital fabrication accessible to every Nepalese innovator. Founded with the vision of bridging the technology gap in South Asia, we provide end-to-end tech solutions — from electronic components and 3D printing to custom project development.', 'text'],
      ['about', 'about_mission', 'To democratize technology access in Nepal and empower the next generation of innovators with tools, knowledge, and support.', 'text'],
      ['about', 'about_vision', 'Building a thriving tech ecosystem in Nepal where every idea can become reality.', 'text'],
      ['stats', 'stats_projects', '500+', 'text'],
      ['stats', 'stats_clients', '200+', 'text'],
      ['stats', 'stats_products', '1000+', 'text'],
      ['stats', 'stats_years', '5+', 'text'],
      ['contact', 'contact_title', 'Get In Touch', 'text'],
      ['contact', 'contact_email', 'info@himalixlab.com', 'text'],
      ['contact', 'contact_phone', '+977-9800000000', 'text'],
      ['contact', 'contact_address', 'Kathmandu, Nepal', 'text'],
      ['footer', 'footer_description', 'Himalix Labs — Nepal\'s premier technology solutions organization.', 'text'],
      ['footer', 'footer_copyright', '© 2026 Himalix Labs. All rights reserved.', 'text']
    ];

    for (const [sec, key, val, type] of contentRows) {
      await connection.query(`
        INSERT INTO landing_content (section, content_key, content_value, content_type)
        VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE content_value = ?
      `, [sec, key, val, type, val]);
    }

    console.log('Seeding portfolio services...');
    await connection.query('DELETE FROM services');
    await connection.query(`
      INSERT INTO services (title, subtitle, description, icon_class, features, link_url, display_order) VALUES
      ('Himalix Store', 'Electronic Components Store', 'Your one-stop shop for genuine electronic components — from ESP32 and Arduino boards to sensors, modules, and ICs.', 'fa-solid fa-microchip', '["ESP32, Arduino, Raspberry Pi", "Sensors & Modules", "ICs & Components", "Development Boards"]', '/store', 1),
      ('Himalix Print', '3D Printing Services', 'From preset models to fully custom STL files, our 3D printing service delivers rapid prototyping and production-quality prints.', 'fa-solid fa-cube', '["Preset 3D Models", "Custom STL Files", "Rapid Prototyping", "Material Variety"]', '#', 2),
      ('Himalix Projects', 'Custom Tech Solutions', 'End-to-end project development — from school science exhibitions and competition prototypes to bespoke embedded systems.', 'fa-solid fa-diagram-project', '["School Science Exhibitions", "Competition Projects", "Custom Development", "Tech Consulting"]', '#', 3)
    `);

    console.log('Seeding portfolio team members...');
    await connection.query('DELETE FROM team_members');
    await connection.query(`
      INSERT INTO team_members (name, role, bio, image_url, social_links, display_order) VALUES
      ('Sakshyam Upadhyaya', 'Founder & CEO', 'Visionary leader with a passion for making technology accessible to every Nepalese innovator.', 'https://ui-avatars.com/api/?name=SA&background=d4a017&color=fff&size=400', '{"twitter":"#","linkedin":"#","github":"#"}', 1),
      ('Sakshyam Bastakoti', 'Co-Founder', 'Technical expert driving innovation in 3D printing and digital fabrication solutions.', 'https://ui-avatars.com/api/?name=SB&background=c9a227&color=fff&size=400', '{"twitter":"#","linkedin":"#","github":"#"}', 2),
      ('Zenith Kandel', 'Co-Founder', 'Full-stack developer and hardware enthusiast building the bridges between ideas and reality.', 'https://ui-avatars.com/api/?name=ZK&background=b8960c&color=fff&size=400', '{"twitter":"#","linkedin":"#","github":"#"}', 3)
    `);

    console.log('Seeding portfolio testimonials...');
    await connection.query('DELETE FROM testimonials');
    await connection.query(`
      INSERT INTO testimonials (client_name, client_title, company, content, rating, display_order) VALUES
      ('Priya Sharma', 'Student', 'Kathmandu Model School', 'Himalix Labs provided exactly what we needed for our school science exhibition. The ESP32 kit and guidance were exceptional.', 5, 1),
      ('Ram Thapa', 'Startup Founder', 'TechVenture Nepal', 'Their 3D printing service brought our product prototype to life in just 2 days. Incredible quality and speed.', 5, 2),
      ('Anita Gurung', 'Electronics Engineer', 'Nepal Telecom', 'Best electronic components store in Nepal. Genuine products, fair prices, and amazing technical support.', 5, 3)
    `);

    console.log('Seeding portfolio site settings...');
    const settingsRows = [
      ['site_name', 'Himalix Labs', 'text'],
      ['site_tagline', 'Innovating Nepal\'s Tech Future', 'text'],
      ['logo_url', '', 'image'],
      ['primary_color', '#d4a017', 'text'],
      ['secondary_color', '#c9a227', 'text']
    ];
    for (const [key, val, type] of settingsRows) {
      await connection.query(`
        INSERT INTO labs_site_settings (setting_key, setting_value, setting_type)
        VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?
      `, [key, val, type, val]);
    }


    // ─── 5. SETUP STORE DATABASE SCHEMA & SEED ───
    console.log('Setting up "himalix_store" schema...');
    await connection.query('USE himalix_store');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        description TEXT DEFAULT NULL,
        technical_specs JSON DEFAULT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        image_url VARCHAR(500) DEFAULT NULL,
        category VARCHAR(100) DEFAULT NULL,
        stock_type VARCHAR(20) NOT NULL DEFAULT 'in_stock',
        outsource_days INT NOT NULL DEFAULT 0,
        cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        image_urls JSON DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_products_sku (sku)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cart_items_user_product (user_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT DEFAULT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        tracking_code VARCHAR(100) NOT NULL,
        shipping_address TEXT DEFAULT NULL,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        rating INT NOT NULL,
        comment TEXT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('deposit', 'purchase', 'refund', 'referral', 'social') NOT NULL,
        reference_id VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS social_claims (
        user_id INT NOT NULL,
        platform VARCHAR(50) NOT NULL,
        claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, platform)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(255) NOT NULL,
        key_value TEXT DEFAULT NULL,
        PRIMARY KEY (key_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_notification_receivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email_address VARCHAR(255) NOT NULL,
        notify_on_order_placed TINYINT(1) NOT NULL DEFAULT 1,
        notify_on_low_stock TINYINT(1) NOT NULL DEFAULT 1,
        notify_on_user_registered TINYINT(1) NOT NULL DEFAULT 1,
        UNIQUE KEY uq_receivers_email (email_address)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Seeding store settings...');
    const storeSettings = [
      ['low_stock_threshold', '5'],
      ['sales_tax_rate', '13'],
      ['maintenance_mode', '0'],
      ['store_banner_text', 'Welcome to Himalix Electronics Store - Quality Components, Fast Shipping!'],
      ['google_client_id', '1080725502217-frvhi8kdv21m9hlt77o7pk0fruq2j1gn.apps.googleusercontent.com'],
      ['google_auth_enabled', '1'],
      ['referral_bonus_amount', '100.00'],
      ['social_bonus_amount', '50.00'],
      ['delivery_per_km_rate', '15.00'],
      ['delivery_min_charge', '50.00'],
      ['delivery_free_threshold', '2000.00'],
      ['smtp_host', 'smtp.mailtrap.io'],
      ['smtp_port', '2525'],
      ['smtp_user', 'test-smtp-user'],
      ['smtp_pass', 'test-smtp-pass'],
      ['smtp_secure', '0'],
      ['emergency_contact_phone', '9801234567'],
      ['emergency_contact_email', 'support@himalix.store']
    ];
    for (const [key, val] of storeSettings) {
      await connection.query('INSERT INTO settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = ?', [key, val, val]);
    }

    console.log('Seeding store products...');
    await connection.query('DELETE FROM products');
    const productsData = [
      ['Arduino Uno R3 Clone', 'ARD-UNO-R3', 'High quality ATmega328P based microcontroller board clone, fully compatible with Arduino IDE.', JSON.stringify({ Voltage: '5V', Controller: 'ATmega328P', USB: 'Type-B' }), 650.00, 25, '/uploads/arduino_uno.png', 'Microcontrollers', 'in_stock', 0, 420.00],
      ['ESP32 NodeMCU DevKit', 'ESP32-NODE-V1', 'Dual core Wi-Fi and Bluetooth development board, powerful solution for IoT applications.', JSON.stringify({ Processor: 'ESP32-D0WDQ6', RAM: '520 KB', WiFi: '802.11 b/g/n' }), 850.00, 30, '/uploads/esp32.png', 'Microcontrollers', 'in_stock', 0, 550.00],
      ['SG90 Micro Servo Motor 9g', 'SG90-SERVO', 'Lightweight 9g micro servo motor with 120 degree rotation range, perfect for robotics projects.', JSON.stringify({ Weight: '9g', Speed: '0.12s/60deg', Torque: '1.8 kg-cm' }), 180.00, 100, '/uploads/sg90.png', 'Motors & Drivers', 'in_stock', 0, 100.00],
      ['HC-SR04 Ultrasonic Sensor', 'HCSR04-ULTRASONIC', 'Non-contact distance measurement sensor, ranging from 2cm to 400cm with high accuracy.', JSON.stringify({ Voltage: '5V DC', Frequency: '40 kHz', Angle: '<15 deg' }), 150.00, 4, '/uploads/hc_sr04.png', 'Sensors', 'in_stock', 0, 90.00],
      ['DHT22 Temperature Sensor', 'DHT22-AM2302', 'High precision capacitive humidity and temperature sensor with single-bus digital output.', JSON.stringify({ Range: '-40 to 80°C', Humidity: '0-100%', Accuracy: '±0.5°C' }), 450.00, 12, '/uploads/dht22.png', 'Sensors', 'in_stock', 0, 280.00],
      ['Raspberry Pi 4 Model B (4GB)', 'RPI4-4GB', 'Credit-card sized single board computer, 1.5GHz quad-core CPU, 4GB RAM, dual micro-HDMI.', JSON.stringify({ SoC: 'BCM2711', RAM: '4GB LPDDR4', HDMI: '2x micro-HDMI' }), 9800.00, 0, '/uploads/rpi4.png', 'Single Board Computers', 'outsourced', 4, 7500.00]
    ];
    for (const p of productsData) {
      await connection.query(`
        INSERT INTO products (name, sku, description, technical_specs, price, stock_quantity, image_url, category, stock_type, outsource_days, cost_price, image_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [...p, JSON.stringify([p[6]])]);
    }

    console.log('Seeding store orders...');
    await connection.query('DELETE FROM orders');
    await connection.query('DELETE FROM order_items');
    
    // Create completed orders for user ID 3
    const testUserId = 3;
    const orderData = [
      [testUserId, 800.00, 'delivered', 'HMX-772911-ABC', JSON.stringify({ fullName: 'John Doe', phone: '9801122334', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati', receivingLocation: '27.7029,85.3072' }), 'store_credit', 'paid'],
      [testUserId, 1480.00, 'pending', 'HMX-998822-XYZ', JSON.stringify({ fullName: 'John Doe', phone: '9801122334', city: 'Lalitpur', district: 'Lalitpur', province: 'Bagmati', receivingLocation: '27.6749,85.3123' }), 'cash', 'unpaid']
    ];
    
    for (const ord of orderData) {
      const [oResult] = await connection.query(`
        INSERT INTO orders (user_id, total_amount, status, tracking_code, shipping_address, payment_method, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, ord);
      const oId = oResult.insertId;
      
      if (ord[3] === 'HMX-772911-ABC') {
        // Seed order items
        await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [oId, 1, 1, 650.00]);
        await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [oId, 4, 1, 150.00]);
      } else {
        await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [oId, 2, 1, 850.00]);
        await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [oId, 3, 2, 180.00]);
        await connection.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)', [oId, 5, 1, 270.00]);
      }
    }

    console.log('Seeding reviews...');
    await connection.query('DELETE FROM reviews');
    await connection.query(`
      INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
      (${testUserId}, 1, 5, 'Great Arduino clone! Works perfectly with original drivers, zero issues.'),
      (${testUserId}, 2, 5, 'Very powerful WiFi processor, perfect for home automation projects.'),
      (${testUserId}, 4, 4, 'Reasonably good distance sensor. Accuracy drops slightly at max range but very usable.')
    `);

    console.log('Seeding wallet transactions ledger...');
    await connection.query('DELETE FROM wallet_transactions');
    await connection.query(`
      INSERT INTO wallet_transactions (user_id, amount, type, reference_id) VALUES
      (${testUserId}, 3000.00, 'deposit', 'eSewa_manual_deposit_776192'),
      (${testUserId}, -800.00, 'purchase', 'order_purchase_1'),
      (${testUserId}, 300.00, 'referral', 'referral_invitation_bonus')
    `);

    console.log('Seeding email notification receivers...');
    await connection.query('DELETE FROM email_notification_receivers');
    await connection.query(`
      INSERT INTO email_notification_receivers (email_address, notify_on_order_placed, notify_on_low_stock, notify_on_user_registered) VALUES
      ('admin@himalix.store', 1, 1, 1),
      ('alerts@himalix.store', 1, 1, 0)
    `);

    // ─── 6. DUMMY SCHEMAS FOR 3D / WEB / PROJECT ───
    console.log('Setting up placeholders for other service databases...');
    await connection.query('USE himalix_3d');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS printing_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        file_url VARCHAR(500),
        material VARCHAR(100),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query('USE himalix_web');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS web_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        project_type VARCHAR(100),
        budget_range VARCHAR(50),
        requirements TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query('USE himalix_project');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS custom_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255),
        description TEXT,
        budget DECIMAL(10,2),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Database schemas created & seeded successfully!');
  } catch (err) {
    console.error('Database seeding failed:', err);
  } finally {
    await connection.end();
  }
}

seed();
