# SOLEVAULT — Master Technical Specification & Architecture Blueprint

> **Notice for AI Models & Developers**:  
> Read this document to understand the full system architecture, frontend design patterns, backend API contracts, payment settlement flows, and coding standards of **SOLEVAULT** without needing to parse the entire codebase.

---

## 1. Executive Summary & Brand Identity

**SOLEVAULT** is an independent, high-end footwear and sneaker marketplace offering 100% verified, brand-new deadstock sneakers, running shoes, and street classics at liquidation pricing (**50% to 75% off MRP**).

### Core Design Philosophy
- **Visual Identity**: High-fashion luxury streetwear editorial aesthetic.
- **Palette**:
  - `Void Ink / Midnight`: `#0b0b0b` / `#111111` / `#161616` (Deep black background and structural cards)
  - `Bone Paper / Off-White`: `#f6f5f2` / `#e4e2de` / `#e6e3dd` (Warm textured editorial canvas)
  - `Infrared / Hyper Orange`: `#ff4d23` (Electric accent for buttons, badges, discount pills, active states)
  - `Pure White`: `#ffffff` (Card surfaces, input boxes, modal overlays)
  - `Border Line`: `rgba(0, 0, 0, 0.08)` / `#e2dfd9` / `rgba(255, 255, 255, 0.1)`
- **Typography**:
  - Display / Headlines: High-impact condensed grotesk typography (`font-weight: 800–900`, tight letter-spacing `-0.05em` to `-0.065em`, uppercase).
  - Eyebrows: Micro-caps (`font-size: 10px`, `letter-spacing: 0.16em`, `font-weight: 700`, uppercase).
  - Body: Modern legible sans-serif (`font-size: 13px–15px`, line-height `1.5–1.7`).
- **Motion & Interactions**:
  - Kinetic scroll scrubbers (Interactive canvas image frame sequence on Home hero).
  - 3D wireframes, floating geometric elements, magnetic CTA buttons, and dual-tone scroll progress indicators.
  - Bespoke, layout-accurate skeleton loading screens for all pages with zero layout shift.

---

## 2. Technology Stack & Tooling

| Layer | Technologies | Key Packages & Versions |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19, TypeScript | `react@^19.2.0`, `react-dom@^19.2.0`, `typescript@~5.9.3` |
| **Routing** | React Router DOM v7 | `react-router-dom@^7.13.1` (SPA with route-level lazy loading) |
| **Build Tool & Bundler** | Vite 7, Tailwind CSS v4 | `vite@^7.3.1`, `@tailwindcss/vite@^4.2.1`, `tailwindcss@^4.2.1` |
| **Animations & Motion** | GSAP, Lucide Icons, Custom CSS Engine | `gsap@^3.15.0`, `lucide-react@^0.577.0`, CSS `@keyframes` |
| **Authentication** | Supabase Auth, EmailJS | `@supabase/supabase-js@^2.99.1`, `@emailjs/browser@^4.4.1` |
| **Payment Gateway** | Cashfree Payments SDK (UPI Intent & Session) | Server-authoritative checkout + signed webhooks |
| **Rate Limiting & Caching** | Upstash Redis, Upstash Ratelimit | `@upstash/redis@^1.38.2`, `@upstash/ratelimit@^2.0.8` |
| **Build & Security CI** | Sitemap Generator & Secret Scanner | `scripts/generate-sitemap.mjs`, `scripts/audit-client-bundle.mjs` |

---

## 3. Project Directory Map

