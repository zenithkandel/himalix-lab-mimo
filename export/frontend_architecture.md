# 💻 React Frontend Architecture & Design System

This document details the client-side architecture of the Himalix Labs web platform, covering React state managers, contexts, component models, file-based CSS breakdown, and strict UX/UI guidelines.

---

## 🗂️ Global Context Providers

State management is divided into three functional contexts located in `frontend/src/context/`:

### 1. `ThemeContext`
* **Purpose:** Manages the visual color mode (`'dark'` vs `'light'`).
* **Behavior:**
  - Reads values from `localStorage.getItem('theme')`, falling back to `'dark'`.
  - Appends the target attribute class (e.g. `data-theme="light"`) to the document root element.
  - Exposes properties: `{ theme, toggleTheme }`.

### 2. `AuthContext`
* **Purpose:** Manages user credentials, wallet status, and shop configurations.
* **Exposed State:**
  - `user`: Unified profile details (`id`, `email`, `role`, `avatar_url`, etc.).
  - `token`: JWT key.
  - `walletBalance`: Current store credits.
  - `systemConfig`: Public settings block (Google client ID, VAT rates, banner texts).
* **Core Functions:**
  - `login(email, password)`: Queries `/api/auth/login`. Sets `token` and `user` keys in `localStorage`.
  - `register(email, password, referralCode)`: Queries `/api/auth/register` with matching parameters.
  - `loginWithGoogle(credentialToken)`: Logs in using Google token and updates state.
  - `logout()`: Clears credentials and redirects to `/store`.
  - `fetchWalletBalance()`: Queries `/api/store/wallet/history` to refresh balance values.

### 3. `CartContext`
* **Purpose:** Syncs cart status with the server.
* **Exposed State & Getters:**
  - `items`: Active cart list.
  - `cartCount`: Total item count (sum of item quantities).
  - `cartTotal`: Total cost (sum of quantities multiplied by prices).
* **Core Functions:**
  - `fetchCart()`: Refreshes card list from `/api/store/cart`.
  - `addToCart(productId, quantity)`: Sends product ID and quantity to `/api/store/cart/add`.
  - `updateCartItem(cartItemId, quantity)`: Updates quantities via `/api/store/cart/update`.
  - `removeFromCart(cartItemId)`: Deletes entry using `/api/store/cart/remove/:id`.

---

## 🛡️ Route Access Protection

Access is restricted using simple route guards located in `frontend/src/components/store/`:

* **`PrivateRoute.js`:**
  - Checks if a valid `token` exists in the `AuthContext`.
  - If authenticated, renders the child component.
  - If unauthenticated, redirects to `/signin`.
* **`AdminRoute.js`:**
  - Verifies `token` exists AND `user.role === 'admin'`.
  - If valid, grants entry.
  - If invalid, redirects to `/store` (or blocks access).

---

## 🎨 Premium "Non-AI" UI Design Principles

To maintain a bespoke, premium, and human-crafted visual style, the implementing agent must strictly follow these aesthetic parameters:

### 🚫 Design Restrictions (Anti-AI Templates)
1. **NO Neon Blue/Purple/Green Gradients:** Avoid standard AI-generated code template styles (such as indigo-to-purple sweeps or neon green highlights).
2. **NO Rounded Borders:** Enforce a strict zero-radius rule. Every container, input, button, and image must have sharp, clinical corners.
3. **NO Decorative Excess:** Banish unnecessary shadows, complex background patterns, and floating cards. Use structure, spacing, and typographic hierarchy to define layouts.

### 🎨 Color Palette & Typography
* **Flat Muted Tones:**
  - **Dark Mode (Default):** Pitch black (`#0a0a0a`) background, deep charcoal (`#121212`, `#181818`) panels, off-white text, and razor-thin borders (`#262626`).
  - **Light Mode:** Crisp paper white (`#ffffff`), soft grey (`#f8f9fa`) panels, charcoal text, and clean grey borders (`#e9ecef`).
  - **Refined Gold Accent:** Refined amber/gold (`#d4a017` / `#b8960c`) used strictly for functional highlights (action buttons, badges, current navigation steps).
* **Typography:**
  - **UI/Body:** Clean Swiss-style sans-serif (`Inter`).
  - **Prices, SKUs, and Tech Specs:** Fixed-width developer font (`JetBrains Mono`).
  - **Headers/Display:** Editorial serif (`Playfair Display`).

---

## 🗂️ Stylesheet Architecture (CSS File Breakdown)

Do **NOT** write all CSS rules in a single large `App.css` file. Separate them into modular stylesheets located in `frontend/src/styles/`:

1. **`theme.css`:**
   - Houses CSS custom variables, theme mappings (`[data-theme="light"]` vs `[data-theme="dark"]`), and typography imports.
2. **`reset.css`:**
   - Normalizes browser styles, sets global box-sizing rules, and enforces `border-radius: 0 !important;` globally.
3. **`navigation.css`:**
   - Layout rules for the portfolio navigation bar and e-commerce store navigation bar.
4. **`landing.css`:**
   - Styling for the portfolio homepage (Hero grid, Services, About, Team, and Testimonials panels).
5. **`store.css`:**
   - Styles for storefront product grids, technical spec sheets, cart tables, and user checkout containers.
6. **`admin.css`:**
   - Styling for the nested admin portal shell, sidebars, metrics cards, transaction logs, and data tables.

---

## 🏷️ Premium FontAwesome Integration & Icon Style

The application uses a custom premium FontAwesome kit loaded in the document head:
```html
<script src="https://zenithkandel.com.np/fontawesome/zenith-icons.js"></script>
```

### ⚠️ Strict Icon Conventions:
* All icons **MUST** use the custom **Light Sharp** font classes:
  - Format: `fa-light fa-sharp fa-[icon-name]`
  - *Example:* Use `<i className="fa-light fa-sharp fa-microchip" />` or `<i className="fa-light fa-sharp fa-cube" />`.
  - **Do NOT** use standard free styles like `fa-solid` or `fa-regular` directly on rendering layouts.

---

## 🧠 UX Psychology & User Engagement Mechanics

The interface must be designed to minimize user friction while introducing high-engagement feedback loops:

1. **Snappy Micro-Interactions:**
   - Hover states should feel responsive: lines expanding, buttons changing fill instantly (without sluggish transition curves), and interactive canvas lines tracking mouse movements.
2. **Wallet Balance Visibility:**
   - Render the virtual wallet balance (`रु X.XX`) prominently in the navigation headers, user profile cards, and checkout boxes. This encourages users to spend their store credit.
3. **Instant Dopamine Rewards:**
   - When a user follows social media or binds a referral code, trigger a success alert and instantly increment the balance counter (`+रु 5.00`) without requiring a page refresh.
4. **Zero-Friction Checkout:**
   - A single-page checkout form that automatically pre-fills user coordinates, estimates shipping fees on the fly based on latitude/longitude inputs, and processes transactions in a single click.
