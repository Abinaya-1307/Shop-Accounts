# ShopTracker Diary — Project Flow

> A React Native + Expo app to track household & grocery purchases.  
> Records items bought, prices paid, shops visited, and trends over time.

---

## 1. What Happens When You Run the App

```
npx expo start          → development (Expo Go / QR code)
npx expo start --web    → browser preview at localhost:8081
npx expo start --android → Android emulator
npx expo start --ios    → iOS simulator
```

When any of those commands run, here is the sequence:

```
Metro Bundler starts
        │
        ▼
expo-router/entry   (entry point in package.json → "main")
        │
        ▼
app/_layout.tsx     ← ROOT of the whole app
        │
        ├── useFrameworkReady()   (web-only signal, safe to ignore on native)
        │
        ├── <ShopProvider>        ← wraps entire app with global data
        │       └── loads AsyncStorage → fills items / transactions / shops
        │           (seeds sample data on very first launch)
        │
        └── <Stack navigator>     ← handles page-level navigation
                │
                └── app/index.tsx → immediately redirects to /(tabs)
```

---

## 2. The Tab Navigator (Main UI)

`app/(tabs)/_layout.tsx` renders a **bottom tab bar** with 5 tabs:

| Tab | File | Icon | Purpose |
|-----|------|------|---------|
| Home | `(tabs)/index.tsx` | 🏠 | Dashboard — monthly totals & recent purchases |
| History | `(tabs)/history.tsx` | 📊 | Browse all items & purchases |
| **Add** | `(tabs)/add.tsx` | ➕ | Record a new purchase (FAB button) |
| Reports | `(tabs)/reports.tsx` | 📅 | Calendar + top-expense breakdown |
| Settings | `(tabs)/settings.tsx` | ⚙️ | Manage items, shops, preferences |

---

## 3. Screen-by-Screen Flow

### 🏠 Home (Dashboard)

```
User opens app
      │
      ▼
GET /dashboard?month=X&year=Y   (backend API)
      │
      ├── currentMonthTotal  — total spent this month
      ├── prevMonthTotal     — total spent last month
      └── recentTransactions — last few purchases
            │
            ▼
      Shows:
        • Gradient summary card (₹ spent + MoM comparison arrow)
        • Month picker (last 13 months)
        • List of recent transactions with item icons & price trend arrows
```

---

### 📊 History

```
User taps History tab
      │
      ▼
GET /items        — all tracked items
GET /transactions — all purchase history (parallel)
      │
      ├── Tab: "By Item"
      │       Search bar → filter items by name
      │       Each item shows last price, unit, price trend (↑↓ stable)
      │       Tap item → navigate to /item/[id]
      │
      └── Tab: "By Shop"
              Groups transactions by shop name then by date
              Each session shows items + grand total
              Tap session → navigate to /shop-session?shopName=X&date=Y
              Share button → share session summary via WhatsApp / SMS
```

---

### ➕ Add Purchase

```
User taps the + FAB button
      │
      ▼
add.tsx renders a form:
      │
      ├── Item Name field
      │     └── Debounced search (300ms) → GET /items/search?q=...
      │         Shows dropdown suggestions with last price
      │         Selecting fills in the last known price automatically
      │
      ├── Price Per Unit (₹)
      │     └── Shows price difference vs last purchase (↑ increase / ↓ decrease)
      │
      ├── Quantity + Unit picker (kg / g / ltr / ml / pcs / nos)
      │
      ├── Total Cost (auto-calculated: price × qty)
      │
      └── Shop Name field (optional)
            └── Debounced search → GET /shops/search?q=...
                Shows dropdown suggestions

User taps Save:
      │
      ├── Validates required fields
      ├── POST /new   → saves to backend
      ├── addPurchase() on ShopContext → saves to AsyncStorage locally
      └── Redirects back to Home tab
```

---

### 📅 Reports