```text
shoe-payment/
├── api/                          # Serverless Backend API Handlers
│   ├── _lib/                     # Shared Server Utilities & Engines
│   │   ├── audit.js              # Security & transaction audit logger
│   │   ├── auth.js               # Supabase JWT & role-gated token validator
│   │   ├── cashfree.js           # Cashfree SDK REST client (Order, Status, Refunds, HMAC)
│   │   ├── db-client.js          # Direct PostgreSQL pool / Supabase client
│   │   ├── db.js                 # Transactional database query wrapper
│   │   ├── http.js               # Standardized JSON response & error helpers
│   │   ├── inventory.js          # Optimistic version-locked inventory engine
│   │   ├── rateLimit.js          # Upstash Redis rate limiter middleware
│   │   ├── settlement.js         # ACID payment settlement & order capture
│   │   ├── state.js              # Payment, Refund & Fulfillment state machines
│   │   └── validation.js         # Input validation & schema sanitization
│   ├── addresses.js              # User address management (CRUD)
│   ├── cashfree-webhook.js       # Signed HMAC-SHA256 Cashfree webhook endpoint
│   ├── orders.js                 # Server-side checkout calculation & order retrieval
│   ├── payments.js               # Payment reconciliation & admin refund triggers
│   ├── products.js               # Catalog search, filtering, and single-item lookup
│   ├── storefront.js             # Aggregated home page data (brands, categories, deals)
│   ├── users.js                  # User profile management, email check, and password reset
│   └── wishlist.js               # User wishlist operations
│
├── public/                       # Static Assets
│   ├── images/                   # Product & brand fallbacks, hero visuals, webp sequences
│   ├── robots.txt                # Search engine crawler directives
│   └── sitemap.xml               # Dynamically generated 35+ URL sitemap
│
├── scripts/                      # Build & CI Automation Scripts
│   ├── generate-sitemap.mjs      # Automatically regenerates sitemap.xml on build
│   └── audit-client-bundle.mjs   # Security scanner ensuring zero secret leaks in dist/
│
├── src/                          # Frontend Application Source Code
│   ├── assets/                   # SVG icons & static graphics
│   ├── components/               # Core UI Components
│   │   ├── motion/               # Animation Primitives
│   │   │   ├── HomeScrollScenes.tsx # GSAP / scroll-triggered scene sequences
│   │   │   ├── Marquee.tsx          # Dual-theme infinite scrolling ticker
│   │   │   ├── Reveal.tsx           # Text & card reveal wrappers
│   │   │   └── TiltCard.tsx         # 3D interactive physics tilt card
│   │   ├── ui/                   # Reusable UI Atoms & Molecules
│   │   │   ├── AnimatedSection.tsx  # Parallax & IntersectionObserver reveal blocks
│   │   │   ├── MagneticButton.tsx   # Physics cursor attraction button
│   │   │   ├── ScrollProgress.tsx   # Top dual-tone scroll progress bar
│   │   │   └── Skeleton.tsx         # Bespoke 1:1 luxury skeleton loading suite
│   │   ├── AnimatedIcons.tsx     # Micro-animated SVG icon set
│   │   ├── CookieConsent.tsx     # Cookie policy & consent banner
│   │   ├── ErrorBoundary.tsx     # Global React error boundary fallback
│   │   ├── HeroScrollExperience.tsx # Interactive canvas frame sequence scrubber
│   │   ├── Layout.tsx            # Global Shell (Header, Navigation, Footer)
│   │   ├── ProductCard.tsx       # Standard product card with media, badge, prices
│   │   ├── ProtectedRoute.tsx    # Auth and Admin role guards
│   │   ├── ReceiptPrinterAnimation.tsx # Skeuomorphic receipt animation for orders
│   │   └── StatePanel.tsx        # EmptyState, ErrorState, LoadingState
│   ├── contexts/                 # Global React State Providers
│   │   ├── AuthContext.tsx       # Supabase session, profile, role detection
│   │   └── CartContext.tsx       # LocalStorage cart, totals, delivery calculation, toasts
│   ├── hooks/                    # Custom React Hooks
│   │   ├── usePrefersReducedMotion.ts # Accessibility hook for reduced motion
│   │   ├── useSEOMeta.ts         # Dynamic document title & OpenGraph meta tag updater
│   │   └── useScrollAnimations.ts# Window scroll listener & velocity calculator
│   ├── lib/                      # Frontend Helpers & Integrations
│   │   ├── cashfreeSdk.ts        # Client Cashfree SDK loader
│   │   ├── format.ts             # Currency (`money()`), dates (`dateLabel()`), auth headers
│   │   ├── googleAuth.ts         # Google OAuth sign-in helper
│   │   ├── images.ts             # Image fallbacks & brand asset resolver
│   │   ├── seo.ts                # SEO metadata helper
│   │   └── supabase.ts           # Supabase client instantiation
│   ├── pages/                    # 18 Application Route Pages
│   │   ├── AboutPage.tsx         # Brand story & authenticity pledge
│   │   ├── AccountPage.tsx       # Member Vault (Profile, Password Reset, Orders, Addresses, Wishlist)
│   │   ├── AdminPage.tsx         # Operations Console (Products, Orders, Payments, Users)
│   │   ├── AeroGalleryPage.tsx   # 3D Archival Exhibition Gallery
│   │   ├── AuthPage.tsx          # Login / Signup / Forgot Password / EmailJS 6-Digit OTP Verification
│   │   ├── CartPage.tsx          # Shopping Bag & Order Summary
│   │   ├── CheckoutPage.tsx      # Cashfree UPI Intent & Address Checkout Form
│   │   ├── FAQsPage.tsx          # Accordion FAQ guide
│   │   ├── HomePage.tsx          # Cinematic Hero, Manifesto, Categories, Steals
│   │   ├── NotFoundPage.tsx      # 404 Error Screen
│   │   ├── OrderConfirmationPage.tsx # Live order verification & receipt tracker
│   │   ├── PrivacyPolicyPage.tsx # Legal privacy documentation
│   │   ├── ProductPage.tsx       # 2-Column PDP (Gallery zoom, size selector, Buy panel)
│   │   ├── RefundPolicyPage.tsx  # Refund & return terms
│   │   ├── ShippingPolicyPage.tsx# Delivery timelines & courier policies
│   │   ├── ShopPage.tsx          # Catalog filtering (Brand, category, size, price)
│   │   ├── TermsOfServicePage.tsx# Terms of service
│   │   └── WishlistPage.tsx      # Saved pairs grid
│   ├── types.ts                  # Central TypeScript Data Contracts
│   ├── App.tsx                   # Route definitions with bespoke Suspense boundaries
│   ├── index.css                 # Master CSS Design System & Animation Engine
│   └── main.tsx                  # Vite React entry point
├── package.json
├── PROJECT_SPEC.md               # THIS FILE — Single Source of Truth
├── README.md
└── tsconfig.json
```

