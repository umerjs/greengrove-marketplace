# GreenKarachi — MERN Stack PRD & App Flow

## 1. Project Overview

GreenKarachi is a B2B wholesale plant marketplace for Karachi connecting bulk buyers (businesses, landscapers, donors) with 400+ registered nursery sellers. The platform aggregates plant stock across all nurseries in real-time so a buyer can instantly know whether 10,000 coconut plants are available, from how many sellers, and place a single order that the system splits across them automatically.

**What makes this different from a regular ecommerce app:**

- No buyer sees per-nursery stock — they see one aggregated number across all nurseries
- A single buyer order can span multiple nurseries; the system assigns sub-orders automatically
- Sellers handle their own delivery; the platform records but does not process payments (COD between parties)
- New nursery sellers require Admin approval before going live

**Stack:** React + Vite (frontend) · Node.js + Express (backend) · MongoDB + Mongoose (database) · JWT auth · Cloudinary (images) · Vercel + Render + MongoDB Atlas (deployment)

## 2. User Roles & Permissions

| Role               | Who                         | Key Permissions                                                                                   |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------- |
| **Super Admin**    | Platform owner (Saylani)    | Approve/reject sellers, manage all users, view all inventory & orders, configure platform         |
| **Nursery Seller** | Nursery owner/manager       | List own products, update own stock, receive & manage assigned sub-orders, update delivery status |
| **Buyer / Donor**  | Business, landscaper, donor | Post demand requests, browse aggregated stock, place bulk orders, track consolidated order status |
| **Guest**          | Unauthenticated visitor     | Browse public marketplace (read-only, no prices or orders)                                        |

**Critical permission rules enforced server-side (not just UI):**

- Seller middleware: every inventory/product/order route checks `nursery.owner === req.user.id` — a seller cannot touch another nursery's data even with a valid token
- Buyer middleware: `role === 'buyer'` required on all order creation routes; sellers cannot place orders
- Admin middleware: all `/api/v1/admin/*` routes check `role === 'super_admin'` on the server; hiding buttons in the UI is not security
- Seller accounts start as `status: 'pending'`; all seller-facing routes additionally check `status === 'approved'` before allowing any listing or order operations

## 3. MongoDB Data Models

**User**

```js
{
  _id, email, passwordHash,
  role: 'super_admin' | 'nursery_seller' | 'buyer',
  status: 'active' | 'pending' | 'suspended',
  name, phone,
  createdAt, updatedAt
}
```

**Nursery**

```js
{
  _id, owner: ObjectId → User,
  name, description, address, phone,
  serviceAreas: [String],   // Karachi zones
  logo: String,             // Cloudinary URL
  coverImage: String,
  verificationStatus: 'pending' | 'verified' | 'suspended',
  approvedBy: ObjectId → User,
  approvedAt: Date,
  rating: { average: Number, count: Number },
  totalOrdersFulfilled: Number,
  memberSince: Date,
  createdAt, updatedAt
}
```

**ProductCatalog** *(platform-wide, admin-managed)*

```js
{
  _id, name, slug,
  category: 'plants' | 'fertilizers' | 'seeds' | 'tools',
  unit: 'pieces' | 'kg' | 'litre' | 'bag',
  description, careNotes, imageUrl,
  isActive: Boolean,
  createdAt, updatedAt
}
```

**NurseryInventory** *(one doc per nursery per product — the core collection)*

```js
{
  _id,
  nursery: ObjectId → Nursery,
  product: ObjectId → ProductCatalog,
  quantityAvailable: Number,
  pricePerUnit: Number,           // PKR
  minOrderQty: Number,
  lowStockThreshold: Number,
  isListed: Boolean,              // seller toggle for marketplace
  reservedQty: Number,            // soft-held during active checkouts
  lastUpdatedAt: Date
  // Compound unique index: { nursery: 1, product: 1 }
}
```

**MarketplaceRequest** *(buyer posts a demand)*

```js
{
  _id, buyer: ObjectId → User,
  product: ObjectId → ProductCatalog,
  quantityRequested: Number,
  status: 'open' | 'matched' | 'ordered' | 'cancelled',
  matchSummary: {
    totalAvailable: Number,
    nurseryCount: Number
  },
  createdAt
}
```