```
User taps Reports tab
      │
      ▼
GET /reports?month=X&year=Y   (backend API)
      │
      ├── transactions   — all this month's transactions
      ├── dailyTotals    — { day: amount } map
      ├── topExpenses    — top 5 items by total spent
      └── monthTotal     — grand total for the month
            │
            ▼
      Shows:
        • Month navigator (← prev / next →) + month picker modal
        • Monthly total card
        • Calendar view — each day colored by spend intensity
          └── Tap a day → modal shows all purchases that day
        • Top 5 Expenses bar chart with colored segments
        • Share button → exports summary as text (WhatsApp / SMS)
```

---

### ⚙️ Settings

```
User taps Settings tab

Management section:
  → Manage Items   (routes to /manage-items)
  → Manage Shops   (routes to /manage-shops)

Data & Privacy section:
  → Sync to Google Drive    (coming soon alert)
  → Privacy Settings        (info alert)

Preferences section:
  → Dark Mode toggle        (local state only, UI future)
  → Language selector       (English / Tamil)

Account section:
  → Sign Out                (alert confirmation)
```

---

## 4. Non-Tab Stack Screens

### 📦 Item Detail — `/item/[id]`

```
Navigated from History "By Item" tab
      │
      ▼
GET /items/:id   → item info + full purchase history
      │
      Shows:
        • Item name, unit, category
        • Price stats: min / max / avg across all purchases
        • Full timeline of every purchase (date, price, qty, shop name)
        • Price trend indicator on each row
```

---

### 🛒 Shop Session — `/shop-session?shopName=X&date=Y`

```
Navigated from History "By Shop" tab
      │
      ▼
GET /transactions/session?shopName=X&date=Y
      │
      Shows:
        • Shop name + session date header
        • Each item bought in that visit (price, qty, unit, trend icon)
        • Grand total for the session
```

---

### 🗂️ Manage Items — `/manage-items`

```
Navigated from Settings
      │
      ▼
GET /items   → lists all tracked items
      │
      Each item shows: name, unit, last price
      DELETE /items/:id  → remove item + its history (with confirmation alert)
      Pull-to-refresh to reload
```

---

### 🏪 Manage Shops — `/manage-shops`

```
Navigated from Settings
      │
      ▼
GET /shops   → lists all tracked shops
      │
      Each shop shows: name
      DELETE /shops/:id  → remove shop (existing purchases are kept)
      Pull-to-refresh to reload
```

---

## 5. Data Architecture

### Two-layer Data System

```
┌─────────────────────────────────────────────────────┐
│                   React App (UI)                    │
└─────────────┬───────────────────────┬───────────────┘
              │                       │
              ▼                       ▼
   ┌──────────────────┐   ┌───────────────────────┐
   │  ShopContext      │   │  Axios (HTTP Client)  │
   │  (Local Store)    │   │  (Remote Backend)     │
   └──────────────────┘   └───────────────────────┘
              │                       │
              ▼                       ▼
   ┌──────────────────┐   ┌───────────────────────┐
   │  AsyncStorage     │   │  REST API Server      │
   │  (on-device DB)   │   │  localhost:3000 (dev) │
   └──────────────────┘   │  onrender.com (prod)  │
                           └───────────────────────┘
```

### ShopContext (Local Layer)

Located in `context/ShopContext.tsx`:

| What it stores | AsyncStorage key |
|---------------|-----------------|
| Items catalog | `shoptracker_items` |
| All transactions | `shoptracker_transactions` |
| Shops list | `shoptracker_shops` |

**On first launch**, seeds sample data automatically:
- 5 items: Ponni Rice, Toor Dal, Milk, Sunflower Oil, Sugar
- 7 sample transactions
- 2 sample shops: Murugan Stores, Big Bazaar

**Methods available app-wide:**
- `addPurchase(payload)` — create a new transaction, auto-creates item/shop if new
- `getMonthlyTotal(month, year)` — sum transactions for a month
- `getItemHistory(itemId)` — all transactions for one item
- `getRecentTransactions(limit)` — latest N transactions