---

## 4. Design System & The Skeleton Architecture

### Skeleton Loading Standard (`src/components/ui/Skeleton.tsx`)
A core tenet of SOLEVAULT is that **generic spinners must never be used on full-page loads**. Every page must present an exact **1:1 layout-accurate skeleton screen** matching its final rendered geometry.

```css
/* Master Shimmer Animation Engine (src/index.css) */
@keyframes skeletonShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #e6e3dd 25%, #f2f0ec 50%, #e6e3dd 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.6s ease-in-out infinite;
}
.skeleton-dark {
  background: linear-gradient(90deg, #161616 25%, #242424 50%, #161616 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.6s ease-in-out infinite;
}
.skeleton-accent {
  background: linear-gradient(90deg, rgba(255, 77, 35, 0.15) 25%, rgba(255, 77, 35, 0.35) 50%, rgba(255, 77, 35, 0.15) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.6s ease-in-out infinite;
}
```

### Complete Skeletons Inventory
1. **`HomePageSkeleton`** & **`StorefrontContentSkeleton`**:
   - Hero canvas area → Marquee bar → Manifesto block → 4-column Stats band → 4 dark Brand cards → 6 Category rail cards → 52/48 Deal banner → 5 Trust items → 4-product Steals grid.
2. **`ShopPageSkeleton`**:
   - Shop Hero → Catalog toolbar → 2-Column layout (Left sidebar with Search, Brand, Category, Gender, UK Size pills 4–12, Price, Discount + Right 8-product card grid).
3. **`ProductPageSkeleton`**:
   - Back breadcrumb → 2-Column PDP layout (Left vertical 4-thumbnail strip + large square zoom stage; Right brand chip, title, price row, authenticity badge, 5 UK size pills, Add to Cart & Buy buttons, delivery perks) → Related products grid.
4. **`AeroGallerySkeleton`**:
   - Aero Hero with telemetry bar (`CURATED SILHOUETTES`, `AUTHENTIC DEADSTOCK`) → 5 filter chip pills → 6 high-tech exhibition cards with SKU telemetry badges, shoe canvases, and metadata lines.