**Order** *(parent order — buyer sees this)*

```js
{
  _id, buyer: ObjectId → User,
  product: ObjectId → ProductCatalog,
  totalQuantity: Number,
  priceSnapshot: Number,          // weighted avg PKR at order time
  totalAmountPKR: Number,
  status: 'pending' | 'confirmed' | 'partially_dispatched' | 'fulfilled' | 'cancelled',
  sellerOrders: [ObjectId → SellerOrder],
  deliveryAddress: String,
  notes: String,
  createdAt, updatedAt
}
```

**SellerOrder** *(sub-order assigned to one nursery)*

```js
{
  _id,
  parentOrder: ObjectId → Order,
  nursery: ObjectId → Nursery,
  product: ObjectId → ProductCatalog,
  quantityAssigned: Number,
  pricePerUnit: Number,
  amountPKR: Number,
  status: 'pending' | 'accepted' | 'rejected' | 'dispatched' | 'delivered',
  rejectionReason: String,
  dispatchedAt: Date,
  deliveredAt: Date,
  createdAt, updatedAt
}
```

**Notification**

```js
{
  _id, recipient: ObjectId → User,
  type: 'new_order' | 'low_stock' | 'approval' | 'status_update',
  message: String,
  isRead: Boolean,
  refId: ObjectId,    // order or nursery it relates to
  createdAt
}
```

**Key indexes:**

- `NurseryInventory`: compound unique `{ nursery, product }` + `{ product, isListed, quantityAvailable }`
- `SellerOrder`: `{ parentOrder }`, `{ nursery, status }`
- `Order`: `{ buyer, status }`, `{ createdAt: -1 }`
- `Notification`: `{ recipient, isRead }`

## 4. App Flow (End-to-End)

**Flow A — Seller Onboarding**

1. Seller registers with email + password + nursery details
2. Account created with `status: 'pending'`, `verificationStatus: 'pending'`
3. Admin sees application in approval queue
4. Admin approves → seller `status` → `'active'`, nursery `verificationStatus` → `'verified'`
5. Seller can now log in, add products to their inventory, and toggle listings live

**Flow B — Buyer Places a Bulk Order**

1. Buyer registers/logs in (no approval needed)
2. Buyer searches for a product (e.g. "Coconut Plant")
3. System queries `NurseryInventory` aggregation: `SUM(quantityAvailable - reservedQty)` where `nursery.verificationStatus = 'verified'` AND `isListed = true`
4. Buyer sees: "9,979 Coconut Plants available from 4 nurseries — PKR 45–65/unit"
5. Buyer enters quantity (e.g. 10,000) → system checks if aggregate meets demand
6. Checkout: system places a **10-minute soft reserve** on required qty across top-matching nurseries (sorted by price asc, then qty desc)
7. Buyer confirms → **Order created** + **SellerOrders created per nursery** (e.g. 4,000 + 3,000 + 2,979 from 3 nurseries)
8. Each nursery's `reservedQty` decremented, `quantityAvailable` decremented
9. Each seller notified via in-app notification
10. Buyer sees consolidated order with status tracker

**Flow C — Seller Fulfills Sub-Order**

1. Seller logs in → sees new sub-order in dashboard
2. Seller accepts → `SellerOrder.status` → `'accepted'`
3. Seller arranges own delivery → marks `'dispatched'` with dispatch date
4. Delivery done → marks `'delivered'`
5. Parent `Order.status` auto-updates: all sub-orders delivered → `'fulfilled'`; partial → `'partially_dispatched'`
6. Buyer sees updated status on their order tracker

**Flow D — Seller Rejects Sub-Order**

1. Seller rejects with reason → `SellerOrder.status` → `'rejected'`
2. System re-runs nursery matching for the rejected quantity against remaining available stock
3. New SellerOrder created for next best nursery (if available)
4. If no nursery can cover → buyer notified, partial fulfillment offered or order cancelled

**Flow E — Admin Operations**

1. Admin approves/rejects pending seller applications
2. Admin monitors all orders, delivery statuses, and can intervene
3. Admin manages product catalog (add/edit product types)
4. Admin can suspend sellers — their listings auto-hidden from marketplace
5. Admin views platform-wide inventory dashboard per product

