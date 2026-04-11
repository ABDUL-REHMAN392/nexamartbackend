<div align="center">

# 🛒 NexaMart — E-Commerce Backend API

<p align="center">
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  </a>
  <a href="https://expressjs.com/">
    <img src="https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  </a>
  <a href="https://www.mongodb.com/">
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  </a>
  <a href="https://socket.io/">
    <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io"/>
  </a>
  <a href="https://jwt.io/">
    <img src="https://img.shields.io/badge/Auth-JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT"/>
  </a>
  <a href="https://cloudinary.com/">
    <img src="https://img.shields.io/badge/CDN-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary"/>
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge" alt="MIT"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/ABDUL-REHMAN392/nexamartbackend?style=flat-square&color=blue" alt="Last Commit"/>
  <img src="https://img.shields.io/github/issues/ABDUL-REHMAN392/nexamartbackend?style=flat-square&color=red" alt="Issues"/>
  <img src="https://img.shields.io/github/stars/ABDUL-REHMAN392/nexamartbackend?style=flat-square&color=yellow" alt="Stars"/>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome"/>
</p>

<br/>

 **A full-featured, production-ready RESTful API for a modern e-commerce platform.**
 Built with clean MVC architecture, real-time notifications via Socket.io,
 triple OAuth support, and a complete admin dashboard engine.

<br/>

<p align="center">
  <a href="https://nexamart-shop.netlify.app">
    <img src="https://img.shields.io/badge/🚀 Live Demo-Visit Frontend-success?style=for-the-badge" alt="Live"/>
  </a>
  &nbsp;
  <a href="https://github.com/ABDUL-REHMAN392/nexamartbackend/issues/new?labels=bug">
    <img src="https://img.shields.io/badge/🐛 Report Bug-Open Issue-red?style=for-the-badge" alt="Bug"/>
  </a>
  &nbsp;
  <a href="https://github.com/ABDUL-REHMAN392/nexamartbackend/issues/new?labels=enhancement">
    <img src="https://img.shields.io/badge/✨ Request Feature-Open Issue-blue?style=for-the-badge" alt="Feature"/>
  </a>
</p>

</div>


