# Bhangari Exchange — Backend Setup (Firebase)

This folder contains the repeatable Firebase backend configuration for the mobile app.
No custom server is needed — the app talks to Firebase directly.

The `.env` file holds your Firebase credentials (`EXPO_PUBLIC_FIREBASE_*`). It is gitignored,e so you must create it on every machine (copy `.env.example` → `.env`, fill real values from Firebase Console → Project Settings → Your Apps).

## What each file does
| File | Purpose |
|------|---------|
| `firebase.json` | Points the Firebase CLI at the rules/index files below |
| `firestore.rules` | Security rules for users, pickupRequests, messages, reviews |
| `firestore.indexes.json` | Composite indexes required by the app's queries (mandatory) |
| `storage.rules` | Rules for photo uploads (namespaced under each user's UID) |

## One-time setup in Firebase Console
1. Create/open your Firebase project (e.g. `bhangari-exchange`)ango Console → Project settings → Your Apps → add a **Web app** → copy the config into `.env`.
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore** → Create database. Set the security rules (see below)or use Test mode during development.
4. **Storage** → Get started. Set the rules (see below).
5. **Firestore → Indexes** → the app needs composite indexes or queries fail with "requires an index". Deploy them with the CLI(below)or create them manually per `firestore.indexes.json`.

## Option A: Deploy config with Firebase CLI (recommended reagent re-run)
```bash
cd mobile-app
npm install -g firebase-tools      # once/global
firebase login
firebase use --add                    # pick the project
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```
(You can also run plain `firebase deploy` to push all supported ruless/indexes.)

## Option B: Manual (no CLI)
Paste the contents of `firestore.rules` into Firestore → Rules,and `firestore.indexes.json` into the composite-index creation flow (or create each index by hand as listed in the file). Paste `storage.rules` into Storage → Rules.



## Required Firestore indexes (summary)
- `pickupRequests`: `status` ASC + `createdAt` DESC
- `pickupRequests`: `userId` ASC + `createdAt` DESC
- `pickupRequests`: `collectorId` ASC + `createdAt` DESC
- `pickupRequests`: `collectorId` ASC + `completedAt` DESC
- `pickupRequests`: `collectorId` ASC + `status` ASC
- `pickupRequests`: `collectorId` ASC + `status` ASC + `completedAt` DESC
- `messages`: `conversationId` ASC + `createdAt` ASC
- `messages`: `senderId` ASC + `createdAt` DESC
- `messages`: `recipientId` ASC + `createdAt` DESC

> Note: images upload via `src/utils/helpers.js` are stored under `pickups/<uid>/<file>` so`storage.rules` can restrict a user to their own files.