## 5. API Architecture

**Folder structure — server:**

```
server/src/
  config/         # db.js, cloudinary.js, env validation
  models/         # User, Nursery, ProductCatalog, NurseryInventory,
                  # Order, SellerOrder, Notification, MarketplaceRequest
  routes/         # one file per domain
  controllers/    # business logic called by routes
  services/       # orderSplitter.js, inventoryEngine.js, notifier.js
  middleware/     # auth.js, requireRole.js, requireApproved.js, rateLimit.js
  validators/     # Joi/Zod schemas per route
  utils/          # asyncHandler, ApiError, ApiResponse
  tests/
  server.js
```

**Route groups and key endpoints:**

| Route                                     | Auth     | Description                            |
| ----------------------------------------- | -------- | -------------------------------------- |
| `POST /api/v1/auth/register`              | —        | Register buyer or seller               |
| `POST /api/v1/auth/login`                 | —        | Returns JWT access + refresh token     |
| `GET /api/v1/marketplace/products`        | guest    | Aggregated stock per product           |
| `GET /api/v1/marketplace/products/:id`    | guest    | Single product aggregate + price range |
| `POST /api/v1/marketplace/request`        | buyer    | Post a demand request                  |
| `POST /api/v1/orders`                     | buyer    | Place order (triggers split)           |
| `GET /api/v1/orders/my`                   | buyer    | Buyer's order history                  |
| `GET /api/v1/seller/inventory`            | seller   | Own nursery's stock                    |
| `POST /api/v1/seller/inventory`           | seller   | Add/update product stock               |
| `PATCH /api/v1/seller/inventory/:id`      | seller   | Update quantity or price               |
| `GET /api/v1/seller/orders`               | seller   | Sub-orders assigned to this nursery    |
| `PATCH /api/v1/seller/orders/:id/status`  | seller   | Accept / reject / dispatch / deliver   |
| `GET /api/v1/admin/sellers/pending`       | admin    | Approval queue                         |
| `PATCH /api/v1/admin/sellers/:id/approve` | admin    | Approve/reject nursery                 |
| `GET /api/v1/admin/inventory`             | admin    | Platform-wide stock per product        |
| `GET /api/v1/admin/orders`                | admin    | All orders with filters                |
| `POST /api/v1/admin/products`             | admin    | Add to product catalog                 |
| `GET /api/v1/notifications/my`            | any auth | Unread notifications                   |

**Middleware chain per request:** `verifyJWT` → `requireRole(['seller'])` → `requireApproved` → controller

**Key service: `inventoryEngine.js`**

```js
// MongoDB aggregation for platform-wide total
NurseryInventory.aggregate([
  { $lookup: { from: 'nurseries', localField: 'nursery',
      foreignField: '_id', as: 'nurseryData' } },
  { $match: { 'nurseryData.verificationStatus': 'verified',
      isListed: true } },
  { $group: {
      _id: '$product',
      totalAvailable: { $sum: { $subtract: ['$quantityAvailable','$reservedQty'] } },
      nurseryCount: { $sum: 1 },
      minPrice: { $min: '$pricePerUnit' },
      maxPrice: { $max: '$pricePerUnit' }
  }},
  { $lookup: { from: 'productcatalogs', localField: '_id',
      foreignField: '_id', as: 'product' } }
])
```

**Key service: `orderSplitter.js`**

```js
// Given productId + qty, find best nurseries to fill the order
async function splitOrder(productId, totalQty) {
  const sources = await NurseryInventory.find({
    product: productId,
    isListed: true,
    quantityAvailable: { $gt: 0 }
  }).populate('nursery').sort({ pricePerUnit: 1, quantityAvailable: -1 });

  const splits = [];
  let remaining = totalQty;
  for (const source of sources) {
    if (remaining <= 0) break;
    const take = Math.min(source.quantityAvailable - source.reservedQty, remaining);
    if (take > 0) { splits.push({ nursery: source.nursery, qty: take,
        price: source.pricePerUnit, inventoryDoc: source._id }); }
    remaining -= take;
  }
  if (remaining > 0) throw new ApiError(400,
    `Only ${totalQty - remaining} of ${totalQty} available`);
  return splits;
}
```

