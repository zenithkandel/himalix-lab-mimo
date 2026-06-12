# 🚀 Scratch Build & Development Roadmap — Himalix Labs

This document provides a step-by-step development roadmap for an AI agent to build the unified Himalix Labs platform from scratch in a new, empty workspace.

---

## 🎯 Target Folder Structure

The agent must construct the project according to the following layout:

```text
himalix-labs/
├── package.json              <-- Master runner (executes frontend & backend via concurrently)
├── auth/                     <-- Universal Auth controller logic & middleware guards
│   ├── authController.js     
│   └── authMiddleware.js     
│
├── frontend/                 <-- React Client Module
│   ├── src/
│   │   ├── App.js            
│   │   ├── index.js          
│   │   ├── context/          <-- Context state engines (Theme, Auth, Cart)
│   │   ├── components/       <-- Global common/store components & layout shells
│   │   ├── styles/           <-- Modular CSS files (broken down)
│   │   │   ├── theme.css     
│   │   │   ├── reset.css     
│   │   │   ├── navigation.css
│   │   │   ├── landing.css   
│   │   │   ├── store.css     
│   │   │   └── admin.css     
│   │   └── pages/            <-- Sub-module views
│   │       ├── auth/         <-- Universal Signin/Signup
│   │       ├── portfolio/    
│   │       ├── store/        
│   │       ├── 3d/           
│   │       ├── web/          
│   │       └── project/      
│   └── package.json          
│
├── backend/                  <-- Express API Gateway
│   ├── server.js             
│   ├── config/               
│   │   ├── db.js             
│   │   └── mail.js           
│   ├── uploads/              
│   ├── portfolio/            
│   ├── store/                
│   ├── 3d/                   
│   ├── web/                  
│   └── project/              
│   └── package.json          
│
├── database/                 
│   ├── portfolio.sql         
│   ├── store.sql             
│   ├── 3d.sql                
│   ├── web.sql               
│   └── project.sql           
│
└── admin/                    <-- Nested Admin Modules
    ├── main/                 <-- Master Admin Sidebar Shell
    ├── portfolio/            
    ├── store/                
    ├── 3d/                   
    ├── web/                  
    └── project/              
```

---

## 🛠️ Step-by-Step Implementation Guide

The agent must implement the system in this order to ensure a stable build:

### Phase 1: Database Setup
1. **Initialize Database:**
   - Execute `database_schema.md` schemas to create the unified tables (`users`, `landing_content`, `products`, `orders`, etc.).
   - Seed tables with `unified_seed.sql` parameters to establish baseline system configurations and test credentials.

### Phase 2: Shared Backend Core
1. **Configure Environment:**
   - Create `backend/package.json` with Express, CORS, Helmet, rate-limiting, `mysql2/promise`, Nodemailer, and JWT.
   - Configure a local `.env` with connection credentials, JWT secrets, and SMTP settings.
2. **Build Configurations:**
   - Write `backend/config/db.js` (establishing pool connectivity and seeding settings).
   - Write `backend/config/mail.js` (setting up Nodemailer transporter routing).
3. **Write Universal Auth Middleware (`/auth/`):**
   - Create token validators and admin-role checkers.

### Phase 3: Universal Auth & API Gateway
1. **Develop Auth Routes:**
   - Implement `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, and `/api/auth/me`.
   - Ensure these map directly to the unified `users` database table.
2. **Develop Sub-module API Routers:**
   - Mount `/api/content/...` (general page content CRUD and contact message submission).
   - Mount `/api/store/products/...`, `/api/store/cart/...`, `/api/store/orders/...`, `/api/store/wallet/...`, and `/api/store/reviews/...`.
3. **Assemble API Gateway (`backend/server.js`):**
   - Wire all routes, error-handlers, and upload static directories together.

### Phase 4: Frontend Framework & Contexts
1. **Initialize Client React Project:**
   - Create `frontend/package.json` with standard router, icons, and motion libraries.
2. **Build Shared Stylesheets:**
   - Break down stylesheets into `/src/styles/` (`theme.css`, `reset.css`, `navigation.css`, etc.).
   - Ensure the global zero border-radius rule is declared: `border-radius: 0 !important;` in `reset.css`.
3. **Create Contexts:**
   - Implement `ThemeContext`, `AuthContext`, and `CartContext`.
4. **Link FontAwesome Premium:**
   - Add the script tag to the document head:
     `<script src="https://zenithkandel.com.np/fontawesome/zenith-icons.js"></script>`
   - Strictly format rendered icons with the Light Sharp prefix: `fa-light fa-sharp fa-[name]`.

### Phase 5: Client Route & Page Composition
1. **Deploy Universal Auth Views:**
   - Build `/signin` (`Signin.js`) and `/signup` (`Signup.js`) views mapping forms to context handlers.
2. **Create Landing Pages:**
   - Render sections (Hero with canvas animation, Services, About, Team, and Testimonials).
3. **Create E-Commerce storefront Pages:**
   - Build product grids, detail specs pages, cart checkers, and checkout workflows.

### Phase 6: Unified Admin Dashboard
1. **Build the Shell (`/admin`):**
   - Implement an `<AdminLayout />` route guard that checks if the logged-in user is an admin.
   - Render a sidebar navigation listing: General CMS, Store, 3D, Web, and Projects.
2. **Mount Dashboard Outlets:**
   - Switch active content sub-modules (`/admin/portfolio`, `/admin/store`, `/admin/3d`, etc.) dynamically using nested React Router elements.
   - Configure CRUD data tables, settings controls, manual credit deposits, and cart audit panels.

### Phase 7: Verification & Testing
1. Configure a root `package.json` with a script to run both frontend and backend concurrently:
   `"dev": "concurrently \"npm run dev --prefix backend\" \"npm start --prefix frontend\""`
2. Test local email registration and Google OAuth registration/login.
3. Test checkout distance calculation, taxes, stock subtraction, and wallet balance deductions.
