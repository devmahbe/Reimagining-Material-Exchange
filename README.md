# ভাঙ্গারি এক্সচেঞ্জ — Bhangari Exchange

A mobile app that connects **households** with **bhangari (scrap) collectors** in Bangladesh. Households list recyclable materials and book a doorstep pickup. Collectors accept the request, travel to the address, weigh the materials and pay the household — all inside one Bangla-first app.

> Built as a university Mobile Application Development (MAD) project.

---

## Features

### For households
- **Request a pickup** in three steps: choose materials and quantities (with photos), pick a date and time slot, review and confirm
- **Live tracking** — status timeline (accepted → on the way → arrived → completed), collector details and a map of the pickup address
- **Today's prices** for paper, plastic, metal, glass, electronics and clothes, with instant estimates
- **History** with filters (active / completed / cancelled), cancel a pickup before it starts
- **Rate and review** the collector after a completed pickup
- **Payment receipts** for every completed pickup

### For collectors
- **Dashboard** with new requests and your active pickups, plus today's / this week's totals
- **Accept requests** safely — two collectors can never accept the same pickup
- **Step-by-step updates** (on the way → arrived) that the household sees in real time
- **Pay the household** when the pickup is done (see *Demo payments* below)
- **Earnings and statistics** — totals by day/week/month/year, charts, top materials, completion rate and rating

### For everyone
- **In-app chat** between household and collector, with read receipts
- **Notifications** feed for pickup and payment updates
- **Multiple accounts** — keep up to 3 accounts signed in on one device and switch instantly; on the web, each browser tab can use a different account
- Email/password and **Google sign-in**, password reset, profile editing
- Works on **Android, iOS and Web**

### Demo payments
Payments are **simulated** — no real money moves and no payment gateway is called. The collector enters the final amount after weighing, chooses **Cash**, **Mobile wallet** or **Bank transfer**, and the app records the payment and marks the pickup completed in a single atomic write. Both sides get a receipt with a transaction ID that can be shared.

---

## Tech stack

| Area | Technology |
|------|------------|
| App framework | [Expo](https://expo.dev) SDK 57, React Native 0.86, React 19 |
| Navigation | React Navigation 6 (stack) |
| Backend | Firebase — Authentication, Cloud Firestore, Cloud Storage |
| Auth | Email/password, Google Sign-In (`@react-native-google-signin/google-signin`) |
| Maps | Leaflet + OpenStreetMap/CARTO tiles in a WebView, Nominatim geocoding |
| Media | `expo-image-picker` for material photos |
| Builds | EAS Build (development / preview / production profiles) |

There is no custom server — the app talks to Firebase directly, and access is enforced by Firestore security rules.

---

## Project structure

```
mobile-app/
├── App.js                   # Navigation stack
├── app.json                 # Expo config (icons, splash, plugins)
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
├── assets/                  # App icon, splash, favicon
└── src/
    ├── components/          # Shared UI (buttons, cards, header, map, account switcher)
    ├── config/firebase.js   # Firebase setup (one instance per signed-in account)
    ├── constants/           # Colors, theme, materials & prices, pickup statuses
    ├── navigation/          # Bottom navigation per role
    ├── screens/
    │   ├── household/       # Home, material selection, schedule, confirm, track, history, rate, profile
    │   ├── collector/       # Dashboard, request details, earnings, statistics
    │   └── ...              # Login, signup, payment, receipt, chat, messages, notifications, prices, settings
    ├── services/            # Firestore logic: pickups, payments, chat, reviews, users, accounts, geocoding
    └── utils/               # Helpers (Bangla numbers & dates, prices, phone validation), Google auth, alerts
```

---

## Getting started

### Prerequisites
- Node.js 20 or newer
- A Firebase project with **Authentication** (Email/Password and Google), **Firestore** and **Storage** enabled
- For Google sign-in on a phone: an [EAS development build](https://docs.expo.dev/develop/development-builds/introduction/) (Google sign-in doesn't work in Expo Go)

### 1. Install
```bash
cd mobile-app
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
```
Fill in the values from **Firebase Console → Project settings → Your apps** and your Google OAuth client IDs. `.env` is git-ignored and must never be committed.

### 3. Deploy the security rules
Paste `firestore.rules` into **Firestore → Rules** and `storage.rules` into **Storage → Rules** in the Firebase Console, or with the Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage --project <your-project-id>
```
See [`mobile-app/BACKEND_SETUP.md`](mobile-app/BACKEND_SETUP.md) for the data model.

### 4. Run
```bash
npx expo start
```
Then press `w` for the web version, or open the app in your development build and scan the QR code.

To create a development build for Android:
```bash
eas build --profile development --platform android
```

---

## Try the full flow

Use two accounts — one **household**, one **collector** (two browser tabs work, since each tab keeps its own login):

1. Household: request a pickup → add materials → choose a time → confirm
2. Collector: accept it under **New requests**
3. Household: watch the tracking screen update, send a message
4. Collector: **On my way** → **Arrived** → **Weigh & pay** → pick a payment method → receipt
5. Household: see the payment, then rate the collector

---

## Security notes
- All credentials live in `.env` (git-ignored). The Firebase web API key is bundled into every client build by design, so data access is protected by the **Firestore and Storage security rules** in this repo — deploy them before going live.
- Restrict the API key in **Google Cloud Console → APIs & Services → Credentials** to your Android package / SHA-1, iOS bundle ID and web domain.
- Payments are a demo only and must not be used for real transactions.

---

Mobile Application Development course project.
