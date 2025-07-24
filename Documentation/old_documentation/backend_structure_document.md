# Backend Structure Document

## 1. Backend Architecture

We use a serverless, microservices-style architecture combining Next.js API routes with Supabase services. This setup keeps things simple, scalable, and easy to maintain.

- **Design Patterns & Frameworks**
  - Next.js API Routes: each endpoint is a small function, auto-scaled by Vercel
  - MVC-inspired approach: API routes handle requests (Controller), service modules contain business logic (Model), and responses are formatted uniformly (View)
  - Repository pattern for database access via Supabase client
  - Environment-based configuration: dev, staging, production

- **Scalability**
  - Serverless functions on Vercel auto-scale with traffic
  - Supabase managed Postgres scales vertically & horizontally for read replicas
  - Edge caching of static content & responses for fast distribution

- **Maintainability**
  - Clear folder structure in `pages/api` for endpoints
  - Shared utility modules (authentication, error handling, scoring algorithm)
  - TypeScript types across frontend & backend for consistency

- **Performance**
  - Minimal cold-start with Vercel Edge Functions
  - CDN via Vercel Edge Network for static assets
  - Client-side caching with SWR for API data

---

## 2. Database Management

- **Database Technology**
  - PostgreSQL (hosted & managed by Supabase) – relational SQL database
  - Supabase Auth for user management (behind the scenes uses Postgres & JWT)

- **Data Structure & Access**
  - Tables for core entities: users, tournaments, participants, predictions, results
  - JSON columns for ordered lists (predictions, results)
  - Row-Level Security (RLS) policies enforce that users can only read/write their own predictions
  - Backups & point-in-time recovery managed by Supabase (daily snapshots)
  - Connection pooling & prepared statements for efficient queries

- **Data Management Practices**
  - Migrations tracked via SQL scripts in repository
  - Automated tests for schema changes and data integrity
  - Monitoring of slow queries via Supabase Dashboard

---

## 3. Database Schema

### Human-Readable Schema

- **users**
  - `id`: unique user ID (UUID)
  - `email`: user email address
  - `full_name`: display name
  - `avatar_url`: social login avatar link
  - `created_at`: timestamp when account was created

- **tournaments**
  - `id`: unique tournament ID
  - `name`: tournament name (e.g., “EVO 2024”)
  - `start_time`: tournament start timestamp
  - `cutoff_time`: prediction lock timestamp
  - `created_at`: record creation timestamp

- **participants**
  - `id`: unique participant ID
  - `tournament_id`: foreign key to tournaments
  - `name`: player name
  - `seed`: optional seed or ranking
  - `created_at`: record creation timestamp

- **predictions**
  - `id`: unique prediction ID
  - `user_id`: foreign key to users
  - `tournament_id`: foreign key to tournaments
  - `selections`: ordered list (JSON array) of 8 participant IDs
  - `submitted_at`: timestamp of submission

- **results**
  - `id`: unique result entry ID
  - `tournament_id`: foreign key to tournaments
  - `outcome`: ordered list (JSON array) of final 8 participant IDs
  - `entered_at`: timestamp when results were recorded

### SQL Schema (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  cutoff_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  selections JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tournament_id)
);

-- Results
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE,
  outcome JSONB NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard View (optional)
CREATE VIEW leaderboard AS
SELECT
  p.user_id,
  SUM(
    -- scoring logic via SQL functions or CASE statements
    1 /* placeholder: implement scoring logic here */
  ) AS total_points
