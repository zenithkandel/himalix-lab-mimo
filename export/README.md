# Himalix Labs & Himalix Store — Unified Platform

Welcome to the comprehensive technical blueprints for **Himalix Labs**, a Nepal-based online technology solutions company. This documentation provides a meticulous overview of the entire database, API gateway, React frontend module structure, and styling architecture.

These specifications are written in precise detail to enable any AI agent or engineer to construct the entire platform, its features, and services **from scratch in a clean, empty workspace** without breaking any core mechanics.

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
| **Frontend Core** | React 18 | Single Page Application (SPA) using Create React App or Vite configuration. |
| **Routing** | React Router v6 | Client-side routing with private/admin route protection. |
| **Styling** | Modular Vanilla CSS | Completely customized styling broken down into separate files (zero border-radius globally enforced, minimal premium design elements, and dark/light themes). |
| **Backend API** | Node.js + Express 4 | RESTful API backend handling business logic directly in routes (controllers/models structure omitted for ease of modular deployment). |
| **Database** | MySQL 8.0+ / MariaDB | Relational schema with transactional integrity (InnoDB engine) and foreign key relationships. |
| **Database Client** | `mysql2/promise` | Connection pooling with async/await support. |
| **Authentication** | JWT + Google OAuth | Cryptographically signed tokens (`jsonwebtoken`) and Google auth verification library (`google-auth-library`). |
| **Notifications** | SMTP + Nodemailer | Automated emails triggered on user signup, order placements, and low inventory stock levels. |
| **File Uploads** | Multer | Multipart form-data parser handling localized file storage in `/uploads`. |
| **Security** | Helmet + CORS | Content Security Policy protection, cross-origin resource sharing, and Express rate-limit configurations. |

---

## 🎨 Design Theme: "Minimal Premium Non-AI"

The UI/UX must avoid generic AI-generated code template styles (such as neon blue/purple gradients or rounded floating cards) in favor of a clean, premium, and human-crafted visual style:

1. **Sharp Edges:** Global zero border-radius is strictly enforced (`border-radius: 0 !important`). Every element (buttons, forms, images, cards) must have crisp, sharp corners.
2. **No Blue/Purple Gradients:** Use a solid, flat, and muted color palette. Dark mode defaults to deep charcoal and pitch black. Light mode uses soft paper whites and cool greys. Gold/amber (`#d4a017`) is used sparingly for accents.
3. **Typographic Grid:** Align layouts on a geometric, print-like grid.
4. **Premium Icons:** Loads FontAwesome Premium via:
   `<script src="https://zenithkandel.com.np/fontawesome/zenith-icons.js"></script>`
   All icons **MUST** use the custom Light Sharp style: `fa-light fa-sharp fa-[icon-name]`.
5. **Psychologically Engaging UX:** Emphasizes wallet balance indicators, instant credit updates, and single-page checkouts to reduce friction.

---

## 📁 File Structure Refactoring

The folder structure below organizes components into clean, separated sub-modules for each service, making it highly modular and extensible.

```text
himalix-labs/
├── auth/
│   └── [universal auth files, Google OAuth, token validation helpers]
├── frontend/
│   ├── src/
│   │   ├── styles/               <-- Modular CSS files split
│   │   │   ├── theme.css         <-- Theme tokens & light/dark modes
│   │   │   ├── reset.css         <-- Reset defaults & sharp corners override
│   │   │   ├── navigation.css    <-- Portfolio & Store navbars
│   │   │   ├── landing.css       <-- General landing content styles
│   │   │   ├── store.css         <-- E-commerce templates
│   │   │   └── admin.css         <-- Nested Admin layouts
│   │   └── pages/
│   │       ├── auth/             <-- Universal signup / signin pages
│   │       ├── portfolio/
│   │       ├── store/
│   │       ├── 3d/
│   │       ├── web/
│   │       └── project/
├── backend/
│   ├── config/
│   ├── uploads/
│   ├── portfolio/
│   ├── store/
│   ├── 3d/
│   ├── web/
│   └── project/
├── database/
│   ├── portfolio.sql
│   ├── store.sql
│   ├── 3d.sql
│   ├── web.sql
│   └── project.sql
└── admin/
    ├── main/
    ├── portfolio/
    ├── store/
    ├── 3d/
    ├── web/
    └── project/
```

---

## 🔒 Universal Authentication & Session Consistency

The authentication module is shared uniformly across all sub-modules:

1. **Unified Sign-in & Sign-up:**
   - Universal signup is hosted at `/signup`.
   - Universal signin is hosted at `/signin`.
2. **Session Persistence:**
   - JWT tokens are saved in `localStorage` or cookies, remaining consistent across the entire origin. Once logged in, switching modules detects the active session without re-authentication.
3. **Providers:**
   - **Local Accounts:** Secure email/password login (hashed via `bcryptjs`).
   - **Google Sign-in:** Verified server-side via Google's OAuth2 API, mapping credentials into the single `users` database table.

---

## 👑 The Unified Admin Panel (`/admin`)

The administration interface is unified into a single control center:
1. **Primary Shell (`/admin`):** Renders a master navigation sidebar allowing administrators to select between `General CMS`, `E-Commerce Store`, `3D Printing`, `Web Projects`, and `Robotics Projects`.
2. **Sub-Module Switcher:** Selecting a domain dynamically loads the matching dashboard sub-route (e.g. `/admin/portfolio`, `/admin/store`, `/admin/3d`, etc.), updating the main viewport layout.

---

## 📂 Documentation Directory Map

For deep-dive instructions, explore these detailed blueprints:

* **[Database Design & Seeds (database_schema.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/database_schema.md):** Tables, column mappings, constraints, references, and seed data templates.
* **[Backend REST API Blueprint (backend_api.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/backend_api.md):** Complete catalog of endpoints, express middlewares, payloads, and transaction helpers.
* **[Frontend Architecture & Styling (frontend_architecture.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/frontend_architecture.md):** Global React context, navigation layout, page elements, styling patterns, and animations.
* **[Restructuring & Code Migration Plan (refactoring_plan.md)](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/export/refactoring_plan.md):** Step-by-step procedures to cleanly divide folders and deploy universal authentication/admin dashboarding safely.
