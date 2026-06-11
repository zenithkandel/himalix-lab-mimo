-- ============================================================
-- Himalix Unified Platform — Seed Data
-- Run AFTER unified_schema.sql
-- ============================================================
USE himalix_db;

-- ############################################################
-- USERS (unified: combines labs admin + store test users)
-- Password for all seeded users: admin123 / user123
-- bcrypt hash of 'admin123': $2b$10$VJ3t0m1RDYoQn5Tl6pYgpuJ.fY5wUXKsfML6yHknxCptSFoL.ycqu
-- bcrypt hash of 'user123':  $2b$10$VJ3t0m1RDYoQn5Tl6pYgpuJ.fY5wUXKsfML6yHknxCptSFoL.ycqu
-- ############################################################
INSERT INTO users (email, password_hash, role, referral_code) VALUES
    ('admin@himalixlab.com', '$2b$10$VJ3t0m1RDYoQn5Tl6pYgpuJ.fY5wUXKsfML6yHknxCptSFoL.ycqu', 'admin', 'HMX-REF-ADMIN0'),
    ('admin@himalix.store',  '$2b$10$VJ3t0m1RDYoQn5Tl6pYgpuJ.fY5wUXKsfML6yHknxCptSFoL.ycqu', 'admin', 'HMX-REF-ADMIN1'),
    ('user@himalix.store',   '$2b$10$VJ3t0m1RDYoQn5Tl6pYgpuJ.fY5wUXKsfML6yHknxCptSFoL.ycqu', 'user',  'HMX-REF-USER12');


-- ############################################################
-- LABS: Landing Content
-- ############################################################

-- Hero
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
    ('hero', 'hero_headline',   'Innovating Nepal''s Tech Future', 'text'),
    ('hero', 'hero_subline',    'Empowering Nepalese innovators with cutting-edge electronics, 3D printing, and custom tech solutions', 'text'),
    ('hero', 'hero_cta_text',   'Explore Our Services', 'text'),
    ('hero', 'hero_cta_link',   '#services', 'text');

-- About
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
    ('about', 'about_title',       'About Himalix Labs', 'text'),
    ('about', 'about_description', 'Himalix Labs is Nepal''s premier technology solutions organization, dedicated to making advanced electronics and digital fabrication accessible to every Nepalese innovator. Founded with the vision of bridging the technology gap in South Asia, we provide end-to-end tech solutions — from electronic components and 3D printing to custom project development.', 'text'),
    ('about', 'about_mission',     'To democratize technology access in Nepal and empower the next generation of innovators with tools, knowledge, and support.', 'text'),
    ('about', 'about_vision',      'Building a thriving tech ecosystem in Nepal where every idea can become reality.', 'text');

-- Stats
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
    ('stats', 'stats_projects', '500+', 'text'),
    ('stats', 'stats_clients',  '200+', 'text'),
    ('stats', 'stats_products', '1000+', 'text'),
    ('stats', 'stats_years',    '5+', 'text');

-- Contact
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
    ('contact', 'contact_title',    'Get In Touch', 'text'),
    ('contact', 'contact_email',    'info@himalixlab.com', 'text'),
    ('contact', 'contact_phone',    '+977-9800000000', 'text'),
    ('contact', 'contact_address',  'Kathmandu, Nepal', 'text');

-- Footer
INSERT INTO landing_content (section, content_key, content_value, content_type) VALUES
    ('footer', 'footer_description', 'Himalix Labs — Nepal''s premier technology solutions organization.', 'text'),
    ('footer', 'footer_copyright',   '© 2026 Himalix Labs. All rights reserved.', 'text');