5. **`WishlistPageSkeleton`**:
   - Header (`SAVED FOR LATER`, `YOUR WISHLIST.`) → 4-card saved items grid.
6. **`AccountPageSkeleton`**:
   - Member header (`MEMBER VAULT`, `HELLO, MEMBER`) → 2-Column layout (5 sidebar tab buttons with icons + profile/orders/address cards).
7. **`AdminPageSkeleton`**:
   - Console header → 5 admin tabs (`Products`, `Orders`, `Payments`, `Taxonomy`, `Users`) → Table action bar → 6×6 data table skeleton.
8. **`OrderConfirmationSkeleton`**:
   - Centered receipt card with pulsing status mark, order number pill, 4-step status timeline (`Placed` → `Confirmed` → `Shipped` → `Delivered`), item list, and action buttons.
9. **`AuthPageSkeleton`**:
   - Split layout (`1.1fr` dark visual panel on left + `0.9fr` form wrapper on right with inputs, button, `or` divider, Google button, switch link) + top animated `.auth-loading-bar`.
10. **`CartPageSkeleton`**:
    - Header (`YOUR SELECTION`, `THE CART.`) → 2-Column layout (Left: 120px square thumbnail items list with size selector and quantity controls; Right: Order summary with totals, discount, and Checkout CTA).
11. **`CheckoutPageSkeleton`**:
    - 2-Column layout (Left: Shipping address fieldset and payment method; Right: Order review and Pay CTA).

---

## 5. Application Routing & Security Boundaries (`src/App.tsx`)

All routes use React `lazy()` with dedicated per-route `<Suspense fallback={<BespokeSkeleton />}>` boundaries:

```tsx
<Routes>
  <Route element={<Layout />}>
    <Route index element={<Suspense fallback={<HomePageSkeleton />}><HomePage /></Suspense>} />
    <Route path="shop" element={<Suspense fallback={<ShopPageSkeleton />}><ShopPage /></Suspense>} />
    <Route path="product/:slug" element={<Suspense fallback={<ProductPageSkeleton />}><ProductPage /></Suspense>} />
    <Route path="cart" element={<Suspense fallback={<CartPageSkeleton />}><CartPage /></Suspense>} />
    <Route path="login" element={<Suspense fallback={<AuthPageSkeleton />}><AuthPage /></Suspense>} />
    <Route path="wishlist" element={<ProtectedRoute><Suspense fallback={<WishlistPageSkeleton />}><WishlistPage /></Suspense></ProtectedRoute>} />
    <Route path="checkout" element={<ProtectedRoute><Suspense fallback={<CheckoutPageSkeleton />}><CheckoutPage /></Suspense></ProtectedRoute>} />
    <Route path="order-confirmation/:id" element={<Suspense fallback={<OrderConfirmationSkeleton />}><OrderConfirmationPage /></Suspense>} />
    <Route path="account" element={<ProtectedRoute><Suspense fallback={<AccountPageSkeleton />}><AccountPage /></Suspense></ProtectedRoute>} />
    <Route path="admin" element={<AdminRoute><Suspense fallback={<AdminPageSkeleton />}><AdminPage /></Suspense></AdminRoute>} />
    <Route path="gallery" element={<Suspense fallback={<AeroGallerySkeleton count={6} />}><AeroGalleryPage /></Suspense>} />
    <Route path="aero-gallery" element={<Suspense fallback={<AeroGallerySkeleton count={6} />}><AeroGalleryPage /></Suspense>} />
    <Route path="about" element={<Suspense fallback={<div className="page-shell" />}><AboutPage /></Suspense>} />
    <Route path="faqs" element={<Suspense fallback={<div className="page-shell" />}><FAQsPage /></Suspense>} />
    <Route path="privacy-policy" element={<Suspense fallback={<div className="page-shell" />}><PrivacyPolicyPage /></Suspense>} />
    <Route path="terms-of-service" element={<Suspense fallback={<div className="page-shell" />}><TermsOfServicePage /></Suspense>} />
    <Route path="refund-policy" element={<Suspense fallback={<div className="page-shell" />}><RefundPolicyPage /></Suspense>} />
    <Route path="shipping-policy" element={<Suspense fallback={<div className="page-shell" />}><ShippingPolicyPage /></Suspense>} />
    <Route path="*" element={<Suspense fallback={<div className="page-shell" />}><NotFoundPage /></Suspense>} />
  </Route>
</Routes>
```