## 6. Inventory Counting Engine

The hardest technical piece. Must always give a buyer an accurate real-time answer to "how many \[product\] does all of GreenKarachi have right now?"

**Two-level inventory tracking per nursery per product:**

- `quantityAvailable` — what the seller says they physically have
- `reservedQty` — soft-held during active checkouts (released after 10 min if order not confirmed)
- **Effective stock = `quantityAvailable - reservedQty`**

**What triggers a stock change:**

| Event                             | `quantityAvailable`              | `reservedQty`                |
| --------------------------------- | -------------------------------- | ---------------------------- |
| Seller updates stock              | Set to new value                 | Unchanged                    |
| Buyer initiates checkout          | Unchanged                        | +qty (soft reserve)          |
| Checkout expires (10 min)         | Unchanged                        | -qty (released)              |
| Order confirmed                   | -qty                             | -qty (reservation fulfilled) |
| Order cancelled (before dispatch) | +qty (restored)                  | Unchanged                    |
| SellerOrder rejected              | +qty (restored for that nursery) | Unchanged                    |

**Concurrency protection in MongoDB:** MongoDB does not have row-level locks like Postgres. Use `findOneAndUpdate` with a conditional query to prevent overselling:

```js
// Atomic reserve — only succeeds if effective stock >= requested qty
const result = await NurseryInventory.findOneAndUpdate(
  {
    _id: inventoryDocId,
    $expr: {
      $gte: [
        { $subtract: ['$quantityAvailable', '$reservedQty'] },
        qtyToReserve
      ]
    }
  },
  { $inc: { reservedQty: qtyToReserve } },
  { new: true }
);
if (!result) throw new ApiError(409, 'Stock no longer available — another buyer just reserved it');
```

This is the MongoDB equivalent of a Postgres `SELECT FOR UPDATE`. The condition and the update happen atomically.

**10-minute hold expiry:** Store reserve records in a `StockReserve` collection and run a background reaper to release expired quantities before deleting their records. Do not put a MongoDB TTL index on `expiresAt`: MongoDB would delete the reserve document without decrementing `reservedQty`, permanently holding stock. A normal index on `expiresAt` keeps the cleanup scan efficient:

```js
StockReserveSchema.index({ expiresAt: 1 });
// A scheduled reaper claims each expired reserve, decrements reservedQty, then deletes it.
```

**Seller stock update model:** Sellers set an **absolute value** ("I have 350 plants") — simpler and more accurate than increment/decrement for physical nursery owners who do manual counts. System stores the previous value in an `InventoryMovement` log for audit.

**Low-stock alert:** After every inventory decrement, check: if `quantityAvailable <= lowStockThreshold`, create a `Notification` for the seller.

## 7. Frontend Pages & Components

**React + Vite folder structure:**

```
client/src/
  pages/
    Home.jsx
    auth/Login.jsx, Register.jsx
    marketplace/Index.jsx, ProductDetail.jsx
    buyer/Dashboard.jsx, Orders.jsx, OrderDetail.jsx
    seller/Dashboard.jsx, Inventory.jsx, Orders.jsx, Profile.jsx
    admin/Dashboard.jsx, Sellers.jsx, Products.jsx, Orders.jsx
    Checkout.jsx
  components/
    layout/Navbar.jsx, Sidebar.jsx, Footer.jsx
    ui/ProductCard.jsx, StockBadge.jsx, StatusBadge.jsx,
       NotificationBell.jsx, ConfirmDialog.jsx
    forms/InventoryForm.jsx, AddressForm.jsx, RequestForm.jsx
  features/         # Redux slices or React Query hooks
  hooks/            # useAuth, useInventory, useOrders
  services/         # axios instance + API calls
  context/          # AuthContext
```

**Page by page:**

