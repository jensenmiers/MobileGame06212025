# Implementation plan

## Phase 1: Environment Setup

1. **Prevalidation**: In the project root, run `ls package.json .git` to check if a project is already initialized. If yes, skip Step 2–4 (Project Goal).
2. **Install Node.js v20.2.1**: If not installed, download and install from https://nodejs.org/download/release/v20.2.1/ (Tech Stack: Core Tools).
3. **Validation**: Run `node -v` and confirm output is `v20.2.1` (Tech Stack: Core Tools).
4. **Initialize Next.js 14 Project**: Run `npx create-next-app@latest bracket-master-challenge --typescript --use-npm --import-map` and select Next.js v14 when prompted (Tech Stack: Frontend).
5. **Install Tailwind CSS v3**: In `/bracket-master-challenge`, run:
   ```bash
   npm install -D tailwindcss@3 postcss@8 autoprefixer@10
   npx tailwindcss init -p
   ```
   (Tech Stack: Frontend)
6. **Configure Tailwind for Dark Mode**: Edit `tailwind.config.js` at project root to enable `darkMode: 'class'` and add paths `['./pages/**/*.{js,ts,jsx,tsx}','./components/**/*.{js,ts,jsx,tsx}']` (UI/UX Details).
7. **Add Inter Font**: In `/pages/_app.tsx`, import:
   ```js
   import '@fontsource/inter/variable.css'
   ```
   Then wrap `<Component {...pageProps} />` with `<div className="font-inter">` (UI/UX Details).
8. **Install Shadcn UI**: Run:
   ```bash
   npx shadcn-ui@latest add button input card dialog
   ```
   (Tech Stack: Frontend)
9. **Create .cursor Directory & cursor_metrics.md**: In project root, create `.cursor/` and an empty `cursor_metrics.md`. Reference `cursor_project_rules.mdc` for metrics guidelines (IDEs: Cursor).
10. **Create & Configure `.cursor/mcp.json`**:
    - Add `.cursor/mcp.json` to `.gitignore` (DO NOT SKIP THIS STEP).
    - Copy the following into `.cursor/mcp.json`:
      ```json
      // macOS
      { "mcpServers": { "supabase": { "command": "npx", "args": ["-y","@modelcontextprotocol/server-postgres","<connection-string>"] } }}

      // Windows
      { "mcpServers": { "supabase": { "command": "cmd", "args": ["/c","npx","-y","@modelcontextprotocol/server-postgres","`<connection-string>`"] } }}
      ```
      (Tech Stack: Backend)
11. **Display Supabase MCP Link**: Show this link for the user to get the connection string: https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp (Tech Stack: Backend).
12. **Windsurf MCP Configuration**: In Windsurf Cascade assistant, tap hammer (MCP) → **Configure** → add same JSON config as above → **Save** → **Refresh** (IDEs: Windsurf).
13. **Validation**: In both Cursor and Windsurf, navigate to **Settings/MCP** and verify the Supabase server shows a green **Active** status (Tech Stack: Backend).

## Phase 2: Frontend Development

14. **Create Component Structure**: Under `/components`, create folders `Auth`, `Prediction`, `Leaderboard`, `Admin` (App Flow).
15. **Landing Page (`/pages/index.tsx`)**: Scaffold a dark-themed hero section with title **Bracket Master Challenge** and a **Start Prediction** CTA. Use `Card` from Shadcn UI and Tailwind classes (`bg-gray-900 text-white`) (Key Features: Main Landing Page).
16. **Implement Social Login Buttons**: In `/components/Auth/SocialLogin.tsx`, add three buttons (Gmail, Apple, Discord). On click call Supabase Auth `signIn` with providers `google`, `apple`, `discord` (Key Features: Sign-Up/Landing Page).
17. **Validation**: Run `npm run dev`, click each login button, and verify Supabase redirects correctly (Key Features: Sign-Up/Landing Page).
18. **Prediction Page (`/pages/prediction.tsx`)**: Create two-column layout using Tailwind grid (`grid-cols-2 gap-4`) (Key Features: Prediction Interface).
19. **All Players List Component**: In `/components/Prediction/AllPlayers.tsx`, render a scrollable list of 16 placeholder players styled with glassmorphism (rounded `bg-white/10 backdrop-blur`) (Key Features: Prediction Interface).
20. **Your Predictions Component**: In `/components/Prediction/Slots.tsx`, render 8 slots labeled `1st`–`8th` with click handlers to assign selected player (Key Features: Prediction Interface).
21. **Interactivity**: Use React state in `/pages/prediction.tsx` to track `selectedPlayer` and `predictions: string[]`. On player click highlight `selectedPlayer`, then click slot to fill (Key Features: Prediction Interface).
22. **Clear & Submit Logic**: Add a **Remove** icon in each filled slot to clear. Enable **Submit Prediction** button only when `predictions.length === 8` (Key Features: Prediction Interface).
23. **Validation**: In browser, select 8 players, verify button enables, then click to open confirmation modal (`Dialog` from Shadcn UI) (Key Features: Complete Prediction Confirmation).
24. **Leaderboard Page (`/pages/leaderboard.tsx`)**: Fetch top scores via Supabase query and display in a ranked list (`<ol>`), showing username and points (Key Features: Leaderboard).
25. **Validation**: Use sample data in Supabase dashboard, reload page, and verify correct ordering (Key Features: Leaderboard).
26. **Admin Page (`/pages/admin.tsx`)**: Build a form with 8 dropdowns (select player for each position) and a **Submit Results** button. Disable if `Date.now() > cutoffTimestamp` (Admin Features).
27. **Validation**: Submit form, verify data appears in the `results` table (Admin Features).

