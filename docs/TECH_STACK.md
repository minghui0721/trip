# Jalan Jalan — Tech Stack Decisions

> Last updated: 2026-09-24

## 1. Tech Stack Overview

### ✅ Decided

- **Framework — Next.js** (React-based)
  Most popular React full-stack framework, with the most tutorials and components.
- **Backend / Database — Supabase**
  One service covering database, auth, and realtime sync.
- **Database type — PostgreSQL** (comes with Supabase)
  Relational database, well suited to expense splitting, no vendor lock-in.
- **Auth — Supabase Auth**
  Sign-in with **Google** (email + password may be added later as a fallback).
- **Realtime — Supabase Realtime**
  When a friend changes data, everyone else's page updates automatically.

### 🟡 Suggested

- **Language — TypeScript**
  JavaScript with type checking, so the editor flags mistakes as you type.
- **UI styling — Tailwind CSS + shadcn/ui**
  Fast for building mobile UIs.
- **Hosting — Vercel**
  The platform behind Next.js; free tier is enough.

### ⏳ Decide later

- **Maps (V1)** — Google Maps or Mapbox
- **Exchange rate API (V5)** — TBD

## 2. Architecture

```
User's mobile browser
      │
      ↓
Next.js site (hosted on Vercel)
      │
      ↓
Supabase (cloud)
├── PostgreSQL database   ← all data
├── Auth                  ← sign-up / sign-in
└── Realtime              ← live sync
```

## 3. Database Table Plan

All trip data links back to its Trip through `trip_id`.

| Version | Table | Purpose |
|---|---|---|
| V0 | `auth.users` | Accounts (managed automatically by Supabase) |
| V0 | `profiles` | User profile: display name, avatar |
| V0 | `trips` | Trip: name, destination, dates, invite code |
| V0 | `trip_members` | Who belongs to which Trip, and their role (owner / member) |
| V1 | `places` | Places: name, category, status, notes |
| V2 | `itinerary_items` | Itinerary: date, time, activity; can reference a place |
| V3 | `expenses` | Each expense: amount, **currency**, payer |
| V3 | `expense_splits` | Who shares each expense and how much each person owes |
| V5 | `exchange_rates` | Exchange rates (optional) |

Relationships:

```
profiles ──< trip_members >── trips
                                 │
               ┌─────────┬───────┴───┬──────────┐
            places   itinerary    expenses   (more later)
```

## 4. PWA Plan

| Stage | What to do |
|---|---|
| V0 ✅ | `src/app/manifest.ts` + icons in `public/icons/` → can be added to the home screen and opens full screen |
| V0–V5 | Build as a normal website, following the habits below |
| V6 | Add a Service Worker → offline viewing and push notifications |

**Development habits to follow from V0:**
- Mobile-first design
- In-app back buttons (full-screen mode has no browser back button)
- Respect safe areas for the notch and home indicator
- Show a friendly message when the network fails, never a blank screen
- Keep data fetching in one place so caching is easy to add later

## 5. Things to Watch

- **Always write permission rules (RLS)**, e.g. "only members of a Trip can see that Trip's data".
- **Supabase free tier**: a project pauses after 7 days of inactivity, so open it once before leaving on a trip.
- **Store currency on expenses from V3**, so V5's currency features don't require changing existing data.

## 6. Open Decisions (V0)

- [x] Sign-in method: **Google** (one tap to sign up / sign in)
  - Needs a Google Cloud OAuth client (Client ID + Secret) configured in Supabase
  - Detect in-app browsers (WhatsApp, Messenger, Instagram) and ask users to open the link in Chrome / Safari, because Google blocks sign-in there
  - ⚠️ TODO before inviting friends: the Google Cloud OAuth project may be set up under a work account at first. Move it to a personal / dedicated Gmail (new project + OAuth client, then swap Client ID & Secret in Supabase). Existing users are unaffected.
  - Email + password can be added later as a fallback
  - One "Continue with Google" button (sign-up and sign-in are the same flow)
  - V0 uses the Google name as the display name; editing it comes later on a profile page
- [x] Roles are **per Trip**: any user can be the owner of Trips they create and a member of Trips they join
  - [ ] What can an owner do that a member can't (edit Trip, remove members, regenerate invite code)
- [ ] Invite link: does it expire? Does the owner need to approve new members?
- [ ] Can members leave a Trip on their own?