---

## 6. Global State & Authentication Flows

### 1. `AuthContext` (`src/contexts/AuthContext.tsx`)
- **State**: `user` (Supabase User), `profile` (Solevault Profile with `role: 'customer' | 'admin'`), `loading` (boolean).
- **Methods**:
  - `refreshProfile()`: Fetches `/api/users?profile=true` using Bearer JWT.
  - Supabase Auth Event Listener: Auto-refreshes on `SIGNED_IN`, `SIGNED_OUT`, `USER_UPDATED`.
- **Google OAuth**: Integrated via `src/lib/googleAuth.ts` invoking `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- **EmailJS 6-Digit OTP Flows (`src/pages/AuthPage.tsx`)**:
  - **Signup Verification**: Generates a 6-digit numeric OTP, delivers it via EmailJS template (`template_k4i8h2k`), verifies within a 10-minute expiry window, and creates the account via Supabase.
  - **Forgot & Reset Password Flow**:
    1. User submits registered email.
    2. Endpoint `/api/users?action=check_email` verifies user existence.
    3. 6-digit cryptographic OTP is sent via EmailJS to the user's email.
    4. User enters 6-digit code on the verification screen with active countdown timer & resend controls.
    5. User sets a new secure password (min 6 characters).
    6. Endpoint `/api/users?action=reset_password` updates the password in Supabase Auth and logs the user in immediately.
  - **In-App Password Management (`src/pages/AccountPage.tsx`)**:
    - Authenticated members can update their password directly in the Security tab using `supabase.auth.updateUser({ password: newPassword })`.

### 2. `CartContext` (`src/contexts/CartContext.tsx`)
- **State**: `items` (array of `{ product: Product, size: string, quantity: number }`), persisted to `localStorage` under `solevault-cart-v1`.
- **Calculated Totals**:
  - `mrpTotal`: Sum of `(product.mrp * quantity)`.
  - `subtotal`: Sum of `(product.sale_price * quantity)`.
  - `discount`: `mrpTotal - subtotal`.
  - `shipping`: `0` (Free) if subtotal >= ₹3,000; otherwise `₹149`.
  - `total`: `subtotal + shipping`.
  - `count`: Total shoe units.
- **Methods**: `addItem(product, size, qty)`, `updateItem(productId, oldSize, updates)`, `removeItem(productId, size)`, `clearCart()`, `dismissToast()`.

---

## 7. Backend Architecture & Serverless API Endpoints

All APIs reside in `/api` and are served as serverless Node.js endpoints.

### Endpoints Inventory
| Endpoint | Method | Purpose | Security & Logic |
| :--- | :--- | :--- | :--- |
| `/api/storefront` | `GET` | Aggregated Home data | Returns `{ brands, categories, featured, deals }` with 60s cache. |
| `/api/products` | `GET` | Catalog query | Supports query params: `brand`, `category`, `gender`, `size`, `maxPrice`, `discount`, `search`, `sort`, `slug`. |
| `/api/products` | `POST/PUT/DELETE` | Admin Product CRUD | Admin role required. Manages inventory records & stock maps. |
| `/api/orders` | `POST` | Checkout initialization | Server recalculates totals from DB, validates size/stock, locks inventory, inserts `PAYMENT_PENDING` order, creates Cashfree order, returns `payment_session_id`. |
| `/api/orders` | `GET` | Order lookup | IDOR protected: Customers only see their own orders; Admin sees all. |
| `/api/orders` | `PUT` | Order status update | Admin role required. Updates fulfillment status (`Confirmed`, `Shipped`, etc.). |
| `/api/payments` | `POST` | Reconcile / Refund | Reconciles Cashfree payment status against internal DB, captures inventory on `PAID`. |
| `/api/cashfree-webhook` | `POST` | Cashfree Webhook | Verifies HMAC-SHA256 signature using `x-webhook-timestamp` and raw body. Idempotent settlement. |
| `/api/addresses` | `GET/POST/DELETE` | User address book | Bound to authenticated `user.id`. |
| `/api/wishlist` | `GET/POST/DELETE` | Saved shoes list | Bound to authenticated `user.id`. |
| `/api/users` | `GET/POST/PUT` | Profiles, Email check & Password Reset | Public `POST ?action=reset_password` & `POST ?action=check_email`. Authenticated `GET/PUT` for profile management. |

---

## 8. Cashfree UPI Payment & Settlement Lifecycle

```text
[Browser / CheckoutPage]
      │
      ▼  1. POST /api/orders (cart items, address)
