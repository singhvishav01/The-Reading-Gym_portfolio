# The Reading Gym — Architecture & Technical Specifications

**Version:** 1.0.0
**Status:** MVP Completed

A gamified social reading tracker built on React Native & Supabase, leveraging Realtime subscriptions to track peer progress dynamically.

---

## 🏗 System Architecture

### Frontend (User Interface)
* **Framework:** React Native via Expo SDK 54
* **Routing:** Expo Router v3 (File-based routing with deep linking)
* **Styling:** Constants-driven dynamic StyleSheet (Colors, Spacing, Radii tokens for a premium Dark Mode UI)

### State Management (Zustand)
1. **`authStore`**: Manages Authentication state syncing, profile fetching, and SecureStore JWT persistence.
2. **`roomStore`**: Manages the active room context, local chapter progress tracking, and handles Supabase Realtime state mutations.
3. **`feedStore`**: Manages global event feed caching and optimistic event rendering.

### Backend (Supabase)
* **Database:** PostgreSQL
* **Authentication:** Supabase GoTrue (Email/Password & Session Management)
* **Realtime:** Supabase Realtime (Postgres Changes broadcast)

#### Database Schema
* **`public.users`:** Extended profile data linked to `auth.users` via foreign key cascade.
* **`public.books`:** Cached book metadata to mitigate Google Books API rate limits.
* **`public.reading_rooms`:** One-to-one mapping with books acting as multiplayer hubs.
* **`public.reading_progress`:** Tracking matrix (`user_id` x `book_id`) with unique constraints to map current chapter.
* **`public.chapter_reactions`:** Discrete reaction payload per chapter per user.
* **`public.feed_events`:** Event sourcing table tracking system-wide user actions.

#### Server Logic (Postgres Triggers)
* **`handle_new_user`**: Triggered `AFTER INSERT ON auth.users`. Bypasses Row Level Security (RLS) to safely instantiate the `public.users` row with metadata.
* **`handle_progress_xp`**: Triggered `AFTER INSERT/UPDATE ON public.reading_progress`. Calculates chapter deltas and mathematically increments `public.users.xp` (+10 per chapter).

---

## 🔄 Core Data Flow
1. User navigates to a room.
2. `useReadingRoom.ts` hook mounts and fetches initial states from Supabase.
3. Subscribes to Supabase Postgres 'UPDATE/INSERT' channels.
4. When a peer updates their chapter, the hook receives the payload.
5. Mutates the Zustand `roomStore`.
6. React triggers a UI re-render instantly reflecting the new chapter or reaction.

---

## 🔌 External Integrations

**Google Books API**
* **Endpoint:** `https://www.googleapis.com/books/v1/volumes`
* **Behavior:** Search queries pass through dynamic URI encoding; fetching is routed through a debounced React hook. Currently runs without an API key to allow anonymous fetching.

---

## 🚨 Known Issues & Limitations

> [!WARNING]
> **Google Books API Rate Limiting (429)**
> **Impact:** High. Unauthenticated traffic from the same IP block rapidly triggers Google's quota limits.
> **Mitigation:** Implemented a mock fallback payload intercept in `googleBooks.ts` that renders static, hardcoded books if a 429 status is thrown.

> [!NOTE]
> **TypeScript Supabase Join Parsing**
> **Impact:** Low. Supabase JS client types for Foreign Key joins evaluate deeply nested profiles as arrays rather than discrete objects natively.
> **Mitigation:** Bypassed with `as unknown as Type` cast in `profile.tsx` to satisfy compiler warnings.

> [!TIP]
> **Race Condition on User Creation**
> **Status:** Resolved. Previously, attempting client-side insert into `public.users` during signUp violated RLS if email confirmations delayed the JWT token creation.
> **Mitigation:** Shifted responsibility entirely to a Postgres Database Trigger (`handle_new_user`) operating securely beyond RLS.

> [!TIP]
> **Expo Router Unmounted Renders**
> **Status:** Resolved. `router.replace` triggered infinite looping if navigation tree wasn't mounted during auth resolution.
> **Mitigation:** Guarded by `useSegments` and `useRootNavigationState` hooks in `_layout.tsx`.