FROM predictions p
JOIN results r ON p.tournament_id = r.tournament_id
GROUP BY p.user_id;
``` 

---

## 4. API Design and Endpoints

We follow a RESTful style using Next.js API routes. JSON is the request and response format.

- **Authentication**
  - Handled on the frontend via Supabase Auth client
  - JWT passed in `Authorization: Bearer <token>` header

- **Key Endpoints**

| Method | Path                      | Purpose                                           |
|--------|---------------------------|---------------------------------------------------|
| GET    | /api/tournaments          | List all active tournaments                       |
| GET    | /api/tournaments/[id]     | Details of a specific tournament                  |
| GET    | /api/participants?tournId | List participants for a tournament                |
| GET    | /api/predictions          | Fetch logged-in user’s prediction for a tournament|
| POST   | /api/predictions          | Submit or update prediction (locks after cutoff)  |
| GET    | /api/results              | Fetch official results for a tournament           |
| POST   | /api/results              | **Admin only**: enter tournament results          |
| GET    | /api/leaderboard          | Fetch leaderboard for a tournament                |

- **Error Handling**
  - Consistent JSON error format: `{ error: { code, message } }`
  - HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error

---

## 5. Hosting Solutions

- **Vercel**
  - Hosts Next.js frontend and serverless API routes
  - Automatic CI/CD: every push triggers build & deploy
  - Global CDN / Edge Network for low-latency delivery
  - Custom domain (`fullcombo.gg`) via GoDaddy integration

- **Supabase**
  - Managed Postgres database and Auth service
  - Auto-scaling for database workload
  - Backups & monitoring included

- **Benefits**
  - High reliability: 99.9% SLA on both Vercel & Supabase
  - Scalability: serverless functions & managed DB
  - Cost-effectiveness: pay-as-you-go plans

---

## 6. Infrastructure Components

- **Load Balancer & Edge Network (Vercel)**
  - Distributes requests to nearest edge location
  - Handles SSL termination for HTTPS

- **CDN**
  - Caches static assets (JS bundles, images)
  - Configurable cache headers for API responses

- **Caching Mechanisms**
  - Client-side caching: SWR hooks in React
  - Edge caching rules for public, cacheable API endpoints

- **CI/CD Pipeline**
  - Git-based workflows on Vercel
  - Automatic tests & linting before deployment

- **Environment Management**
  - Vercel environment variables for production & staging secrets

---

## 7. Security Measures

- **Authentication & Authorization**
  - Supabase Auth with social providers (Google, Apple, Discord)
  - JWT tokens for API calls
  - Row-Level Security (RLS) policies in Postgres

- **Data Encryption**
  - HTTPS for all traffic (Let’s Encrypt via Vercel)
  - Encryption at rest & in transit in Supabase

- **API Protection**
  - CORS policy scoped to frontend domain
  - Rate limiting (configurable via Vercel Edge)
  - Input validation & sanitization on API routes

- **Compliance & Best Practices**
  - GDPR-ready: users can request data export or deletion via Supabase
  - Secrets stored in Vercel environment variables, not in code

---

## 8. Monitoring and Maintenance

- **Performance Monitoring**
  - Vercel Analytics: build times, runtime logs, invocation metrics
  - Supabase Dashboard: database health, slow query logs, connections
  - Sentry (optional): error tracking in serverless functions

- **Alerts & Notifications**
  - Email/SMS alerts on downtime or high error rates
  - Database usage thresholds trigger notifications

- **Maintenance Strategy**
  - Automated daily backups & point-in-time recovery
  - Monthly dependency updates & security audits
  - Scheduled deployment windows for major upgrades

---

## 9. Conclusion and Overall Backend Summary

This backend setup combines the ease of serverless functions with the power of a managed Postgres database. It aligns with the project goals by:

- Providing a fast, mobile-first experience via Vercel Edge and client-side caching
- Ensuring data integrity and security with Supabase Auth, RLS, and HTTPS
- Supporting growth through auto-scaling serverless endpoints and managed DB resources
- Offering clear operational visibility via logging, analytics, and backup strategies

Every component—from API design to infrastructure—works together to deliver a reliable, maintainable platform for users to predict and track tournament outcomes. Should future features (user profiles, multiple concurrent tournaments, notifications) be needed, this architecture can be extended without major rewrites.