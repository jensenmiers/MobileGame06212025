---
description: Apply these rules when creating the project
globs: 
alwaysApply: true
---
## Project Overview

*   **Type:** Mobile-first Web Application (Next.js 14 App Router)
*   **Description:** A mobile-first web app called “Bracket Master Challenge” that allows tournament spectators to predict the top 8 finishers.
*   **Primary Goal:** Enable users to make one prediction per tournament, manage edits until cutoff, enforce lockout post-cutoff, calculate scores, and display a live leaderboard.

## Project Structure

### Framework-Specific Routing

*   **Directory Rules:**
    *   `Next.js 14 (App Router)`: Use an `app/` directory with nested route folders and `page.tsx` in each.
    *   Example 1: `app/auth/login/page.tsx` → Authentication flow with server actions.
    *   Example 2: `app/predictions/page.tsx` → Prediction interface.
    *   Example 3: `app/admin/page.tsx` → Admin results entry & leaderboard.

### Core Directories

*   **Versioned Structure:**
    *   `app/api`: Next.js 14 API routes with Route Handlers for submissions, scoring, cutoff checks.
    *   `app/models`: Supabase client and database utilities (`lib/supabaseClient.ts`).
    *   `app/(protected)`: Middleware-protected group for authenticated routes (predictions, admin).
    *   `styles`: Tailwind CSS and global styles (`globals.css`, `tailwind.config.js`).

### Key Files

*   **Stack-Versioned Patterns:**
    *   `app/layout.tsx`: Next.js 14 root layout with glassmorphism and dark theme.
    *   `app/globals.css`: Global Tailwind imports and custom CSS.
    *   `tailwind.config.js`: Tailwind 3 JIT config pointing to `app/**/*.{js,ts,tsx}`.
    *   `next.config.js`: Next.js 14 config (Edge runtime enabled).
    *   `lib/supabaseClient.ts`: Supabase JS v2 client setup for Edge Functions.

## Tech Stack Rules

*   **Version Enforcement:**
    *   `next@14`: App Router required; no `pages/` directory; use React 18 server components and server actions.
    *   `react@18`: Use hooks and concurrent features; no class components.
    *   `typescript@4.x`: `strict` mode on; avoid `any`.
    *   `tailwindcss@3`: Enable JIT; specify `content: ["app/**/*.{ts,tsx}"]`.
    *   `@shadcn/ui@latest`: Optional for UI primitives; customize via `tailwind.config.js`.
    *   `@supabase/-js@2`: Use Edge Runtime; do not expose service_role key in client.
    *   `vercel@latest`: Deploy all API routes as Edge Functions; leverage automatic scaling.

## PRD Compliance

*   **Non-Negotiable:**
    *   "One submission per tournament, edits allowed until the cutoff time, and show a locked-out feature after submissions are closed.": Enforce via API handler at `app/api/submissions/route.ts`.
    *   "Point Structure: 1 pt per correct top 8, 4 pt per correct top 4, 8 pt third place, 16 pt second, 32 pt champion.": Implement exactly in `app/api/scoring/route.ts`.

## App Flow Integration

*   **Stack-Aligned Flow:**
    *   Next.js 14 Auth Flow → `app/auth/login/page.tsx` uses server actions with  Auth.
    *   Prediction Flow → `app/predictions/page.tsx` as a client component, two-column layout, tap-to-select slots.
    *   Submission Flow → `app/predictions/submit/page.tsx` calls `app/api/submissions/route.ts`.
    *   Admin Flow → `app/admin/page.tsx` calls `app/api/results/route.ts` and triggers `app/api/scoring/route.ts`.
    *   Leaderboard → `app/leaderboard/page.tsx` fetches scored results via server component.

## Best Practices

*   React
    *   Use functional components and hooks exclusively.
    *   Keep components small and reusable; split into presentational and container.
    *   Leverage React Server Components for data-heavy pages.

*   Next.js 14
    *   Enforce `app/` directory structure; no `pages/`.
    *   Use nested layouts to share UI (e.g., glassmorphism wrappers).
    *   Apply Edge Runtime for API routes where low-latency is critical.

*   TypeScript
    *   Enable `strict` and `noImplicitAny`; use `zod` or `io-ts` for input validation.
    *   Define clear interfaces for API payloads and Supabase records.
    *   Use `Typed Supabase Client` for type-safe queries.

*   Tailwind CSS
    *   Configure JIT mode and purge unused classes via `content` array.
    *   Extract common styles into `@apply` utilities for glassmorphism.
    *   Use Prose and container plugins for responsive mobile-first design.

*   Supabase
    *   Use Row Level Security (RLS) policies for submission ownership and cutoff enforcement.
    *   Store cutoff timestamp in a config table and fetch in middleware.
    *   Use Supabase Realtime for live leaderboard updates if needed.

*   Vercel
    *   Leverage Preview Deployments for every PR.
    *   Use Environment Variables for Supabase keys; never commit secrets.
    *   Enable Analytics to monitor edge function performance.

## Start.gg API Integration Rules

### Efficient Participant Filtering

*   **Large Tournament Optimization:** For tournaments with 1000+ entrants, use set-based filtering instead of participant queries.
*   **Set State Filtering:** Query only sets with `state: [1, 2]` (waiting/in-progress) to get active participants.
*   **Phase-Based Strategy:** Use phase names to determine query strategy:
    *   Early rounds ("Round 1", "Round 2"): Use traditional `entrants` query
    *   Later rounds ("Top 24", "Top 8"): Use `sets(query: {state: [1, 2]})` filtering
*   **Performance Benefits:** 99%+ data reduction for large tournaments (e.g., EVO 2025: 4,230 → 8 participants at Top 8).

### API Field Understanding

*   **Set State Values:**
    *   `state: 1` = Waiting (not started)
    *   `state: 2` = In Progress (currently being played)
    *   `state: 3` = Completed (finished)
*   **Standing Placement Values:**
    *   `placement: null` = Still active in tournament
    *   `placement: 1` = Winner (still active)
    *   `placement: 2+` = Eliminated (final placement)
*   **Phase Field Options:** "Round 1", "Round 2", "Round 3", "Round 4", "Top 24", "Top 8", "Pools", "Bracket", "Winners", "Losers", "Finals"

### Implementation Guidelines

*   **Sync-Entrants API:** Modify to use hybrid approach based on tournament phase.
*   **Fallback Strategy:** Try set-based filtering first, fall back to traditional query if API timeout.
*   **Caching:** Cache participant lists for 5-10 minutes to reduce API calls.
*   **Progressive Loading:** Load Top 8 participants first, additional phases as needed.

## Rules

*   Derive folder/file patterns directly from `techStackDoc` versions.
*   If Next.js 14 App Router: Enforce `app/` directory with nested route folders.
*   Never mix Pages Router patterns; no `pages/*.tsx` in App Router.

## Rules Metrics

Before starting the project development, create a metrics file in the root of the project called `cursor_metrics.md`.

### Instructions:

*   Each time a cursor rule is used as context, update `cursor_metrics.md`.
*   Use the following format for `cursor_metrics.md`:

    # Rules Metrics

    ## Usage
    The number of times rules is used as context

    *   rule-name.mdc: 5
    *   another-rule.mdc: 2
    *   ...other rules
