# 💻 React Frontend Architecture & Design System

This document details the client-side architecture of the Himalix Labs web platform, covering React state managers, contexts, component models, and styling tokens.

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
  - If unauthenticated, redirects to `/store/login`.
* **`AdminRoute.js`:**
  - Verifies `token` exists AND `user.role === 'admin'`.
  - If valid, grants entry.
  - If invalid, redirects to `/store` (or blocks access).

---

## 📐 Design Tokens & Custom CSS (`App.css`)

All styling is managed through a customized vanilla CSS system with a focus on dark mode and high-contrast styling.

### 🎨 Key CSS Color System (Variables):

```css
:root {
  /* Common Palette */
  --accent: #d4a017;            /* Primary Gold / Amber */
  --accent-rgb: 212, 160, 23;
  --accent-light: #f3c64f;
  
  /* Font Family Stacks */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-serif: 'Playfair Display', Georgia, serif;
}

/* Light Theme Variables */
[data-theme="light"] {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #121212;
  --text-secondary: #495057;
  --text-muted: #868e96;
  --border: #e9ecef;
  --shadow: 0 4px 20px rgba(0,0,0,0.05);
}

/* Dark Theme Variables (Default) */
[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-secondary: #121212;
  --bg-card: #181818;
  --text-primary: #f8f9fa;
  --text-secondary: #ced4da;
  --text-muted: #6c757d;
  --border: #262626;
  --shadow: 0 8px 30px rgba(0,0,0,0.5);
}
```

### 📐 Structural Layout Rules:
* **Zero border-radius:** Enforced globally for all elements (buttons, inputs, cards, tables, popups) with `border-radius: 0 !important;`.
* **Micro-Animations:** Clean transition parameters on interactive properties:
  `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);`

---

## ✨ Interactive Motion & Components

Interactive visual elements are built using custom wrapper components and `framer-motion`:

1. **`ScrollReveal.js`:**
   - Detects when elements enter the viewport.
   - Triggers vertical slide-in and fade animations.
2. **`AnimatedCounter.js`:**
   - Increments stat count numbers dynamically when scrolled into view.
3. **`SmoothScroll.js`:**
   - Custom scrolling physics overlay providing inertia scroll mechanics.
4. **`InteractiveCanvas.js`:**
   - Renders a background particle grid behind the hero card.
5. **`LoadingScreen.js`:**
   - Pre-loader console log intro animation.
6. **`ImageUploadZone.js`:**
   - Drag-and-drop file upload interface that calls the backend upload endpoint.

---

## 📄 Key Pages Overview

### 🏡 Portfolio module:
* **`Landing.js`:**
  - Hero banner, dynamic services grid, mission cards, co-founders profiles card list, testimonials carousel, and direct contact portal.
* **`Admin.js` (Portfolio Manager):**
  - CMS admin panel. Provides tabs to edit landing texts, manage services, team profiles, reviews, and read contact logs.

### 🛍️ Store storefront module:
* **`Storefront.js`:**
  - Item list displaying item cards, category filters, text search, and sorting menus.
* **`ProductDetail.js`:**
  - Renders image galleries, technical specs tables, inventory stock indicators, and customer reviews.
* **`Cart.js`:**
  - Lists order item tables, supports cart editing, calculates taxes, maps delivery locations, and processes payments.
* **`Profile.js`:**
  - Tracks user metadata, logs virtual wallet transactions, applies referral codes, claims social credits, and lists past order sheets.
* **`Admin.js` (Store Manager):**
  - E-commerce manager dashboard. Includes stats cards, analytics charts, product tables, user profile editors, settings panels, and email receivers lists.
