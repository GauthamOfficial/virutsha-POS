# 🍽️ VISA Tamil Kitchen POS

A point-of-sale system for a restaurant that serves both local customers and
visitors, built on the MERN stack.

**Its defining feature is dual pricing.** Every dish carries a *Local* price and a
*Foreigner* price, and one tap switches the entire menu and the running bill between
them at any point in the order, including after everything has been rung up.

👉 **[SETUP-GUIDE.md](SETUP-GUIDE.md)** for installing it on the laptop, and how to use
it day to day.

---

## Features

| | |
|---|---|
| 💱 **Dual pricing** | Local / Foreigner switch that re-prices the whole cart live. The choice is remembered between orders and printed on the bill. The two labels are editable. |
| 🍛 **Menu management** | Categories and dishes with a photo and both prices. Photos are shrunk in the browser and stored in the database, so there is no file server to run. |
| 🏷️ **Discounts** | A percentage off any single item, a flat amount off the whole bill, or both. Item percentages apply first, so the two together can never exceed the order value. Both are itemised on the bill and split out in the reports. |
| 🧾 **Billing & invoicing** | Sequential bill numbers, an 80mm thermal-printer receipt that also prints on A4, and reprinting of any past bill. |
| 📊 **Sales reports** | Daily, weekly, monthly, yearly or a custom range. Income, bill count, average bill, income over time, Local vs Foreigner split, payment-method split, best sellers, and CSV export. |
| 💵 **Cash, card & QR** | Cash with a change calculator, card through the shop's own machine, or a QR scan. No payment gateway. |
| 👥 **Roles** | Cashiers take orders; Admins also manage the menu, staff, settings and reports. |
| ⊘ **Voiding** | A wrong bill is voided, never deleted. It stays on record and drops out of the sales figures. |
| 🔌 **Offline-capable** | Runs entirely on the laptop with a local database. No internet needed to take an order or print a bill. |

## Brand

Taken from the VISA Tamil Kitchen brand sheet. Defined once in
[`pos-frontend/tailwind.config.js`](pos-frontend/tailwind.config.js). No component
hardcodes a colour.

| Role | Colour | Used for |
|---|---|---|
| Deep Terracotta | `#8D2C0D` | Header, primary buttons, the main brand fill |
| Mustard Gold | `#CA840E` | Active nav, the *Local* price list, accents |
| Dark Green | `#1B3A20` | The *Foreigner* price list, cash, positive figures |
| Cream | `#F7E8CB` | The page background, so the whole POS reads as warm paper |

Two supporting notes:

- **Charts use lighter steps of the same hues** (`#A8391A`, `#B8770C`, `#00795A`).
  A fill that works as a button is too dark to read as a data mark on cream. These
  steps were checked with a contrast/colour-blindness validator and pass on every
  pair, including for protanopia and deuteranopia.
- **Every text-on-background pair in the app clears WCAG AA.** The lowest is muted
  text on cream at 4.73:1.

There is **no logo yet**. The name is set as type in
[`Wordmark.jsx`](pos-frontend/src/components/shared/Wordmark.jsx). When the real
logo arrives it drops in beside or instead of that one component, and nothing else
moves.

## Tech stack

| Category | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, React Query, Tailwind CSS, Vite |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, httpOnly cookie, with Bearer token fallback for cross-domain hosting |

## Project layout

```
virutsha-pos/
├─ Setup (run once).bat     First-time install on Windows
├─ Start POS.bat            Double-click to run the POS
├─ SETUP-GUIDE.md           Install + day-to-day usage
│
├─ pos-backend/
│  ├─ app.js                Express app; also serves the built frontend
│  ├─ seed.js               Creates the admin login + a starter menu
│  ├─ models/               User, Category, Dish, Order, Settings, Counter
│  ├─ controllers/          Including the bill maths and the reports
│  ├─ routes/
│  └─ api/index.js          Serverless entry point (optional cloud hosting)
│
└─ pos-frontend/
   └─ src/
      ├─ pages/             Home, NewOrder, Bills, Reports, Admin, Auth
      ├─ components/
      │  ├─ order/          CustomerTypeToggle, MenuGrid, CartPanel
      │  ├─ admin/          Dish, Category, Staff and Settings management
      │  ├─ invoice/        The printable bill
      │  └─ reports/        Sales chart
      └─ redux/slices/      cart, customer, user, settings
```

## Running it for development

```bash
# Terminal 1: backend
cd pos-backend
cp .env.example .env        # then check MONGODB_URI
npm install
npm run seed                # once: creates the admin login + starter menu
npm run dev                 # http://localhost:8000

# Terminal 2: frontend
cd pos-frontend
npm install
npm run dev                 # http://localhost:5173
```

For production on the laptop, build the frontend once (`npm run build` in
`pos-frontend`) and then just run the backend. It serves the built app itself, so
the whole POS is on `http://localhost:8000` with no CORS and one window to keep open.

## API

All routes need a login except `/api/health` and `/api/user/setup-status`.
Routes marked 🔒 are Admin-only.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/health` | Is the server up |
| `GET` | `/api/user/setup-status` | Does this installation still need its first account |
| `POST` | `/api/user/register` | Create a user (open only while no user exists, then 🔒) |
| `POST` | `/api/user/login` | Log in; returns a token |
| `GET` | `/api/user` | The logged-in user |
| `GET/PUT/DELETE` | `/api/user/staff...` | 🔒 Manage staff |
| `GET` | `/api/category` | List categories with dish counts |
| `POST/PUT/DELETE` | `/api/category...` | 🔒 Manage categories |
| `GET` | `/api/dish` | List dishes |
| `POST/PUT/DELETE` | `/api/dish...` | 🔒 Manage dishes |
| `POST` | `/api/order` | Save a bill |
| `POST` | `/api/order/preview` | Price a bill without saving it |
| `GET` | `/api/order` | Search bills (date range, text, paging) |
| `PUT` | `/api/order/:id/void` | 🔒 Void a bill |
| `GET` | `/api/report/overview` | Today / this week / this month |
| `GET` | `/api/report/sales` | 🔒 Full report for a period |
| `GET/PUT` | `/api/settings` | Shop settings (PUT is 🔒) |

### A note on how bills are priced

The browser sends only *which dish*, *how many* and *what percentage off*, plus
the Local/Foreigner choice. The server looks up the real prices, picks the right one for the customer
type, and recalculates the whole bill before saving. Prices coming from the browser
are ignored entirely, so a tampered or out-of-date page cannot change what gets
charged or recorded.

---

© 2026 Kumar Gautham. All rights reserved. See [LICENSE](LICENSE).