-- ############################################################
-- LABS: Services
-- ############################################################
INSERT INTO services (title, subtitle, description, icon_class, features, link_url, display_order) VALUES
(
    'Himalix Store',
    'Electronic Components Store',
    'Your one-stop shop for genuine electronic components — from ESP32 and Arduino boards to sensors, modules, and ICs. Built for makers, students, and professionals across Nepal.',
    'fa-solid fa-microchip',
    '["ESP32, Arduino, Raspberry Pi", "Sensors & Modules", "ICs & Components", "Development Boards"]',
    '/store',
    1
),
(
    'Himalix Print',
    '3D Printing Services',
    'From preset models to fully custom STL files, our 3D printing service delivers rapid prototyping and production-quality prints with a wide range of materials.',
    'fa-solid fa-cube',
    '["Preset 3D Models", "Custom STL Files", "Rapid Prototyping", "Material Variety"]',
    '#',
    2
),
(
    'Himalix Projects',
    'Custom Tech Solutions',
    'End-to-end project development — from school science exhibitions and competition prototypes to bespoke embedded systems and tech consulting.',
    'fa-solid fa-diagram-project',
    '["School Science Exhibitions", "Competition Projects", "Custom Development", "Tech Consulting"]',
    '#',
    3
);


-- ############################################################
-- LABS: Team Members
-- ############################################################
INSERT INTO team_members (name, role, bio, image_url, social_links, display_order) VALUES
(
    'Sakshyam Upadhyaya',
    'Founder & CEO',
    'Visionary leader with a passion for making technology accessible to every Nepalese innovator.',
    'https://ui-avatars.com/api/?name=SA&background=d4a017&color=fff&size=400',
    '{"twitter":"#","linkedin":"#","github":"#"}',
    1
),
(
    'Sakshyam Bastakoti',
    'Co-Founder',
    'Technical expert driving innovation in 3D printing and digital fabrication solutions.',
    'https://ui-avatars.com/api/?name=SB&background=c9a227&color=fff&size=400',
    '{"twitter":"#","linkedin":"#","github":"#"}',
    2
),
(
    'Zenith Kandel',
    'Co-Founder',
    'Full-stack developer and hardware enthusiast building the bridges between ideas and reality.',
    'https://ui-avatars.com/api/?name=ZK&background=b8960c&color=fff&size=400',
    '{"twitter":"#","linkedin":"#","github":"#"}',
    3
);


-- ############################################################
-- LABS: Testimonials
-- ############################################################
INSERT INTO testimonials (client_name, client_title, company, content, rating, display_order) VALUES
(
    'Priya Sharma',
    'Student',
    'Kathmandu Model School',
    'Himalix Labs provided exactly what we needed for our school science exhibition. The ESP32 kit and guidance were exceptional.',
    5, 1
),
(
    'Ram Thapa',
    'Startup Founder',
    'TechVenture Nepal',
    'Their 3D printing service brought our product prototype to life in just 2 days. Incredible quality and speed.',
    5, 2
),
(
    'Anita Gurung',
    'Electronics Engineer',
    'Nepal Telecom',
    'Best electronic components store in Nepal. Genuine products, fair prices, and amazing technical support.',
    5, 3
);


-- ############################################################
-- LABS: Site Settings
-- ############################################################
INSERT INTO labs_site_settings (setting_key, setting_value, setting_type) VALUES
    ('site_name',        'Himalix Labs',  'text'),
    ('site_tagline',     'Innovating Nepal''s Tech Future', 'text'),
    ('logo_url',         '',              'image'),
    ('primary_color',    '#d4a017',       'text'),
    ('secondary_color',  '#c9a227',       'text'),
    ('facebook_url',     '',              'text'),
    ('twitter_url',      '',              'text'),
    ('instagram_url',    '',              'text'),
    ('linkedin_url',     '',              'text'),
    ('github_url',       '',              'text');


-- ############################################################
-- STORE: Default Settings
-- ############################################################
INSERT INTO settings (key_name, key_value) VALUES
    ('low_stock_threshold',      '5'),
    ('sales_tax_rate',           '13'),
    ('maintenance_mode',         '0'),
    ('store_banner_text',        'Welcome to Himalix Electronics Store - Quality Components, Fast Shipping!'),
    ('google_client_id',         '1080725502217-frvhi8kdv21m9hlt77o7pk0fruq2j1gn.apps.googleusercontent.com'),
    ('google_client_secret',     '[OAUTH_CLIENT_SECRET]'),
    ('google_auth_enabled',      '1'),
    ('referral_bonus_amount',    '5.00'),
    ('social_bonus_amount',      '5.00'),
    ('whatsapp_express_number',  '9779800000000'),
    ('delivery_per_km_rate',     '15.00'),
    ('delivery_min_charge',      '50.00'),
    ('delivery_free_threshold',  '2000.00');
