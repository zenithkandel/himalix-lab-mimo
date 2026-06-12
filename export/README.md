# Himalix Labs & Himalix Store — Unified Platform

Welcome to the comprehensive technical blueprints for **Himalix Labs**, a Nepal-based online technology solutions company. This documentation provides a meticulous overview of the entire codebase, database design, API endpoints, frontend architecture, and refactoring plans. 

These specifications are written in precise, granular detail to enable any AI agent or engineer to reconstruct the entire platform, its features, and services without introducing regressions or breaking existing behaviors.

---

## 📖 Project Overview

**Himalix Labs** is a Nepal-based online solution provider that delivers cost-effective services. The company's leadership consists of **Sakshyam Upadhyaya** (Founder & CEO), **Zenith Kandel** (Co-Founder), and **Sakshyam Bastakoti** (Co-Founder). 

The platform addresses two key scarcity gaps in the Nepalese market:
1. **Scarcity of robotics and hardware components** (processors, sensors, modules, ICs, development boards, etc.).
2. **Scarcity of reliable, cost-effective 3D printing services**.

Himalix Labs provides four primary service sub-modules:
1. **Himalix-Store:** An e-commerce marketplace where users buy robotics and electronic components. Includes a virtual wallet ledger, referral rewards, and social media follow incentives.
2. **Himalix-3D:** A rapid prototyping client service where users upload custom 3D models (STL files) or select from preset items to order custom 3D prints.
3. **Himalix-Web:** A custom website design and development agency where clients request and track custom web development orders.
4. **Himalix-projects:** A service for custom project orders (e.g. school exhibitions, engineering prototypes) and premade project sales (e.g. attendance systems, off-grid communication modules).

---

## 🛠️ Technology Stack

The platform is designed as a lightweight, robust full-stack JavaScript application:

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend Core** | React 18 | Single Page Application (SPA) using Create React App configuration. |
| **Routing** | React Router v6 | Client-side routing with private/admin route protection. |
| **Styling** | Vanilla CSS | Completely customized styling located in `App.css` (zero border-radius globally enforced, modular CSS classes, and dark/light themes). |
| **Backend API** | Node.js + Express 4 | RESTful API backend handling business logic directly in routes (controllers/models structure omitted for ease of modular deployment). |
| **Database** | MySQL 8.0+ / MariaDB | Relational schema with transactional integrity (InnoDB engine) and foreign key relationships. |
| **Database Client** | `mysql2/promise` | Connection pooling with async/await support. |
| **Authentication** | JSON Web Tokens (JWT) + Google OAuth | Cryptographically signed tokens (`jsonwebtoken`) and Google auth verification library (`google-auth-library`). |
| **Notifications** | SMTP + Nodemailer | Automated emails triggered on user signup, order placements, and low inventory stock levels. |
| **File Uploads** | Multer | Multipart form-data parser handling localized file storage in `/uploads`. |
| **Security** | Helmet + CORS | Content Security Policy protection, cross-origin resource sharing, and Express rate-limit configurations. |

---

## 📁 File Structure Refactoring

The current codebase is in a partially jumbled merged state. The target folder structure below organizes components into clean, separated sub-modules for each service, making it highly modular and extensible.

```text
himalix-labs/
├── auth/
│   └── [universal auth files, Google OAuth, token validation helpers]
├── frontend/
│   ├── portfolio/
│   │   └── [landing page views, components, hooks, assets]
│   ├── store/
│   │   └── [ecommerce catalog, details, cart, profile views]
│   ├── 3d/
│   │   └── [3D print file upload, pricing preview, STL renderer]
│   ├── web/
│   │   └── [web development specs form, portfolio showcase]
│   └── project/
│       └── [premade projects catalog, customized custom order sheets]
├── backend/
│   ├── portfolio/
│   │   └── [general info CMS, testimonials, contact message routes]
│   ├── store/
│   │   └── [products catalog, shopping cart, order checkout, wallet ledgers]
│   ├── 3d/
│   │   └── [3D pricing engine, file storage, printing order logs]
│   ├── web/
│   │   └── [web agency client order details, quotes, timeline hooks]
│   └── project/
│       └── [project ordering endpoints, custom specs submissions]
├── database/
│   ├── portfolio.sql
│   ├── store.sql
│   ├── 3d.sql
│   ├── web.sql
│   └── project.sql
└── admin/
    ├── main/
    │   ├── frontend/  <-- Admin portal shell & layout switcher
    │   └── backend/   <-- Global admin statistics, user management
    ├── portfolio/
    │   ├── frontend/
    │   └── backend/
    ├── store/
    │   ├── frontend/
    │   └── backend/
    ├── 3d/
    │   ├── frontend/
    │   └── backend/
    ├── web/
    │   ├── frontend/
    │   └── backend/
    └── project/
        ├── frontend/
        └── backend/
```

---

## 🔒 Universal Authentication & Session Consistency

The authentication module is designed to be shared uniformly across all sub-modules (portfolio, store, 3D, web, and projects).

### Core Requirements:
1. **Unified Sign-in & Sign-up:**
   - Universal signup is hosted at `/signup`.
   - Universal signin is hosted at `/signin`.
2. **Session Persistence:**
   - Authenticated JWT credentials are saved in localStorage (under key `token` and `user`) or secure HttpOnly cookies.
   - Session context remains consistent: once logged in, switching to `/store`, `/3d`, or `/admin` recognizes the active user context without re-authentication.
3. **Dual Login Provider:**
   - **Local Accounts:** Secure email and password verification (salted and hashed via `bcryptjs`).
   - **Google Sign-in:** Verified server-side via Google's OAuth2 API, mapping Google profile details (avatar, email, unique Google ID) into the single unified `users` database table.

---

## 👑 The Unified Admin Panel (`/admin`)

The administration interface is unified into a single control center with delegated sub-module views.

### Structural Flow:
1. **Primary Shell (`/admin`):**
   - Renders a master navigation sidebar or bar allowing choice between all domains: `Portfolio CMS`, `Himalix Store`, `Himalix 3D`, `Himalix Web`, and `Himalix Projects`.
   - Restricts access via role-checking route guards: only accounts with `role = 'admin'` in the unified `users` table can enter.
2. **Sub-Module Switcher:**
   - Selecting a domain dynamically swaps out the secondary navigation dashboard shell and routes:
     - `/admin/portfolio`: Edit landing hero section, services list, testimonials, team list, and read contact messages.
     - `/admin/store`: Perform full Product CRUD, audit active shopping carts, review order sheets and dispatch updates, manually deposit wallet credits, and modify shop variables.
     - `/admin/3d`: View custom 3D printing orders, download STL model files, compute quotes, and update printer task lines.
     - `/admin/web`: Review customer site specifications, send price estimations, and update project milestone progress.
     - `/admin/project`: Oversee premade project stock levels and process custom engineering applications.

---

## 📂 Documentation Directory Map

For deep-dive instructions, explore these detailed blueprints:

* **[Database Design & Seeds (database_schema.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/database_schema.md):** Tables, column mappings, constraints, references, and seed data templates.
* **[Backend REST API Blueprint (backend_api.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/backend_api.md):** Complete catalog of endpoints, express middlewares, payloads, and transaction helpers.
* **[Frontend Architecture & Styling (frontend_architecture.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/frontend_architecture.md):** Global React context, navigation layout, page elements, styling patterns, and animations.
* **[Restructuring & Code Migration Plan (refactoring_plan.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/refactoring_plan.md):** Step-by-step procedures to cleanly divide folders and deploy universal authentication/admin dashboarding safely.