| Page             | Route               | Who         | Key elements                                                                                 |
| ---------------- | ------------------- | ----------- | -------------------------------------------------------------------------------------------- |
| Landing          | `/`                 | guest       | Hero, live stats counter, category grid, featured nurseries, "Post a Demand" CTA             |
| Marketplace      | `/marketplace`      | guest/buyer | Product grid with aggregated stock cards, sidebar filters (category, min qty, price), search |
| Product Detail   | `/marketplace/:id`  | guest/buyer | Aggregate count, price range, nursery count, bulk order form                                 |
| Login            | `/auth/login`       | —           | Email + password, role-aware redirect                                                        |
| Register         | `/auth/register`    | —           | Role selector → extra nursery fields if seller                                               |
| Checkout         | `/checkout`         | buyer       | Order summary, nursery split preview, COD confirm                                            |
| Buyer Dashboard  | `/buyer/dashboard`  | buyer       | Active orders, demand requests, quick stats                                                  |
| Buyer Orders     | `/buyer/orders`     | buyer       | Order list with consolidated status tracker                                                  |
| Seller Dashboard | `/seller/dashboard` | seller      | Stats cards (stock, orders, revenue), notification feed                                      |
| Seller Inventory | `/seller/inventory` | seller      | Product table with qty + price edit inline, toggle listed, low-stock alerts                  |
| Seller Orders    | `/seller/orders`    | seller      | Sub-orders table, accept/reject/dispatch/deliver actions                                     |
| Seller Profile   | `/seller/profile`   | seller      | Nursery details, verification badge, rating, edit form                                       |
| Admin Dashboard  | `/admin`            | admin       | Platform stats: nurseries, products, orders, GMV                                             |
| Admin Sellers    | `/admin/sellers`    | admin       | Pending approvals queue + all sellers table, suspend/approve                                 |
| Admin Products   | `/admin/products`   | admin       | Product catalog management                                                                   |
| Admin Orders     | `/admin/orders`     | admin       | All orders with full detail and status override                                              |

**StockBadge component — marketplace card:**

```jsx
<div className="product-card">
  <h3>{product.name}</h3>
  <span className="category-badge">{product.category}</span>
  <div className="stock-line">
    <strong>{total.toLocaleString()} units</strong> available
    across {nurseryCount} nurseries
  </div>
  <div className="price-range">PKR {minPrice} – {maxPrice} / unit</div>
  <button>Request to Purchase</button>
</div>
```

**Protected routes:** `<PrivateRoute role="seller">` wraps all `/seller/*` routes — redirects to login if no token, to `/unauthorized` if wrong role.

## 8. Tech Stack

| Layer            | Technology                                             | Why                                                       |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Frontend         | React 18 + Vite                                        | Fast dev build, your existing skill                       |
| Styling          | Tailwind CSS                                           | Utility-first, rapid UI                                   |
| State            | React Query + Zustand                                  | Server state (queries) + client state (auth, cart)        |
| Backend          | Node.js + Express.js                                   | REST API, middleware chain, your existing MERN skill      |
| Database         | MongoDB Atlas + Mongoose                               | Document model, aggregation pipeline for inventory engine |
| Auth             | JWT (access 15 min + refresh 7 days, HTTP-only cookie) | Stateless, role claims in payload                         |
| Images           | Cloudinary                                             | Product + nursery photos, transform URLs                  |
| Email            | Nodemailer + Gmail SMTP (dev) / SendGrid (prod)        | Order confirmations, approval notifications               |
| Rate limiting    | express-rate-limit                                     | Login: 5 req / 15 min per IP                              |
| Validation       | Joi or Zod                                             | Schema validation on every route                          |
| Frontend hosting | Vercel                                                 | Free tier, auto deploy from GitHub                        |
| Backend hosting  | Render                                                 | Free tier Node.js service                                 |
| DB hosting       | MongoDB Atlas                                          | Free M0 cluster                                           |

**Why MongoDB over Supabase for this project:**

- You already have MERN experience; adding Supabase Auth + RLS on top of a new stack adds learning overhead for the bootcamp timeline
- The aggregation pipeline (`$group`, `$lookup`, `$sum`) handles the inventory engine perfectly
- Mongoose models map directly to the PRD's data model — faster to build
- The one tradeoff: MongoDB lacks native row-level locks, solved via atomic `findOneAndUpdate` with conditional query (Section 6)

## 9. Development Phases

**Phase 1 — Foundation (Week 1–2)**