[Server: api/orders.js]
      ├── 2. Validate products, sizes, stock from DB
      ├── 3. Authoritatively recalculate MRP, discount, shipping, total
      ├── 4. Reserve inventory with optimistic version lock (inventory table)
      ├── 5. Insert order with status: PAYMENT_PENDING
      ├── 6. Call Cashfree Create Order API (UPI intent only)
      └── 7. Return payment_session_id to frontend
      │
      ▼  8. Open Cashfree Checkout Modal (UPI Intent)
[Cashfree UPI Gateway]
      │
      ▼  9. Customer completes UPI payment on phone
[Webhook / Reconcile]
      ├── 10. POST /api/cashfree-webhook (Signed HMAC-SHA256)
      │       OR Client triggers /api/payments?action=reconcile
      ├── 11. Verify signature, timestamp window (< 5 min), and unique event dedup key
      ├── 12. Check order existence and ownership
      ├── 13. Transition order status from PAYMENT_PENDING -> PAID
      ├── 14. Permanently capture reserved inventory
      └── 15. Record payment details in `payments` ledger table
      │
      ▼  16. /order-confirmation polls order status until status === 'PAID'
[Order Confirmation Screen: Receipt Printed & Verified]
```

---

## 9. Core TypeScript Models (`src/types.ts`)

```typescript
export interface Product {
  id: number;
  brand: string;
  brand_slug: string;
  name: string;
  slug: string;
  category: string;
  category_slug: string;
  description: string;
  images: string[];
  specifications: Record<string, string>;
  mrp: number;
  sale_price: number;
  discount: number;
  sizes: string[];
  stock: Record<string, number>;
  gender: string;
  featured: boolean;
  popularity: number;
  created_at: string;
  wishlist_id?: number;
  preferred_size?: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'Pending' | 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  created_at: string;
  mrp_total: number;
  discount_total: number;
  shipping_total: number;
  total: number;
  payment_method: string;
  payment_status: 'CREATED' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  payment_session_id?: string;
  cf_order_id?: string;
  paid_at?: string;
  address: Address;
  items: OrderItem[];
}
```

---

## 10. Golden Rules for AI Agents & Developers

When implementing new features, modifying code, or refactoring in this repository, **you must adhere to the following rules**:

1. **Do NOT Modify Backend Payment/Order Logic Without Explicit Instruction**:
   - The Cashfree settlement engine, webhook verification, inventory locking, and order calculations are security-critical and production-tested.
2. **Never Use Generic Spinners for Page Loading**:
   - Always check if a bespoke skeleton exists in `src/components/ui/Skeleton.tsx`.
   - If creating a new page, build a matching skeleton component in `Skeleton.tsx` and connect it as the route `Suspense fallback` in `src/App.tsx`.
3. **Respect the Color Palette & Typography Hierarchy**:
   - Ink: `#0b0b0b`, Paper: `#f6f5f2`, Accent: `#ff4d23`.
   - Never introduce random shades of blue, purple, or unbranded greens unless specifically designated for status indicators.
4. **Preserve SEO Meta Hooks**:
   - Every page component must invoke `useSEOMeta({ title, description, url })`.
5. **Keep Client Bundles Secret-Free**:
   - Never import `process.env` secrets into React code. Run `npm run build` to ensure the automated security scanner in `scripts/audit-client-bundle.mjs` passes.
6. **Verify Build**:
   - Always run `npm run build` after making modifications to ensure 0 TypeScript compilation errors.