## Phase 3: Backend Development (Supabase)

28. **PostgreSQL Schema Definition**: Define tables:
   ```sql
   CREATE TABLE users (
     id uuid PRIMARY KEY,
     email text UNIQUE,
     updated_at timestamp
   );
   CREATE TABLE tournaments (
     id uuid PRIMARY KEY,
     name text,
     cutoff timestamp,
     created_at timestamp
   );
   CREATE TABLE predictions (
     id uuid PRIMARY KEY,
     user_id uuid REFERENCES users(id),
     tournament_id uuid REFERENCES tournaments(id),
     slot integer CHECK (slot BETWEEN 1 AND 8),
     player text,
     created_at timestamp
   );
   CREATE UNIQUE INDEX one_prediction_per_user ON predictions(user_id, tournament_id, slot);
   CREATE TABLE results (
     id uuid PRIMARY KEY,
     tournament_id uuid REFERENCES tournaments(id),
     slot integer CHECK (slot BETWEEN 1 AND 8),
     player text,
     created_at timestamp
   );
   ```
   (Tech Stack: Backend)
29. **Use MCP to Apply Schema**: In Cursor or Windsurf, open SQL editor, paste above DDL, and run. (Tech Stack: Backend)
30. **Validation**: In Supabase Dashboard or via `psql`, run `
   \d predictions
   \d results
   ` and confirm tables and constraints exist (Tech Stack: Backend).
31. **Configure Auth Providers**: In Supabase Dashboard → Auth → Providers, enable Google, Apple, and Discord with appropriate client IDs and secrets (Tech Stack: Backend).
32. **Scoring Function (RPC)**: Create a Postgres function `calculate_score(user_id, tournament_id)` that computes points based on slot matches (use CASE statements for weighting 1–32) (Scoring System).
33. **Validation**: Call `SELECT calculate_score('<some-user>', '<tournament>')` in SQL editor and verify correct total (Scoring System).

## Phase 4: Integration

34. **Supabase Client Setup**: Create `/lib/supabase.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```
   (Tech Stack: Backend)
35. **Protect Routes**: Wrap pages in a session check using `supabase.auth.getSession()` and redirect to `/` if not logged in (Key Features: Security).
36. **Submit Prediction**: In `/pages/prediction.tsx`, call `supabase.from('predictions').upsert(...)` with user’s 8 slots (App Flow: Step 3).
37. **Fetch Leaderboard**: In `/pages/leaderboard.tsx`, call `supabase.rpc('calculate_score', { tournament_id })` and order by score desc (App Flow: Step 5).
38. **Submit Results (Admin)**: In `/pages/admin.tsx`, call `supabase.from('results').upsert(...)` then re-run scoring RPC for all users (Admin Features).
39. **One Submission Enforcement**: In `/lib/supabase.ts`, add DB constraint on `(user_id, tournament_id)` and catch conflicts, showing a toast error if duplicate (Important Considerations).
40. **Validation**: Perform end-to-end: login → make/edit prediction → view leaderboard with updated scores → admin enters real results → leaderboard recalculates.

## Phase 5: Deployment

41. **Connect to Vercel**: In project root, run `vercel init` and follow prompts to link or create `Bracket Master Challenge` project (Tech Stack: Hosting).
42. **Set Environment Variables**: In Vercel Dashboard, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for server-side RPC (Tech Stack: Hosting).
43. **Add Domain fullcombo.gg**: In Vercel → Domains → Add → `fullcombo.gg` → follow DNS instructions (Domain: GoDaddy).
44. **Configure GoDaddy DNS**: In GoDaddy, create CNAME record pointing `www` to `cname.vercel-dns.com` and an A record for root `@` to Vercel’s IP (Domain: GoDaddy).
45. **Enable HTTPS**: In Vercel, ensure automatic SSL is active for `fullcombo.gg` (Tech Stack: Hosting).
46. **Validation**: Visit https://fullcombo.gg and confirm the landing page loads with a valid SSL certificate.
47. **Continuous Deployment**: Confirm that pushes to `main` trigger new builds in Vercel and that PR preview URLs are generated (Tech Stack: CI/CD).

---

*Total Steps: 47*