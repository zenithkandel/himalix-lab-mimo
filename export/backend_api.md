# 🔌 Express REST API Blueprint & Route Catalog

This document defines the complete backend API surface for the Himalix Labs platform, including middlewares, parameters, schema payloads, and operational equations.

---

## 🔒 Security & Middleware Orchestration

All incoming API requests are processed through these standard security layers:
1. **Helmet:** Manages security headers (CORS resource policy, clickjacking protection, XSS blockers).
2. **CORS:** Restricts domains to the configured frontend address (e.g. `http://localhost:3000`). Binds `credentials: true`.
3. **JSON Parser:** Parses requests up to a limit of `50mb` to support image uploads.
4. **Static Uploads:** Serves local media assets via `/uploads` mapped from the backend server path.

### Custom Middlewares
* **`authMiddleware` (`backend/middleware/auth.js`):**
  - Reads the request `Authorization` header.
  - Expects a `Bearer <token>` format.
  - Verifies the cryptographic signature of the token against `process.env.JWT_SECRET`.
  - Unpacks the payload (`{ id, email, role }`) and binds it to `req.user`.
  - Returns `401 Unauthorized` (`{ error: 'Access denied. No token provided.' }` or `{ error: 'Invalid or expired token.' }`) on failure.
* **`adminMiddleware` (`backend/middleware/auth.js`):**
  - Requires `authMiddleware` to run first.
  - Checks if `req.user.role === 'admin'`.
  - Blocks requests with `403 Forbidden` (`{ error: 'Access denied. Admin privileges required.' }`) if the role is not admin.
* **`optionalAuth` (Store routes helper):**
  - Attempts to extract and verify the JWT header.
  - On success, binds user object to `req.user`.
  - On failure, silently continues without throwing errors, leaving `req.user` undefined (supporting guest/public viewing).

---

## 🚦 Endpoint Directory

### 🔑 Authentication Module (`/api/auth`)

#### 1. Register Local Account
* **Endpoint:** `POST /api/auth/register`
* **Security:** Public, Rate limited (10 requests/15 mins per IP).
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "role": "user",
    "referredByCode": "HMX-REF-XXXXXX"
  }
  ```
* **Process Logic:**
  1. Hashed password using `bcryptjs` (salt factor 10).
  2. Generates a unique referral code via `HMX-REF-` + random 6 characters.
  3. If `referredByCode` is passed, fetches the matching user.
  4. If found, sets the new user's initial wallet balance to `referral_bonus_amount` (fetched from settings table, defaults to `Rs. 5.00`).
  5. Performs database insertions in a transaction.
  6. Awards the referrer an equivalent bonus amount and inserts ledger entries into `wallet_transactions`.
  7. Dispatches a registration notification email to subscribed admins.
* **Response (201 Created):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 15,
      "email": "user@example.com",
      "role": "user",
      "avatar_url": null,
      "wallet_balance": 5.00,
      "referral_code": "HMX-REF-R3B9A8"
    }
  }
  ```

#### 2. Log in Local Account
* **Endpoint:** `POST /api/auth/login`
* **Security:** Public, Rate limited.
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200 OK):** Returns JWT token and user details block.

#### 3. Fetch Public Shop Config
* **Endpoint:** `GET /api/auth/config`
* **Security:** Public.
* **Response (200 OK):**
  ```json
  {
    "googleClientId": "1080725502217-frvhi8...",
    "googleAuthEnabled": true,
    "salesTaxRate": 13,
    "lowStockThreshold": 5,
    "maintenanceMode": false,
    "storeBannerText": "Welcome to Himalix Electronics Store...",
    "deliveryPerKmRate": 15.00,
    "deliveryMinCharge": 50.00,
    "deliveryFreeThreshold": 2000.00,
    "emergencyContactPhone": "9800000000",
    "emergencyContactEmail": "info@himalixlab.com"
  }
  ```

#### 4. Google OAuth Sign-In
* **Endpoint:** `POST /api/auth/google`
* **Security:** Public, Rate limited.
* **Request Body:**
  ```json
  {
    "token": "google_credential_id_token_jwt"
  }
  ```
* **Process Logic:**
  1. Checks if Google Auth is enabled in the settings table.
  2. Verifies the token using Google OAuth2 client library against the `google_client_id` fetched from the settings table.
  3. Extracts profile variables (`email`, `sub` (Google ID), `picture` (avatar URL)).
  4. Queries users by `google_id`. If exists, logs them in.
  5. If user exists with the same email but no Google ID, links the account by saving `google_id` and updating the avatar.
  6. If no user exists, inserts a new user record with a blank password hash and generates a unique referral code.
* **Response (200 OK):** Returns JWT token and unified user details.