## 📌 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [API Reference](#-api-reference)
- [Database Models](#-database-models)
- [Real-time (Socket.io)](#-real-time-socketio)
- [Local Setup](#-local-setup)
- [Environment Variables](#-environment-variables)
- [Security](#-security)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Author](#-author)


## ✨ Overview

**NexaMart Backend** is the core API engine powering a full-stack e-commerce shopping platform. It covers the complete customer journey — from registration and browsing to ordering and reviews — plus a dedicated admin panel with live analytics.

| Module | What it does |
|:--|:--|
| **Auth** | Register, Login, Logout, Refresh Token, Google & Facebook OAuth |
| **Users** | Profile, Password, Avatar (Cloudinary), Saved Address |
| **Cart** | Add, Update, Remove, Clear, Guest Cart Merge |
| **Orders** | Place, Cancel, Track, Admin Status Updates |
| **Favorites** | Add, Remove, Toggle, Check, Clear (limit: 100) |
| **Reviews** | Create, Edit, Delete, Helpful Votes, Verified Purchase Badge |
| **Notifications** | Real-time via Socket.io, Mark Read, Delete |
| **Admin** | Dashboard Stats, User Management, Order Control, Review Moderation |


## 🏗️ System Architecture

```
nexamartbackend/
│
├── src/
│   ├── config/
│   │   ├── cloudinary.js       ← Avatar upload/delete
│   │   ├── db.js               ← MongoDB Atlas connection
│   │   ├── passport.js         ← Google & Facebook OAuth
│   │   └── socket.js           ← Socket.io initialization
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── favoriteController.js
│   │   ├── notificationController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   └── userController.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js   ← protect, adminOnly, customerOnly
│   │   └── Uploadmiddleware.js ← Multer avatar handler
│   │
│   ├── models/
│   │   ├── Cart.js
│   │   ├── Favorite.js
│   │   ├── Notification.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── favoriteRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── userRoutes.js
│   │
│   ├── utils/
│   │   ├── apiResponse.js      ← successResponse / errorResponse
│   │   └── tokenUtils.js       ← JWT generate & cookie helpers
│   │
│   └── server.js               ← App entry point + HTTP + Socket
│
├── .env
├── .gitignore
└── package.json
```

### Request Lifecycle

```
Client Request
     │
     ▼
CORS + Cookie Parser
     │
     ▼
protect() Middleware  ← JWT verify (private routes)
     │
     ▼
Role Check  ← adminOnly / customerOnly
     │
     ▼
Controller  ← Business logic
     │
     ├──► MongoDB (Mongoose models)
     ├──► Cloudinary (avatar ops)
     └──► Socket.io (real-time emit)
     │
     ▼
successResponse / errorResponse
```


## 🚀 Key Features

### 🔐 Authentication & Identity

| Feature | Detail |
|:--|:--|
| Local Auth | Email + Password with strong validation |
| Google OAuth | Passport.js Google Strategy |
| Facebook OAuth | Passport.js Facebook Strategy |
| Token Strategy | Access Token (short-lived) + Refresh Token (rotation) |
| Cookie Security | `httpOnly`, `Secure`, `SameSite=Strict` |
| Password Hashing | bcrypt with 12 salt rounds |
| Brute Force Lock | 5 failed attempts → 30 min lockout |
| Social Guard | Prevents password login on OAuth accounts & vice versa |

### 🛒 Cart Engine

| Feature | Detail |
|:--|:--|
| Persistent Cart | Tied to user account via MongoDB |
| Guest Merge | `POST /cart/merge` — guest cart syncs on login |
| Limits | Max 20 unique items, max qty 10 per item |
| Validation | productId, price, image, title all validated |

### 📦 Orders

| Feature | Detail |
|:--|:--|
| Place Order | Customer checkout with items snapshot |
| Order Tracking | Status: pending → processing → shipped → delivered |
| Cancellation | Customer can cancel before shipment |
| Admin Control | Admin updates status + triggers notification |
| Revenue Stats | Monthly aggregation for dashboard charts |

### ⭐ Reviews

| Feature | Detail |
|:--|:--|
| Verified Purchase | Badge auto-assigned if user delivered+paid order |
| Helpful Votes | Users vote — can't vote on own review |
| Rating Summary | Average + breakdown (1★–5★) per product |
| Sort Options | newest, oldest, highest, lowest, helpful |
| Admin Moderation | Hide/unhide or hard delete any review |

### 🔔 Real-time Notifications

| Feature | Detail |
|:--|:--|
| Socket.io | User joins private room `user:{id}` on connect |
| Live Push | Order updates, review actions → instant emit |
| Unread Count | Returned with every GET |
| Persistence | Stored in MongoDB, max 50 shown |

### 📊 Admin Dashboard

| Feature | Detail |
|:--|:--|
| Overview Stats | Total users, orders, revenue, reviews |
| Growth % | Month-over-month comparison (users, orders, revenue) |
| Orders by Status | Breakdown across all 5 statuses |
| Monthly Revenue | Last 6 months chart data |
| Top Products | Top 5 by units sold |
| Recent Orders | Last 5 with user info populated |
| User Management | Search, paginate, activate/deactivate |


## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:--|:--|:--|
| Runtime | Node.js v18+ | Server environment |
| Framework | Express.js 4.x | HTTP & routing |
| Database | MongoDB Atlas | Document persistence |
| ODM | Mongoose | Schema & validation |
| Real-time | Socket.io | Live notifications |
| Auth | Passport.js | OAuth strategies |
| Tokens | jsonwebtoken | JWT access + refresh |
| Hashing | bcryptjs | Password security |
| Media | Cloudinary | Avatar storage |
| Uploads | Multer | Multipart form-data |
| Env | dotenv | Config management |


## 📡 API Reference

**Base URL:** `https://your-backend-url.com/api`

> 🔒 = Requires valid JWT cookie or `Authorization: Bearer <token>`
> 👑 = Admin only
> 👤 = Customer only (admin blocked)


### 🔐 Auth — `/api/auth`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `POST` | `/register` | Create new account | Public |
| `POST` | `/login` | Login + set JWT cookies | Public |
| `POST` | `/logout` | Clear session | 🔒 |
| `POST` | `/refresh-token` | Rotate access token | Public |
| `GET` | `/me` | Get current user | 🔒 |
| `GET` | `/google` | Start Google OAuth | Public |
| `GET` | `/google/callback` | Google OAuth callback | Public |
| `GET` | `/facebook` | Start Facebook OAuth | Public |
| `GET` | `/facebook/callback` | Facebook OAuth callback | Public |

<details>
<summary><b>📋 Auth Examples</b></summary>

**Register**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Abdulrehman",
  "email": "user@example.com",
  "password": "SecurePass1",
  "phone": "+923001234567"
}
```
```json
// 201 Created
{
  "success": true,
  "message": "Account created successfully! Welcome 🎉",
  "data": {
    "accessToken": "eyJ...",
    "user": { "_id": "...", "name": "Abdulrehman", "email": "user@example.com" }
  }
}
```

**Login**
```bash
POST /api/auth/login

{ "email": "user@example.com", "password": "SecurePass1" }
```
```json
// 200 OK
{ "success": true, "message": "Login successful!", "data": { "accessToken": "eyJ...", "user": { "..." } } }
```

**Too Many Failed Attempts**
```json
// 423 Locked
{ "success": false, "message": "Too many failed attempts, account locked for 30 minutes" }
```

</details>


### 👤 Users — `/api/users`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `GET` | `/profile` | Get profile | 🔒 |
| `PUT` | `/profile` | Update name/phone | 🔒 |
| `PUT` | `/change-password` | Change password | 🔒 |
| `POST` | `/avatar` | Upload avatar | 🔒 |
| `DELETE` | `/avatar` | Remove avatar | 🔒 |
| `GET` | `/address` | Get saved address | 🔒 |
| `PUT` | `/address` | Save/update address | 🔒 |
| `DELETE` | `/profile` | Delete account + all data | 🔒 |


### 🛒 Cart — `/api/cart`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `GET` | `/` | Get cart | 👤 |
| `POST` | `/` | Add item | 👤 |
| `POST` | `/merge` | Merge guest cart on login | 👤 |
| `PUT` | `/:productId` | Update quantity | 👤 |
| `DELETE` | `/:productId` | Remove item | 👤 |
| `DELETE` | `/` | Clear cart | 👤 |

<details>
<summary><b>📋 Cart Examples</b></summary>

**Add to Cart**
```bash
POST /api/cart
Authorization: Bearer <token>

{
  "productId": 101,
  "title": "Running Shoes",
  "price": 4999,
  "image": "https://example.com/shoe.jpg",
  "brand": "Nike",
  "category": "Footwear",
  "rating": 4.5,
  "weight": 0.8,
  "quantity": 2
}
```
```json
// 200 OK
{ "success": true, "message": "Item added to cart", "data": { "cart": { "..." } } }
```

**Merge Guest Cart**
```bash
POST /api/cart/merge

{ "items": [ { "productId": 101, "title": "...", "price": 4999, "image": "...", "quantity": 1 } ] }
```

</details>


### 📦 Orders — `/api/orders`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `POST` | `/` | Place order | 👤 |
| `GET` | `/` | My orders | 👤 |
| `GET` | `/:orderId` | Order details | 👤 |
| `PUT` | `/:orderId/cancel` | Cancel order | 👤 |
| `GET` | `/admin/all` | All orders | 👑 |
| `PUT` | `/admin/:orderId/status` | Update order status | 👑 |


### ❤️ Favorites — `/api/favorites`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `GET` | `/` | Get all favorites | 👤 |
| `POST` | `/` | Add to favorites | 👤 |
| `POST` | `/toggle` | Toggle (add/remove) | 👤 |
| `GET` | `/:productId/check` | Check if favorited | 👤 |
| `DELETE` | `/:productId` | Remove one | 👤 |
| `DELETE` | `/` | Clear all | 👤 |

<details>
<summary><b>📋 Favorites Examples</b></summary>

**Toggle Favorite** *(recommended for heart icon)*
```bash
POST /api/favorites/toggle

{ "productId": 101, "title": "Running Shoes", "price": 4999, "image": "..." }
```
```json
// Added: { "success": true, "data": { "isFavorited": true, "favorite": { "..." } } }
// Removed: { "success": true, "data": { "isFavorited": false } }
```

</details>


### ⭐ Reviews — `/api/reviews`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `GET` | `/product/:productId` | Product reviews + summary | Public |
| `POST` | `/` | Create review | 🔒 |
| `GET` | `/my` | My reviews | 🔒 |
| `GET` | `/check/:productId` | Check if I reviewed | 🔒 |
| `PUT` | `/:id` | Update review | 🔒 |
| `DELETE` | `/:id` | Delete review | 🔒 |
| `POST` | `/:id/helpful` | Toggle helpful vote | 🔒 |
| `GET` | `/admin/all` | All reviews | 👑 |
| `PUT` | `/admin/:id/hide` | Hide/unhide review | 👑 |
| `DELETE` | `/admin/:id` | Hard delete review | 👑 |

<details>
<summary><b>📋 Reviews Examples</b></summary>

**Get Product Reviews**
```bash
GET /api/reviews/product/101?page=1&limit=10&sort=helpful
```
```json
{
  "success": true,
  "data": {
    "reviews": [ "..." ],
    "summary": {
      "averageRating": 4.3,
      "totalReviews": 28,
      "breakdown": { "5": 15, "4": 7, "3": 3, "2": 2, "1": 1 }
    },
    "pagination": { "total": 28, "page": 1, "pages": 3 }
  }
}
```

**Sort options:** `newest` `oldest` `highest` `lowest` `helpful`

</details>


### 🔔 Notifications — `/api/notifications`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `GET` | `/` | Get all + unread count | 🔒 |
| `PATCH` | `/read-all` | Mark all as read | 🔒 |
| `PATCH` | `/:id/read` | Mark one as read | 🔒 |
| `DELETE` | `/:id` | Delete one | 🔒 |
| `DELETE` | `/` | Delete all | 🔒 |


### 👑 Admin — `/api/admin`

| Method | Endpoint | Description | Access |
|:--:|:--|:--|:--:|
| `GET` | `/dashboard` | Full dashboard stats | 👑 |
| `GET` | `/users` | All users (paginated) | 👑 |
| `PUT` | `/users/:id/toggle-active` | Ban/unban user | 👑 |

<details>
<summary><b>📋 Dashboard Response Shape</b></summary>

```json
{
  "overview": { "totalUsers": 1240, "totalOrders": 856, "totalRevenue": 4289500, "totalReviews": 312 },
  "thisMonth": { "newUsers": 84, "orders": 120, "revenue": 590000, "reviews": 28 },
  "growth": { "users": 12.5, "orders": -3.1, "revenue": 8.7 },
  "ordersByStatus": { "pending": 12, "processing": 8, "shipped": 25, "delivered": 790, "cancelled": 21 },
  "monthlyRevenue": [ { "_id": { "year": 2025, "month": 11 }, "revenue": 480000, "orders": 98 } ],
  "topProducts": [ { "title": "Running Shoes", "totalSold": 145, "totalRevenue": 724550 } ],
  "recentOrders": [ "..." ]
}
```

</details>


## 🗄️ Database Models

### User
```js
{
  name, email, password,          // Core fields
  phone,                          // Optional
  googleId, facebookId,           // OAuth IDs
  authProvider,                   // 'local' | 'google' | 'facebook'
  avatar,                         // Cloudinary URL
  savedAddress,                   // { formatted, city, country, lat, lng, ... }
  role,                           // 'customer' | 'admin'
  isActive, isEmailVerified,
  loginAttempts, lockUntil,       // Brute force protection
  refreshToken, lastLogin,
  timestamps: true
}
```

### Order
```js
{
  user,                           // ref: User
  items: [{                       // Snapshot at time of order
    productId, title, image,
    price, quantity, subtotal
  }],
  totalAmount,
  orderStatus,                    // pending|processing|shipped|delivered|cancelled
  paymentStatus,                  // paid|unpaid|refunded
  shippingAddress,
  timestamps: true
}
```

### Review
```js
{
  user,                           // ref: User
  productId, productTitle, productImage,
  rating,                         // 1–5
  title, body,
  verifiedPurchase,               // auto-checked against orders
  helpfulVotes: [userId],
  isHidden,
  timestamps: true
  // unique index: { user, productId }
}
```

### Cart
```js
{
  user,                           // ref: User (1 cart per user)
  items: [{
    productId, title, price,
    image, brand, category,
    rating, weight, quantity
  }]
}
```

### Notification
```js
{
  user,                           // ref: User
  type,                           // order_update | review_action | etc.
  title, message,
  orderId, reviewId,              // optional refs
  read,                           // default: false
  timestamps: true
}
```


## ⚡ Real-time (Socket.io)

NexaMart uses Socket.io for live push notifications.

**Connection flow:**
```
Client connects → joins room "user:{userId}"
     │
     ▼
Order status changes / review action
     │
     ▼
Server emits "new_notification" to "user:{userId}"
     │
     ▼
Client receives → updates UI instantly
```

**Client-side example:**
```js
const socket = io("https://your-backend-url.com");

socket.emit("join", userId);  // join personal room

socket.on("new_notification", (notification) => {
  console.log("New notification:", notification);
  // update badge count, show toast, etc.
});
```


## ⚙️ Local Setup

### Prerequisites

| Requirement | Link |
|:--|:--|
| Node.js v18+ | [nodejs.org](https://nodejs.org/) |
| MongoDB Atlas | [mongodb.com](https://www.mongodb.com/) |
| Cloudinary Account | [cloudinary.com](https://cloudinary.com/) |
| Google OAuth Credentials | [console.cloud.google.com](https://console.cloud.google.com/) |
| Facebook App Credentials | [developers.facebook.com](https://developers.facebook.com/) |

### Installation

```bash
# 1. Clone
git clone https://github.com/ABDUL-REHMAN392/nexamartbackend.git
cd nexamartbackend

# 2. Install
npm install

# 3. Configure .env (see below)

# 4. Run
npm run dev     # development (nodemon)
npm start       # production
```


## 🔐 Environment Variables

```env
# ─── Server ───────────────────────────────────────
PORT=5000
NODE_ENV=development
FRONTEND_URL=https://nexamart-shop.netlify.app

# ─── Database ─────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nexamart

# ─── JWT (min 32 chars each) ──────────────────────
JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# ─── Google OAuth ─────────────────────────────────
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ─── Facebook OAuth ───────────────────────────────
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# ─── Cloudinary ───────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```


## 🛡️ Security

| Threat | Mitigation |
|:--|:--|
| Password Exposure | bcrypt 12 rounds + `select: false` |
| XSS | JWT in `httpOnly` cookies |
| CSRF | `SameSite: Strict` in production |
| Brute Force | 5 attempts → 30 min account lock |
| Unauthorized Access | `protect`, `adminOnly`, `customerOnly` middleware |
| NoSQL Injection | Mongoose strict schema validation |
| Malicious Uploads | Multer MIME whitelist + size cap |
| Cross-Origin | CORS restricted to `FRONTEND_URL` only |
| OAuth Mixing | Provider guard — can't use wrong login method |
| Admin Actions | `adminOnly` middleware on all admin routes |


## 🌐 Deployment

### Render (Recommended)

| Field | Value |
|:--|:--|
| Build Command | `npm install` |
| Start Command | `npm start` |
| Node Version | `18` |

> Add all `.env` variables under the **Environment** tab.
> Update all OAuth callback URLs to your live domain before deploying.

### Vercel (Serverless)

```json
{
  "version": 2,
  "builds": [{ "src": "src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.js" }]
}
```

> ⚠️ Socket.io requires a persistent server — Render or Railway is preferred over Vercel for real-time features.


## 🗺️ Roadmap

```
✅ Phase 1 — Core (Done)
   ├─ Auth (Local + Google + Facebook)
   ├─ Cart with guest merge
   ├─ Orders + status tracking
   ├─ Favorites engine
   ├─ Reviews + verified purchase
   ├─ Real-time notifications (Socket.io)
   └─ Admin dashboard

🔄 Phase 2 — In Progress
   ├─ Payment gateway (Stripe)
   └─ Email notifications (order confirm, etc.)

📅 Phase 3 — Planned
   ├─ Product search & filters
   ├─ Coupon / discount system
   ├─ Wishlist sharing
   └─ Swagger / OpenAPI docs

🔮 Phase 4 — Future
   ├─ Recommendation engine
   ├─ Seller/vendor panel
   └─ Unit & integration tests
```


## 🤝 Contributing

```bash
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
# Open a Pull Request
```

**Commit convention:**
```
feat:     New feature
fix:      Bug fix
docs:     Documentation
refactor: Code restructuring
test:     Tests
chore:    Config/build changes
```


## 👨‍💻 Author

<div align="center">

### Abdulrehman
*Full Stack Developer*

[![GitHub](https://img.shields.io/badge/GitHub-ABDUL--REHMAN392-181717?style=for-the-badge&logo=github)](https://github.com/ABDUL-REHMAN392)
[![Gmail](https://img.shields.io/badge/Gmail-abdulrehmanrafique01@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:abdulrehmanrafique01@gmail.com)


*Agar ye project helpful laga, please ⭐ zaroor do!*

**© 2024 Abdulrehman**

</div>
