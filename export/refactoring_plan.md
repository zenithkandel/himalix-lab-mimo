# 🛠️ Migration & Refactoring Plan — Himalix Labs

This document provides a step-by-step roadmap to restructure the merged Himalix Labs codebase into its target modular architecture, implement universal authentication, and deploy the nested admin panel shell.

---

## 🎯 Target Directory Layout

Ensure all files are moved from their current layout into this structured system:

```text
himalix-labs/
├── package.json              <-- Monorepo package descriptor (runs concurrently)
├── auth/                     <-- Shared Universal Authentication module
│   ├── authController.js     <-- JWT generation, google verify, registration
│   └── authMiddleware.js     <-- Token authentication check and role checker
│
├── frontend/                 <-- Unified React Application (Vite or CRA)
│   ├── src/
│   │   ├── App.js            <-- Global Router mounting pages & contexts
│   │   ├── App.css           <-- Global Vanilla CSS styling definitions
│   │   ├── context/          <-- Unified State context block
│   │   │   ├── AuthContext.js
│   │   │   ├── CartContext.js
│   │   │   └── ThemeContext.js
│   │   ├── components/
│   │   │   ├── shared/       <-- Global common widgets (loading, canvas)
│   │   │   └── admin/        <-- Universal Admin Layout & Nav bars
│   │   └── pages/
│   │       ├── auth/         <-- Universal Auth Pages (/signin, /signup)
│   │       │   ├── Signin.js
│   │       │   └── Signup.js
│   │       ├── portfolio/    <-- Portfolio Sub-module Frontend
│   │       ├── store/        <-- Store E-commerce Frontend
│   │       ├── 3d/           <-- 3D Printing Frontend
│   │       ├── web/          <-- Web Agency Client Frontend
│   │       └── project/      <-- Project Platform Frontend
│   └── package.json          <-- Frontend dependencies configuration
│
├── backend/                  <-- Express API Gateway
│   ├── server.js             <-- Primary Gateway router mount
│   ├── config/
│   │   ├── db.js             <-- Connection pool logic
│   │   └── mail.js           <-- Nodemailer transporter logic
│   ├── uploads/              <-- Localized file uploads folder
│   ├── portfolio/            <-- Portfolio CMS API Routes
│   ├── store/                <-- Store Catalog & Wallet API Routes
│   ├── 3d/                   <-- 3D STL file submission API Routes
│   ├── web/                  <-- Web Agency specification API Routes
│   ├── project/              <-- Projects Customization API Routes
│   └── package.json          <-- Backend dependencies configuration
│
├── database/                 <-- Database schemas folder
│   ├── portfolio.sql         <-- Portfolio CMS definitions
│   ├── store.sql             <-- E-commerce tables definitions
│   ├── 3d.sql                <-- 3D Order tables definitions
│   ├── web.sql               <-- Web Project tables definitions
│   └── project.sql           <-- Projects tables definitions
│
└── admin/                    <-- Nested Admin Modules
    ├── main/                 <-- Root master admin dashboard shell
    ├── portfolio/            <-- Portfolio CMS Dashboard sub-view
    ├── store/                <-- E-commerce dashboard sub-view
    ├── 3d/                   <-- 3D dashboard sub-view
    ├── web/                  <-- Web project dashboard sub-view
    └── project/              <-- Projects dashboard sub-view
```

---

## 🔒 Step 1: Universal Authentication & Session Sharing

To resolve session fragmentation and consolidate authentication, execute these changes:

### 1. Unified API Endpoints (`/backend/server.js` and `/auth/`):
- Consolidate all authentication logic into `backend/routes/auth.js` (or `/auth/`).
- Create single global endpoints:
  - `POST /api/auth/register` — Handles registration and generates referral codes.
  - `POST /api/auth/login` — Normal password validation.
  - `POST /api/auth/google` — Google signature token lookup and profile sync.
  - `GET /api/auth/me` — Fetches current user session profile.
- Restructure all database lookups to run queries against a single, canonical MySQL table: `users`.

