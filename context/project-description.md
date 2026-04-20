# SeedNest — Project Description

## What This App Does
SeedNest is a multi-tenant tree seed nursery management platform that helps nursery managers run their seedling business end-to-end — from inventory and sales to customer support. Customers can discover nearby nurseries via GPS, purchase seedlings online, and raise post-purchase support issues, while managers get full control over their nurseries, stock, orders, and reporting.

## Target Users
- **Primary user (Manager):** A nursery owner or operations manager who runs one or more tree seedling nurseries. They need to manage seedling inventory, record both online and walk-in sales, handle customer requests, and export financial reports.
- **Secondary user (Customer):** An individual or organization looking to purchase tree seedlings from nearby nurseries. They browse, buy online, track their orders, and raise after-sale support requests.

## Core Value Proposition
SeedNest gives nursery managers a single platform to run their entire seedling operation — inventory, sales, customer issues, and reporting — while giving customers a geo-aware, mobile-friendly way to find and buy from the nearest nursery.

---

## User Roles & Permissions

- **Manager:**
  - Self-registers via public sign-up
  - Creates and manages their own nurseries (fully isolated — cannot see other managers' data)
  - Creates/edits/deletes seedling categories per nursery
  - Creates/edits/deletes seedlings with photos, size, quantity, and availability
  - Records walk-in sales manually
  - Views all orders (online + walk-in) for their nurseries
  - Exports sales reports (PDF + Excel) by week, month, or custom date range
  - Receives email + in-app notifications for new customer issues
  - Replies to and resolves/reopens customer issues
  - Receives low-stock alerts when seedling quantity falls below threshold
  - Sets nursery GPS coordinates (latitude/longitude) and address

- **Customer:**
  - Self-registers via public sign-up
  - Grants GPS location permission on mobile to discover nearby nurseries
  - Browses seedlings filtered by proximity and availability
  - Adds seedlings to cart and checks out via Stripe
  - Chooses delivery or pickup at checkout
  - Receives purchase receipt via email
  - Views their order history and order status
  - Raises support issues/requests (replacement requests, queries, complaints)
  - Comments on issues, reopens closed issues
  - Receives email notifications when manager replies to their issue or resolves it
  - Receives seedling care reminder emails after purchase

---

## Features — Complete List

1. **Multi-Tenant Manager Accounts** — Each manager's nurseries, seedlings, sales, and customers are fully isolated. No cross-tenant data visibility.
2. **Nursery Management** — Manager creates multiple nurseries with name, description, address, GPS coordinates (lat/lng), cover photo, and operating hours.
3. **Category Management** — Manager creates unlimited custom categories per nursery (e.g. Fruit Trees, Shade Trees, Medicinal Plants).
4. **Seedling Management** — Manager creates seedlings with: name, description, category, size (Small Pot / Big Pot / enum), price, quantity in stock, availability status (Available / Out of Stock / Coming Soon), and up to 5 photos (Cloudflare R2).
5. **Geo-Based Nursery Discovery** — Customer grants GPS on mobile; nurseries are returned sorted by distance (haversine formula) with distance shown in km. Nursery map pins displayed.
6. **Seedling Browsing & Filtering** — Customer can filter by nursery, category, size, price range, and availability status. Search by seedling name.
7. **Online Checkout (Stripe)** — Customer adds seedlings to cart, selects delivery or pickup, enters address if delivery, and pays via Stripe (card payments). Stripe Payment Element with 3D Secure support.
8. **Walk-in Sales Recording** — Manager can manually record a sale by selecting seedlings, quantities, and optionally linking to a registered customer or entering a guest name. Sale is recorded with a timestamp and method = "walk-in".
9. **Order Management** — Manager views all orders (online + walk-in) in a data table with filters by nursery, date range, status, and fulfillment type. Can update order fulfillment status (Pending → Processing → Dispatched → Delivered / Ready for Pickup → Collected).
10. **Purchase Receipt Email** — On successful Stripe payment, customer receives a branded HTML receipt email (Resend + React Email) with order details, seedling names, quantities, total, and fulfillment type.
11. **Sales Reports & Exports** — Manager can view sales analytics dashboard (total revenue, total orders, top-selling seedlings, orders by nursery) and export reports as Excel (.xlsx) or PDF for any date range.
12. **Issue Tracker (GitHub-style)** — Customer raises an issue against an order or a specific seedling (type: Replacement Request, Query, Complaint, General Request). Issues have: title, description, status (Open / In Progress / Resolved / Closed). Manager is notified by email + in-app notification. Manager can reply, change status, and mark resolved. Customer can comment, reopen a resolved issue. Full comment thread with timestamps.
13. **In-App Notifications** — Bell icon with unread count in Manager dashboard. Notifications for: new issue raised, new comment on issue, low stock alert. Mark-as-read and mark-all-read.
14. **Low-Stock Alerts** — When a seedling's quantity drops to or below a configurable threshold (default: 5), the manager receives an in-app notification and email alert.
15. **Seedling Care Reminder Emails** — X days after purchase (configurable per nursery, default 14 days), customers receive an automated care-tip email for their purchased seedlings.
16. **Fulfillment Tracking** — Orders have a fulfillment type (Delivery / Pickup) and a fulfillment status updated by the manager. For delivery orders, customer delivery address and GPS coordinates are captured.
17. **Customer Order History** — Customer dashboard shows their past orders, order statuses, and links to raise issues.
18. **Manager Dashboard Overview** — Landing page after login showing: total nurseries, total seedlings, total revenue (this month), open issues count, recent orders table, low-stock warnings.
19. **Landing Page** — Public marketing page introducing SeedNest with a hero, feature highlights, how-it-works section, and sign-up CTA.
20. **Auth (Better Auth)** — Sign up, sign in, email verification, forgot/reset password, Google OAuth (optional), protected routes.

---

## Data Model

- **User:** id, name, email, emailVerified, image, role (MANAGER | CUSTOMER), createdAt, updatedAt
- **Nursery:** id, managerId (→ User), name, description, address, latitude (Float), longitude (Float), coverImageUrl, operatingHours (String), lowStockThreshold (Int, default 5), careReminderDays (Int, default 14), isActive (Boolean), createdAt, updatedAt
- **Category:** id, nurseryId (→ Nursery), name, description, createdAt, updatedAt
- **Seedling:** id, nurseryId (→ Nursery), categoryId (→ Category), name, description, size (SMALL_POT | BIG_POT), price (Float), quantity (Int), availabilityStatus (AVAILABLE | OUT_OF_STOCK | COMING_SOON), photos (String[], up to 5 R2 URLs), createdAt, updatedAt
- **Order:** id, nurseryId (→ Nursery), customerId (→ User, nullable for walk-in), guestName (String, nullable), fulfillmentType (DELIVERY | PICKUP), fulfillmentStatus (PENDING | PROCESSING | DISPATCHED | DELIVERED | READY_FOR_PICKUP | COLLECTED), deliveryAddress (String, nullable), deliveryLat (Float, nullable), deliveryLng (Float, nullable), saleMethod (ONLINE | WALKIN), stripePaymentIntentId (String, nullable), totalAmount (Float), receiptEmailSent (Boolean), notes (String, nullable), createdAt, updatedAt
- **OrderItem:** id, orderId (→ Order), seedlingId (→ Seedling), seedlingName (String, snapshot), seedlingSize (String, snapshot), unitPrice (Float, snapshot), quantity (Int)
- **Issue:** id, orderId (→ Order, nullable), seedlingId (→ Seedling, nullable), customerId (→ User), nurseryId (→ Nursery), title, description, type (REPLACEMENT_REQUEST | QUERY | COMPLAINT | GENERAL_REQUEST), status (OPEN | IN_PROGRESS | RESOLVED | CLOSED), createdAt, updatedAt
- **IssueComment:** id, issueId (→ Issue), authorId (→ User), body (String), createdAt, updatedAt
- **Notification:** id, userId (→ User), type (NEW_ISSUE | NEW_COMMENT | LOW_STOCK | ORDER_UPDATE), title, message, isRead (Boolean), relatedId (String, nullable), createdAt
- **CareReminder:** id, orderId (→ Order), customerId (→ User), scheduledAt (DateTime), sentAt (DateTime, nullable), isSent (Boolean)

**Relationships:**
- A User (Manager) has many Nurseries
- A Nursery has many Categories, Seedlings, Orders, Issues, Notifications
- A Category has many Seedlings
- An Order belongs to a Nursery and optionally a Customer User; has many OrderItems
- An OrderItem belongs to an Order and a Seedling
- An Issue belongs to a Customer User and a Nursery; optionally linked to an Order or Seedling; has many IssueComments
- An IssueComment belongs to an Issue and an author User
- A Notification belongs to a User
- A CareReminder belongs to an Order and Customer

---

## Pages / Screens

### Public Pages
1. `/` — Landing page: hero, features, how-it-works, CTA to sign up
2. `/auth/sign-in` — Login page (Better Auth UI)
3. `/auth/sign-up` — Registration page with role selection (Manager or Customer)
4. `/auth/verify-email` — Email OTP verification
5. `/auth/forgot-password` — Forgot password
6. `/auth/reset-password` — Reset password

### Customer Pages (role: CUSTOMER)
7. `/explore` — Geo-based nursery discovery: map + list sorted by distance from customer GPS
8. `/explore/[nurseryId]` — Nursery detail: about, seedling grid with filter/search by category, size, price
9. `/explore/[nurseryId]/seedlings/[seedlingId]` — Seedling detail: photo gallery, description, size, price, add to cart
10. `/cart` — Shopping cart: items, quantities, fulfillment type selector (Delivery/Pickup), proceed to checkout
11. `/checkout` — Stripe checkout: address form (if delivery), Stripe Payment Element, order summary
12. `/order-confirmation` — Post-payment confirmation with order details and receipt note
13. `/my-orders` — Customer order history: list of past orders with status badges and issue-raise button
14. `/my-orders/[orderId]` — Order detail: items, fulfillment status timeline, raise issue button
15. `/my-issues` — Customer issues list: all issues raised with status filters (Open, In Progress, Resolved)
16. `/my-issues/[issueId]` — Issue detail: title, description, comment thread, status, reopen button

### Manager Pages (role: MANAGER)
17. `/dashboard` — Overview: stats cards (nurseries, seedlings, revenue, open issues), recent orders table, low-stock warnings
18. `/dashboard/nurseries` — List of manager's nurseries (data table with search)
19. `/dashboard/nurseries/new` — Create nursery form
20. `/dashboard/nurseries/[nurseryId]` — Nursery detail/edit: info, set GPS coordinates, upload cover photo
21. `/dashboard/nurseries/[nurseryId]/categories` — Categories list for this nursery; inline create/edit/delete
22. `/dashboard/nurseries/[nurseryId]/seedlings` — Seedlings data table: search, filter by category/size/status, export
23. `/dashboard/nurseries/[nurseryId]/seedlings/new` — Create seedling form with photo upload
24. `/dashboard/nurseries/[nurseryId]/seedlings/[seedlingId]/edit` — Edit seedling
25. `/dashboard/orders` — All orders across all nurseries: data table, filter by nursery/date/status/method, Excel + PDF export
26. `/dashboard/orders/new` — Record walk-in sale: select nursery, add seedlings, set guest name or link customer
27. `/dashboard/orders/[orderId]` — Order detail: items, fulfillment status updater, customer info
28. `/dashboard/issues` — All issues across nurseries: data table with status/type filters
29. `/dashboard/issues/[issueId]` — Issue detail: full thread, reply form, status updater (mark In Progress, Resolved, Closed)
30. `/dashboard/reports` — Sales analytics: charts (revenue trend, orders by nursery, top seedlings), date-range picker, Export Excel + Export PDF buttons
31. `/dashboard/notifications` — All notifications list with mark-as-read

---

## Integrations
- **Auth:** Better Auth + Google OAuth (optional) + Email/Password
- **Email:** Resend + React Email (receipt, issue notifications, low-stock alerts, care reminders, welcome email)
- **Payments:** Stripe (one-time checkout, card payments, Stripe Payment Element)
- **File uploads:** Cloudflare R2 (seedling photos, nursery cover images)
- **Geo:** Browser Geolocation API (customer GPS) + Haversine distance calculation (server-side)
- **Dark mode:** NOT supported — light mode only

---

## JB Components to Install
- **JB Better Auth UI:** `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- **JB Data Table:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- **Zustand Cart:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/zustand-cart.json`
- **Stripe UI:** `pnpm dlx shadcn@latest add https://stripe-ui-component.desishub.com/r/stripe-ui-component.json`
- **File Storage UI (R2):** `pnpm dlx shadcn@latest add https://file-storage-registry.vercel.app/r/file-storage.json`
- **Searchable Select:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/searchable-select.json`

---

## Out of Scope (v1)
- Admin super-role dashboard for managing all managers
- Subscription/recurring billing for managers (SaaS plans)
- Seedling reviews and star ratings by customers
- In-app real-time chat (issues use async comment threads only)
- Mobile native app (web-first, mobile-responsive)
- Multi-language / i18n support
- Seedling availability calendar / pre-orders
- Bulk seedling import via CSV
