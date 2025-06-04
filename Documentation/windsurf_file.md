# .windsurfrules

## Project Overview
- **Type:** Mobile-first Predictive Tournament Web App
- **Description:** A dark-themed glassmorphism UI web application for video game tournament spectators to predict top 8 finishers.
- **Primary Goal:** To create a mobile-first web application where video game tournament spectators can predict the top 8 finishers.

## Project Structure
### Framework-Specific Routing
- **Directory Rules:**
  - Next.js 14 (App Router): Use `app/` directory with nested folders for each route (e.g., `app/auth/login/page.tsx`, `app/prediction/page.tsx`).

### Core Directories
- **Versioned Structure:**
  - app/api: Next.js 14 API routes with Route Handlers connecting to Supabase.
  - app/components: Shared React components (Tailwind + Shadcn UI patterns).
  - styles: Global Tailwind CSS styles and custom Inter font imports.

### Key Files
- **Stack-Versioned Patterns:**
  - app/layout.tsx: Next.js 14 root layout configuring dark theme and Inter font.
  - app/globals.css: Tailwind CSS globals, dark mode utilities, and accent color `#55ca0e`.
  - tailwind.config.ts: Tailwind CSS config with custom colors, mobile-first breakpoints, and glassmorphism tokens.

## Tech Stack Rules
- **Version Enforcement:**
  - next@14: App Router mandatory, no `pages/` folder, utilize React Server Components.
  - react@18: Enforce concurrent rendering and hooks best practices.
  - typescript@4.x: Strict mode enabled, no `any` defaults.
  - tailwindcss@^3.0: Utility-first styling for mobile-first design.
  - @supabase/supabase-js@2: Use server actions and real-time subscriptions.
  - vercel@latest: Vercel platform deployment with built-in optimizations.

## PRD Compliance
- **Non-Negotiable:**
  - "Mobile-first design, optimized for portrait orientation": Must use responsive Tailwind utility classes prioritizing small screens.
  - "Dark theme with `#55ca0e` accents and glassmorphism UI": Theme and component styles locked to dark mode design tokens.
  - "Each user is limited to one submission per tournament": API endpoints must enforce single submission via Supabase row-level checks.
  - "Users can edit/re-submit predictions before the cutoff time": Prediction services must allow updates until lockout timestamp.

## App Flow Integration
- **Stack-Aligned Flow:**
  - Next.js 14 Auth Flow → `app/auth/login/page.tsx` uses Supabase server actions for social login.
  - Next.js 14 Main Landing Page → `app/page.tsx` displays tournament intro and "Start Prediction" button, shows auth status.
  - Next.js 14 Prediction Interface → `app/prediction/page.tsx` with `PredictionList` and `PredictionSlots` components, disabled submit until complete.
  - Next.js 14 Confirmation → `app/prediction/confirmation/page.tsx` shows submission success and navigation links.
  - Next.js 14 Admin Interface → `app/admin/page.tsx` for entering results, scoring logic, and submission window lockout.
  - Next.js 14 Leaderboard → `app/leaderboard/page.tsx` displays real-time user rankings with the defined point system.