- MongoDB Atlas setup, Mongoose models: User, Nursery, ProductCatalog
- Auth routes: register, login, refresh token, logout
- Role middleware: `requireRole`, `requireApproved`
- React app: Vite setup, Tailwind, AuthContext, protected routes, Login + Register pages
- Deliverable: 3 roles can register and log in; wrong-role routes blocked on server

**Phase 2 — Inventory Engine (Week 3)**

- NurseryInventory model + CRUD routes for seller
- Aggregation pipeline: `GET /marketplace/products` returns total per product
- Seller inventory dashboard page
- Marketplace page showing aggregated stock cards
- Deliverable: seller updates stock → buyer sees updated total immediately

**Phase 3 — Orders & Splitting (Week 4)**

- `orderSplitter.js` service + atomic reserve logic
- Order + SellerOrder models and routes
- Checkout page (buyer) + Orders dashboard (seller) with accept/reject/dispatch/deliver
- StockReserve TTL collection
- Deliverable: full order flow works end-to-end

**Phase 4 — Admin Panel (Week 5)**

- Admin approval queue (pending sellers)
- Platform inventory view (all products × all nurseries)
- All orders monitor + user management
- Product catalog management
- Deliverable: admin can run the platform

**Phase 5 — Polish & Deploy (Week 6)**

- Landing page with live stats
- Notification system (in-app)
- Low-stock alerts for sellers
- Nursery profile + rating display
- Mobile responsive pass
- Seed script with realistic demo data
- Deploy: Vercel + Render + Atlas
- Deliverable: production-ready

**MVP for SMIT demo (Phase 1 + Phase 2 only):** Show login with 3 roles → seller updates stock → aggregation API returns correct total → buyer marketplace card updates. That's the hardest idea demonstrated in \~15 minutes of code.

## 10. Seed Data & Setup

**Users to seed:**

| Email                 | Role            | Status               |
| --------------------- | --------------- | -------------------- |
| admin@greenkarachi.pk | super\_admin    | active               |
| seller1@gulshan.pk    | nursery\_seller | active (approved)    |
| seller2@defence.pk    | nursery\_seller | active (approved)    |
| seller3@korangi.pk    | nursery\_seller | pending (unapproved) |
| buyer1@company.pk     | buyer           | active               |

**Product Catalog to seed (all categories):**

| Name            | Category    | Unit   |
| --------------- | ----------- | ------ |
| Coconut Plant   | plants      | pieces |
| Mango Sapling   | plants      | pieces |
| Neem Tree       | plants      | pieces |
| Bougainvillea   | plants      | pieces |
| Money Plant     | plants      | pieces |
| Aloe Vera       | plants      | pieces |
| DAP Fertilizer  | fertilizers | kg     |
| Urea            | fertilizers | kg     |
| Organic Compost | fertilizers | bag    |
| Sunflower Seeds | seeds       | kg     |
| Coriander Seeds | seeds       | kg     |
| Garden Spade    | tools       | pieces |
| Watering Can    | tools       | pieces |

**NurseryInventory seed (seller1 — Gulshan Nursery):**

- Coconut Plant: qty 5,000 · PKR 55/unit
- Mango Sapling: qty 800 · PKR 120/unit
- DAP Fertilizer: qty 500 · PKR 200/kg

**NurseryInventory seed (seller2 — DHA Nursery):**

- Coconut Plant: qty 3,420 · PKR 60/unit
- Neem Tree: qty 1,200 · PKR 85/unit
- Organic Compost: qty 300 · PKR 150/bag

**Resulting marketplace aggregate for buyer:**

- Coconut Plant → **8,420 units across 2 nurseries · PKR 55–60/unit**

**Seed script location:** `server/src/utils/seed.js`

```js
// Run with: node src/utils/seed.js
// Drops existing data and inserts fresh demo set
await mongoose.connect(process.env.MONGODB_URI);
await Promise.all([User, Nursery, ProductCatalog, NurseryInventory]
  .map(M => M.deleteMany({})));
// ... insert arrays above
console.log('Seed complete');
process.exit(0);
```

**Environment variables needed:**

```
# server/.env
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=http://localhost:5173
PORT=5000

# client/.env
VITE_API_URL=http://localhost:5000/api/v1
```
