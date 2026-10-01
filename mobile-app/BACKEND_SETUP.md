# Bhangari Exchange — Backend Setup (Firebase)

This folder contains the repeatable Firebase backend configuration for the mobile app.
No custom server is needed — the app talks to Firebase directly.

The `.env` file holds your Firebase credentials (`EXPO_PUBLIC_FIREBASE_*`). It is gitignored, so you must create it on every machine (copy `.env.example` → `.env`, fill real values from Firebase Console → Project Settings → Your Apps).

## What each file does
| File | Purpose |
|------|---------|
| `firebase.json` | Points the Firebase CLI at the rules/index files below |
| `firestore.rules` | Security rules for users, pickupRequests, messages, reviews, payments |
| `firestore.indexes.json` | Optional composite indexes (the app's queries no longer require any) |
| `storage.rules` | Rules for photo uploads (namespaced under each user's UID) |

## Collections
| Collection | Written by | Notes |
|------------|-----------|-------|
| `users/{uid}` | the user | `role` is `household` or `collector` and can't be changed later |
| `pickupRequests/{id}` | household creates; collector accepts/updates | status: `pending → accepted → on-the-way → at-location → completed` (household may `cancelled` while pending/accepted) |
| `messages/{id}` | sender | readable only by sender and recipient |
| `reviews/{pickupId}` | household | one review per completed pickup; collector rating = average of their reviews |
| `payments/{id}` | assigned collector | **demo** payments (cash / mobile wallet / bank) — no external payment API is called |

## One-time setup in Firebase Console
1. Create/open your Firebase project → Project settings → Your Apps → add a **Web app** → copy the config into `.env`.
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore** → Create database, then deploy the security rules (below).
4. **Storage** → Get started, then deploy the storage rules (below).

## Option A: Deploy with the Firebase CLI (recommended)
```bash
cd mobile-app
npm install -g firebase-tools        # once
firebase login                       # once
firebase deploy --only firestore:rules,storage --project <your-project-id>
```

## Option B: Manual (no CLI)
Paste the contents of `firestore.rules` into Firestore → Rules, and `storage.rules` into Storage → Rules, then click **Publish**.

> Images uploaded via `src/utils/helpers.js` are stored under `pickups/<uid>/<file>` so `storage.rules` can restrict a user to their own files.