### Hooks (Wrappers around ShopContext)

| Hook | What it returns |
|------|----------------|
| `useItems()` | `{ data: items[], isLoading }` |
| `useShops()` | `{ data: shops[], isLoading }` |
| `useTransactions(limit)` | sorted recent transactions |
| `useCreateTransaction()` | `{ mutateAsync(payload), isPending }` |

---

## 6. API Endpoints Used

| Screen | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| Home | GET | `/dashboard?month&year` | Monthly totals + recent txns |
| History | GET | `/items` | All items |
| History | GET | `/transactions` | Full transaction list |
| Add | GET | `/items/search?q=` | Autocomplete items |
| Add | GET | `/shops/search?q=` | Autocomplete shops |
| Add | POST | `/new` | Save new purchase |
| Reports | GET | `/reports?month&year` | Calendar data + top expenses |
| Item Detail | GET | `/items/:id` | Item + its history |
| Shop Session | GET | `/transactions/session?shopName&date` | One visit's items |
| Manage Items | GET | `/items` | List all items |
| Manage Items | DELETE | `/items/:id` | Delete item |
| Manage Shops | GET | `/shops` | List all shops |
| Manage Shops | DELETE | `/shops/:id` | Delete shop |

**Backend URLs** (set in `lib/config.ts`):
- **Dev**: `http://localhost:3000`
- **Prod**: `https://shop-account-backend.onrender.com`

---

## 7. Key Files at a Glance

```
ShopTracker Diary
│
├── app.json                  App name, bundle ID, expo config
├── package.json              Scripts, dependencies
│
├── app/
│   ├── _layout.tsx           ROOT: ShopProvider + Stack navigator
│   ├── index.tsx             Redirect → /(tabs)
│   ├── (tabs)/
│   │   ├── _layout.tsx       Bottom tab bar (5 tabs)
│   │   ├── index.tsx         🏠 Home/Dashboard
│   │   ├── history.tsx       📊 History (by item / by shop)
│   │   ├── add.tsx           ➕ New purchase form
│   │   ├── reports.tsx       📅 Calendar + expense reports
│   │   └── settings.tsx      ⚙️  Settings
│   ├── item/[id].tsx         Item detail + price history
│   ├── shop-session.tsx      One shopping visit detail
│   ├── manage-items.tsx      CRUD item catalog
│   └── manage-shops.tsx      CRUD shops list
│
├── context/
│   └── ShopContext.tsx       Global state (AsyncStorage-backed)
│
├── hooks/
│   ├── useData.ts            Wrappers: useItems, useShops, useCreateTransaction
│   └── useFrameworkReady.ts  Web-only init signal
│
├── lib/
│   └── config.ts             API_URL (dev vs prod switch)
│
├── types/
│   └── index.ts              TypeScript types: Item, Transaction, Shop, AddPurchasePayload
│
├── utils/
│   └── helpers.ts            formatCurrency, formatDate, getPriceTrend, generateId
│
├── constants/
│   └── design.ts             Colors, spacing, typography, shadows, border radius
│
└── components/
    └── ui/                   Button, Card, Container, Input, Avatar (shared UI kit)
```

---

## 8. Build Commands

| Command | What it does |
|---------|-------------|
| `npx expo start` | Start dev server (scan QR with Expo Go) |
| `npx expo start --web` | Open in browser |
| `npx expo start --android` | Open in Android emulator |
| `npx expo start --ios` | Open in iOS simulator |
| `npx expo export --platform web` | Build static web bundle |
| `eas build --platform android` | Build production `.apk` / `.aab` |
| `eas build --platform ios` | Build production `.ipa` |
| `npx expo prebuild` | Generate native `android/` and `ios/` folders |
| `expo run:android` | Build + run on connected Android device |
| `expo run:ios` | Build + run on connected iOS device |