#### 5. Authenticated Profile Identity
* **Endpoint:** `GET /api/auth/me`
* **Security:** Token required.
* **Response (200 OK):** Returns user object `{ id, email, role, avatar_url, wallet_balance, referral_code }`.

---

### 📰 Portfolio Landing CMS Module (`/api/content`)

#### 1. Fetch Landing Page Content
* **Endpoint:** `GET /api/content`
* **Security:** Public.
* **Response (200 OK):**
  - Returns a structured dictionary containing all content key-values grouped by section, active services list, active team members, active testimonials, and global site settings.

#### 2. Submit Contact Form Message
* **Endpoint:** `POST /api/content/contact`
* **Security:** Public.
* **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "subject": "STL Print Inquiry",
    "message": "Can you print ABS?"
  }
  ```
* **Response (201 Created):** `{ "message": "Message sent successfully" }`

---

### 🛍️ Himalix Store Core Module (`/api/store`)

#### 1. List Products
* **Endpoint:** `GET /api/store/products`
* **Security:** Public.
* **Query Parameters:**
  - `search` (string) — Filters name/description matching search term.
  - `category` (string) — Filters by exact category name.
  - `sort` (string) — Sort criteria (`'price_asc'`, `'price_desc'`, `'newest'`).
  - `page` (int) — Defaults to `1`.
  - `limit` (int) — Defaults to `12`.
* **Response (200 OK):** Returns paginated list of items, page count, and total matches.

#### 2. Get Product Details
* **Endpoint:** `GET /api/store/products/:id`
* **Response (200 OK):** Full product details (including technical specifications JSON object).

#### 3. View Shopping Cart
* **Endpoint:** `GET /api/store/cart`
* **Security:** Token required.
* **Response (200 OK):** `{ "items": [...] }`

#### 4. Add Item to Cart
* **Endpoint:** `POST /api/store/cart/add`
* **Request Body:** `{ "productId": 12, "quantity": 2 }`
* **Process Logic:** Inserts item or updates quantity if product already exists in the cart.
* **Response (201 Created):** Details of the cart item.

#### 5. Update Cart Item Quantity
* **Endpoint:** `PUT /api/store/cart/update`
* **Request Body:** `{ "cartItemId": 3, "quantity": 5 }`

#### 6. Delete Cart Item
* **Endpoint:** `DELETE /api/store/cart/remove/:id`

#### 7. Checkout Order
* **Endpoint:** `POST /api/store/orders/checkout`
* **Security:** Token required.
* **Request Body:**
  ```json
  {
    "shippingDetails": {
      "fullName": "Zenith Kandel",
      "email": "zenith@himalix.com",
      "phone": "9812345678",
      "province": "Bagmati",
      "district": "Kathmandu",
      "city": "Kathmandu",
      "receivingLocation": "27.7172, 85.3240"
    },
    "paymentMethod": "store_credit"
  }
  ```
* **Process Logic & Equations:**
  1. Checks user shopping cart. Returns `400 Bad Request` if empty.
  2. Runs stock validations. Outsourced products (`stock_type = 'outsourced'`) bypass stock validation.
  3. Calculates delivery parameters:
     - **HQ Coordinates:** `Latitude: 27.7029`, `Longitude: 85.3072` (located in Kathmandu).
     - **Distance Equation (Haversine Formula):**
       $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
       where $R = 6371\text{ km}$, lat/lon inputs are converted to radians.
     - **Shipping Fee:** If order subtotal $\ge$ `delivery_free_threshold`, fee is `0.00`. Else:
       $$\text{Fee} = \max(\text{delivery\_min\_charge}, \text{distanceKm} \times \text{delivery\_per\_km\_rate})$$
  4. Calculates sales tax based on the subtotal:
     $$\text{Tax} = \text{subtotal} \times \text{sales\_tax\_rate}$$
  5. Computes total order cost:
     $$\text{Total} = \text{subtotal} + \text{Tax} + \text{Shipping Fee}$$
  6. Checks wallet balance if `paymentMethod === 'store_credit'`.
  7. Generates tracking code: `HMX-` + last 6 digits of current timestamp + random 4-character uppercase alphanumeric string.
  8. Calculates Delivery ETA: Finds the maximum processing delay `outsource_days` among all ordered items.
     $$\text{ETA Min Days} = \max(\text{outsource\_days}) + 1\text{ (transit day)}$$
     $$\text{ETA Max Days} = \max(\text{outsource\_days}) + 2\text{ (transit days)}$$
  9. Performs database operations in a transaction (deducts stock for in-stock products, clears cart, deducts wallet balance if using store credit, logs transaction).
  10. Dispatches operational receipt emails to client and subscribed admin receivers.
  11. If stock levels drop below the configured threshold, sends low stock emails.
* **Response (201 Created):**
  ```json
  {
    "message": "Order created successfully",
    "orderId": 48,
    "trackingCode": "HMX-822456-EFGH",
    "totalAmount": 2240.00,
    "status": "pending"
  }
  ```

#### 8. Fetch Order History
* **Endpoint:** `GET /api/store/orders/history`
* **Response (200 OK):** Groups order records and line items into structured lists.

#### 9. Get Wallet Details & History
* **Endpoint:** `GET /api/store/wallet/history`
* **Response (200 OK):** Returns current wallet balance, user's referral code, referred-by inviter ID, and transaction logs.

#### 10. Bind Referral Code
* **Endpoint:** `POST /api/store/wallet/referral`
* **Request Body:** `{ "referralCode": "HMX-REF-ABC123" }`
* **Process Logic:** Verifies that user hasn't already bound a code, code is not their own, and referrer code exists. Adds bonus credit to both users in a transaction.

#### 11. Claim Social Credits
* **Endpoint:** `POST /api/store/wallet/claim-social`
* **Request Body:** `{ "platform": "instagram" }`
* **Process Logic:** Verifies user hasn't claimed yet for the platform. Logs the claim in `social_claims` and credits the wallet balance.

#### 12. List & Post Reviews
* **Endpoint:** `GET /api/store/reviews/:product_id`
* **Endpoint:** `POST /api/store/reviews/:product_id` (Requires Token)

---

### 👑 General CMS Admin Module (`/api/admin`)
*(Protected by Token and Admin role guards)*

* **`GET /api/admin/content`** / **`PUT /api/admin/content/:id`** / **`PUT /api/admin/content/bulk`** — CMS content operations.
* **`POST /api/admin/services`** / **`PUT /api/admin/services/:id`** / **`DELETE /api/admin/services/:id`** — Services CRUD.
* **`POST /api/admin/team`** / **`PUT /api/admin/team/:id`** / **`DELETE /api/admin/team/:id`** — Founders profiles CRUD.
* **`POST /api/admin/testimonials`** / **`PUT /api/admin/testimonials/:id`** / **`DELETE /api/admin/testimonials/:id`** — Testimonial CRUD.
* **`PUT /api/admin/settings/:key`** — Edit brand details/colors.
* **`GET /api/admin/messages`** / **`PUT /api/admin/messages/:id/read`** / **`DELETE /api/admin/messages/:id`** — Read/manage contact messages.
* **`POST /api/admin/upload`** — Saves a single image file to `/uploads` and returns URL.
* **`GET /api/admin/stats`** — Returns aggregate metrics (total services, team count, testimonials count, unread contact messages).

---

### 👑 Store E-Commerce Admin Module (`/api/store/admin`)
*(Protected by Token and Admin role guards)*

* **`POST /api/store/admin/upload`** / **`POST /api/store/admin/upload-multiple`** — Saves image uploads.
* **`GET /api/store/admin/analytics`** — Deep analytical overview:
  - Total revenue (sum of non-cancelled orders).
  - Status counts and revenues.
  - Average order value.
  - Last 7 days daily sales count.
  - Top 5 products by units sold.
  - Inventory count grouped by product category.
  - Recent orders.
* **`GET /api/store/admin/products`** / **`POST /api/store/admin/products`** / **`PUT /api/store/admin/products/:id`** / **`DELETE /api/store/admin/products/:id`** — Products catalog CRUD.
* **`GET /api/store/admin/users`** / **`PUT /api/store/admin/users/:id`** / **`PUT /api/store/admin/users/:id/password`** / **`PUT /api/store/admin/users/:id/role`** / **`DELETE /api/store/admin/users/:id`** — User management, role elevation, and password resetting.
* **`GET /api/store/admin/users/:id/orders`** — Orders placed by a specific customer.
* **`GET /api/store/admin/carts`** — Audits active shopping carts.
* **`GET /api/store/admin/orders`** / **`PUT /api/store/admin/orders/:id/status`** / **`DELETE /api/store/admin/orders/:id`** — Order management (update status, tracking details, payment status).
* **`GET /api/store/admin/settings`** / **`PUT /api/store/admin/settings`** — Update store configurations (tax rates, shipping fees, SMTP mailer settings).
* **`POST /api/store/admin/users/:id/credit`** — Manually deposit virtual credits (e.g. eSewa transfer).
* **`GET /api/store/admin/reviews`** / **`DELETE /api/store/admin/reviews/:id`** — Moderates product reviews.
* **`GET /api/store/admin/wallet/transactions`** — View all wallet transaction history logs.
* **`GET /api/store/admin/social-claims`** — View social media follow claims logs.
* **`GET /api/store/admin/notification-receivers`** / **`POST /api/store/admin/notification-receivers`** / **`PUT /api/store/admin/notification-receivers/:id`** / **`DELETE /api/store/admin/notification-receivers/:id`** — Manage admin notification receiver emails.
