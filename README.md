# Bracket Challenge

This is a [Next.js](https://nextjs.org) tournament prediction app that allows users to predict top-4 finishers in fighting game tournaments.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Backend Migration Flag
# Set to 'true' to use new Next.js backend APIs instead of direct Supabase calls
# Set to 'false' to use existing Supabase functions (default)
NEXT_PUBLIC_USE_BACKEND_API=false

# Start.gg API Configuration
# Used for syncing tournament participants from start.gg tournaments
START_GG_API_KEY=your_startgg_api_key_here
```

## Backend Architecture Migration

We are currently migrating from Supabase database functions to Next.js API routes for better maintainability and control.

### Current Status:
- ✅ **Phase 1**: Next.js API routes created (`/api/tournaments/*`)
- ✅ **Phase 1**: Backend service layer implemented
- ✅ **Phase 1**: Feature flag system for gradual migration
- 🚧 **Phase 2**: Scoring algorithm migration (in progress)
- 🚧 **Phase 3**: Real-time leaderboard implementation (planned)
- 🚧 **Phase 4**: Supabase function cleanup (planned)

### Testing the Migration:
1. Set `NEXT_PUBLIC_USE_BACKEND_API=true` in your `.env.local`
2. Check browser console for "🚀 Using Backend API" messages
3. If APIs fail, the app automatically falls back to Supabase functions

### API Routes Available:
- `GET/POST /api/tournaments` - Tournament CRUD operations
- `GET/PUT/DELETE /api/tournaments/[id]` - Individual tournament operations
- `GET/POST /api/tournaments/[id]/participants` - Tournament participants
- `GET/POST /api/tournaments/[id]/predictions` - User predictions
- `GET/POST/DELETE /api/tournaments/[id]/results` - Tournament results
- `GET /api/tournaments/[id]/leaderboard` - Live leaderboard

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
