# Himalix Store — Detailed Analysis and Findings

An in-depth analysis of the `/store` sub-system (frontend and backend codebase) was performed to address reports of order handling, tracking, cart management, and admin dashboard rendering issues. 

Below is the compilation of the identified inconsistencies, bugs, and architectural design gaps.

---

## 1. Key Inconsistencies & Data Type Mismatches

These errors stem from differences in the JSON keys and data types returned by the backend REST API versus those expected and read by the frontend React components.

### A. Order Total Fields (`total` vs. `total_amount`)
* **The Inconsistency:** The backend order history and admin order routes map the SQL `total_amount` column as `total` in the JSON response:
  * *Backend Order List:* `ordersMap[row.id] = { total: row.total_amount, ... }` ([orders.js:290](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/backend/store/orders.js#L290))
  * *Backend Admin Order List:* `ordersMap[row.id] = { total: row.total_amount, ... }` ([admin/store/index.js:480](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/backend/admin/store/index.js#L480))
* **The Resulting Issues:**
  * **Profile Page:** The frontend order list on the profile page reads `order.total_amount` ([Profile.js:302](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/store/Profile.js#L302)), which evaluates to `undefined` and displays as `Rs. 0` or empty.
  * **Admin Panel:** The admin order management table renders order totals using `Number(o.total_amount).toFixed(2)` ([OrderManager.js:54](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/admin/store/components/OrderManager.js#L54)). Since `o.total_amount` is `undefined`, it evaluates to `Number(undefined)` which yields **`Rs. NaN`** in the UI.

### B. Order Code Fields (`tracking_code` vs. `order_code`)
* **The Inconsistency:** The database uses the column `tracking_code`. The backend order history returns it as `tracking_code` in the JSON. However, the frontend profile page attempts to print `order.order_code` with a fallback to `order.id` ([Profile.js:297](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/store/Profile.js#L297)).
* **The Resulting Issue:** The order history list displays raw SQL IDs (e.g. `#1`, `#2`) rather than user-friendly tracking codes (e.g. `HMX-453289-ABCD`), despite the code being generated.

### C. Technical Specifications (`technical_specs` vs. `specs`)
* **The Inconsistency:** The database column for product specifications is `technical_specs` (JSON format). The backend returns this raw property. But the frontend details page reads `product.specs` ([ProductDetail.js:237](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/store/ProductDetail.js#L237)).
* **The Resulting Issue:** The "Specifications" tab and quick specifications list on the product detail page are always empty/hidden, as `product.specs` is `undefined`.

---

## 2. Severe Rendering & Crash Issues

These bugs cause React to crash at runtime or hide items from the user.

### A. React Crash on Order Detail Address Render
* **The Bug:** In `Profile.js` ([Line 341-343](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/store/Profile.js#L341-L343)), when a user clicks on an order to open details, the drawer attempts to render `selectedOrder.shipping_address` directly:
  ```javascript
  <p>{selectedOrder.shipping_address}</p>
  ```
  However, the backend has parsed the JSON string in the SQL database into a nested JavaScript object: `JSON.parse(row.shipping_address)`.
* **The Result:** React throws a fatal runtime exception: **`Objects are not valid as a React child`**, crashing the entire application tab when the user attempts to view their order details.

### B. "No Orders Yet" Bug (Array Wrapping Misalignment)
* **The Bug:** The backend history endpoint `/api/store/orders/my` returns a flat JSON array of orders ([orders.js:310](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/backend/store/orders.js#L310)). But in `Profile.js` ([Line 86](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/store/Profile.js#L86)), the frontend sets the orders state as:
  ```javascript
  setOrders(d.orders || [])
  ```
  Since the response has no `orders` property envelope, `d.orders` is `undefined` and defaults to `[]`.
* **The Result:** The orders page always renders "No orders yet" even after successful checkouts.
* **Duplicate in Admin View:** The exact same issue exists in `StoreAdmin.js` ([Line 60](file:///c:/xampp/htdocs/codes/himalix-lab-mimo/frontend/src/admin/store/Admin.js#L60)), where it reads `data.orders || []` instead of the flat array. Admin orders tab remains permanently empty.

---

## 3. Order Handling, Cart & Checkout Bugs

These represent functional flaws in the e-commerce transaction workflow.

### A. Total Loss of Street Address (`address_line`)
* **The Bug:** During checkout, the customer inputs their street address in the `address_line` form field. However, when building the `shippingDetails` object, the backend checkout handler maps:
  * `fullName`
  * `phone`
  * `province`
  * `district`
  * `city`
  * `receivingLocation` (coordinates)
  * ...but it **entirely ignores** `addr.address_line`.
* **The Result:** The actual street address is deleted during normalization, leaving only the city and district. Deliveries cannot be completed since courier partners have no street-level address details.

### B. Unvalidated Coordinate Requirement (API 400 Block)
* **The Bug:** The backend checkout API lists `shippingDetails.receivingLocation` as strictly mandatory. If missing, it immediately rejects the checkout with a `400 Bad Request` ("Shipping details are incomplete").
* **The Result:** The frontend checkout form does not perform validation checks on the `lat` and `lng` coordinates before invoking the checkout API. If a user fills out all standard inputs (name, phone, street, city, district) and proceeds, the request silently fails with a 400 error, blocking completion.

### C. Phantom Coupon Discount System
* **The Bug:** The storefront UI in `Cart.js` includes a complete coupon code interface, calling POST `/api/store/orders/apply-coupon` and deducting the discount from the total locally.
* **The Result:** The backend has **zero support** for coupons. There are no tables for coupon entities, no seed data, and no `/apply-coupon` API route. Applying any coupon fails with 404/500, and checkout completely bypasses coupon deduction.

### D. Sales Tax Transparency Gap
* **The Bug:** The backend checkout handler automatically calculates and tacks on a 13% sales tax to the order total (`totalAmount = subtotal + tax + shippingFee`).
* **The Result:** The frontend cart summary displays no tax breakdown or warnings. The user is presented a total of `Subtotal + Shipping` but their wallet or cash receipt is charged 13% more, causing discrepancies and wallet balance errors.

### E. Guest Cart Sync Failure
* **The Bug:** When a guest user adds components to their localStorage cart and subsequently signs in or registers, the guest cart is overwritten by their server-side cart. The local items are deleted instead of being merged or synced.

---

## 4. Other Functional Gaps (Reviews and Wallet)

### A. All Product Reviews Display as "Anonymous"
* **The Bug:** `ProductDetail.js` attempts to render reviews with `r.user_name || 'Anonymous'`. But the reviews database queries inside the backend reviews API (`backend/store/reviews.js`) select only `u.email` and `u.avatar_url` without the user's name:
  ```sql
  SELECT r.id, r.rating, r.comment, r.created_at, u.email, u.avatar_url ...
  ```
* **The Result:** `r.user_name` is always `undefined`, displaying all customer comments as written by "Anonymous".

### B. Social Follow Reward Balance Sync Lag
* **The Bug:** When a user claims their YouTube (Rs. 50) or Instagram (Rs. 25) reward, the profile page expects the API to return the updated wallet object `d.wallet` to refresh the state:
  ```javascript
  if (res.ok && d.wallet) setWallet(d.wallet);
  ```
  However, the backend `/api/store/wallet/social-claim` endpoint returns only a message and bonus amount, without the wallet balance updates.
* **The Result:** The user's displayed balance does not update until they perform a manual page refresh.