### 2. Frontend Client Pages:
- Create two unified routes in the global React Router structure (`frontend/src/App.js`):
  - `/signup` -> `<Signup />` (replaces `/store/register`)
  - `/signin` -> `<Signin />` (replaces `/store/login`)
- Remove standalone login and registration views from individual directories (`store`, `3d`, etc.).
- Direct all modules to use the single global `AuthContext` to fetch `user` details, active `token`, and `walletBalance`.
- Since all sub-modules run on the same domain and origin, a token saved via `localStorage.setItem('token', token)` is accessible across all components (Store, 3D, Web, etc.).

---

## 👑 Step 2: Nested Admin Panel Shell (`/admin`)

To build the integrated admin panel matching the requested flow, restructure the frontend routes as follows:

### 1. Master Shell Routing (`frontend/src/App.js`):
- Mount a protected route `/admin/*` requiring user authentication and an admin role validation (`role === 'admin'`).
- The parent component `<AdminLayout />` renders:
  - A master Admin Navigation Bar containing links: `General CMS`, `E-Commerce Store`, `3D Printing`, `Web Projects`, and `Robotics Projects`.
  - A nested routing viewport `<Outlet />` to render sub-pages based on URL:
    - `/admin/portfolio/*`
    - `/admin/store/*`
    - `/admin/3d/*`
    - `/admin/web/*`
    - `/admin/project/*`

### 2. Dashboard Sub-Views Configuration:
- When the URL matches `/admin/portfolio`, load the portfolio manager page (`frontend/src/pages/Admin.js`), rendering forms to edit hero text, services list, testimonials, and view feedback.
- When the URL matches `/admin/store`, load the store dashboard page (`frontend/src/pages/store/Admin.js`), rendering sales charts, product lists, user details, and configuration grids.
- When the URL matches `/admin/3d`, `/admin/web`, or `/admin/project`, mount their respective sub-views.
- Each sub-view handles its own internal links while inheriting the master navigation sidebar.

---

## 🚀 Step 3: Migration Execution Roadmap

This checklist outlines the migration steps:

- [ ] **Prepare Database:**
  - Back up any existing databases.
  - Execute `unified_schema.sql` to initialize the tables (`users`, `landing_content`, `products`, `orders`, etc.).
  - Run `unified_seed.sql` to import default configurations and test admin accounts.
- [ ] **Relocate Backend Files:**
  - Move current `backend/routes/auth.js` to `/auth/` (or keep it in a shared directory).
  - Group e-commerce endpoints under `backend/routes/store/` (`products.js`, `cart.js`, `orders.js`, `wallet.js`, `reviews.js`, `admin.js`).
  - Create placeholders for `backend/routes/3d/`, `backend/routes/web/`, and `backend/routes/project/`.
  - Update imports in `backend/server.js` and point route middleware to the new file locations.
- [ ] **Relocate Frontend Files:**
  - Standardize paths: move portfolio views to `frontend/src/pages/portfolio/` and store views to `frontend/src/pages/store/`.
  - Move common contexts (`AuthContext.js`, `CartContext.js`, `ThemeContext.js`) to `frontend/src/context/`.
  - Create placeholders for `3d`, `web`, and `project` directories in `frontend/src/pages/`.
- [ ] **Implement Universal Auth Pages:**
  - Refactor `/store/login` and `/store/register` into `/src/pages/auth/Signin.js` and `Signup.js`.
  - Mount them in the main router: `<Route path="/signin" element={<Signin />} />` and `<Route path="/signup" element={<Signup />} />`.
- [ ] **Assemble Unified Admin Portal:**
  - Create the parent `<AdminLayout />` component with the master navigation bar.
  - Configure nested routing under `/admin/*` to switch between sub-module dashboards dynamically.
- [ ] **Update API Proxies & Test:**
  - Audit all files to replace hardcoded API server paths (e.g. `http://localhost:5000`) with relative endpoints (e.g. `/api/...`).
  - Boot both backend and frontend applications using the concurrently script (`npm run dev`).
  - Verify registration, Google Auth, product catalog filtering, cart additions, distance-based checkout calculations, and admin dashboard controls.
