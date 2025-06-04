# Tech Stack Document

This document explains the technology choices for the Bracket Master Challenge web app in simple, everyday language. It covers how and why each tool, framework, and service was selected to build a fast, secure, and user-friendly mobile web application.

## 1. Frontend Technologies

We chose these technologies to build the user interface you see in the browser:

- **React**
  - A popular JavaScript library for building user interfaces.
  - Enables us to create interactive, component-based pages (e.g., the two-column prediction layout).

- **Next.js (v14)**
  - A framework built on top of React that provides routing, server-side rendering, and optimized performance out of the box.
  - Lets us pre-render pages for faster load times and better mobile performance.

- **TypeScript**
  - A superset of JavaScript that adds strong typing.
  - Helps prevent bugs by checking our code as we write it.

- **Tailwind CSS**
  - A utility-first styling framework that lets us craft custom designs quickly.
  - Powers our dark theme, #55ca0e accent color, and responsive layouts without writing long CSS files.

- **Shadcn UI**
  - A set of prebuilt components for Tailwind CSS.
  - Speeds up development of common UI elements (buttons, modals, form fields) with a consistent look.

- **Design System Elements**
  - **Glassmorphism** for translucent panels and depth effects.
  - **Inter font family** for clean, readable typography across all screens.
  - Mobile-first approach with optimized breakpoints for portrait orientation.

## 2. Backend Technologies

These technologies handle data storage, user authentication, and server-side logic:

- **Supabase**
  - A hosted service built on PostgreSQL (a reliable, open-source database).
  - Manages user data, predictions, tournament records, and real results.
  - Includes built-in **authentication** (OAuth with Google, Apple, Discord) and row-level security.

- **Serverless Functions (via Next.js API routes)**
  - Lightweight, on-demand endpoints for saving predictions, fetching leaderboards, and enforcing cutoff times.
  - Automatically scale to handle more users without manual server management.

- **Database Design**
  - Tables for Users, Predictions, Tournaments, and Results.
  - Timestamps on prediction records to lock out edits after the cutoff time.

## 3. Infrastructure and Deployment

These choices ensure the app is easy to deploy, update, and keep running smoothly:

- **Vercel**
  - Hosting platform built by the makers of Next.js.
  - Provides automatic deployments on every Git push, global CDN for fast content delivery, and serverless function hosting.

- **Version Control and CI/CD**
  - **Git** + **GitHub** for source code management and collaboration.
  - Every code change triggers automated builds and tests in Vercel’s CI pipeline.

- **Domain Management**
  - Domain **fullcombo.gg** registered and managed via GoDaddy.
  - DNS records point to the Vercel deployment for seamless public access.

## 4. Third-Party Integrations

We integrate external services to handle common tasks securely and efficiently:

- **OAuth Providers** (via Supabase Auth):
  - Google, Apple, Discord for one-tap social login.
  - Simplifies signup and leverages each provider’s security.

- **Analytics (optional future integration)**:
  - Tools like Google Analytics or Plausible can be added to track user behavior and improve the experience.

## 5. Security and Performance Considerations

We’ve built in security and speed best practices:

- **Authentication Security**
  - Supabase manages token issuance and secure passwordless flows.
  - OAuth scopes are limited to basic profile details (email, avatar).

- **Data Protection**
  - All API routes run over HTTPS.
  - Database row-level security policies ensure users only read/write their own predictions.

- **Performance Optimizations**
  - Next.js pre-renders pages and lazy-loads JavaScript for faster initial loads.
  - Tailwind’s PurgeCSS removes unused styles, keeping CSS bundles small.
  - Vercel’s global CDN caches static assets close to users.

## 6. Development Tools & IDEs

These tools help our developers write code faster and with fewer mistakes:

- **Windsurf IDE**
  - Modern development environment with built-in AI coding assistants.

- **Cursor IDE**
  - AI-powered code editor offering real-time suggestions and refactorings.

## 7. Conclusion and Overall Tech Stack Summary

Every technology in our stack was chosen to meet the goal of a fast, secure, and low-friction mobile web experience:

- **Frontend**: React + Next.js + TypeScript for interactive, robust UI; Tailwind CSS + Shadcn UI + glassmorphism for a modern, branded look.
- **Backend**: Supabase (PostgreSQL & Auth) and Next.js API routes for reliable data storage and scalable serverless logic.
- **Infrastructure**: Vercel + GitHub for seamless CI/CD and global performance; fullcombo.gg domain for easy access.
- **Integrations**: Social logins via OAuth, ready-to-add analytics for user insights.
- **Security & Performance**: HTTPS, row-level security, optimized builds, and CDN caching.

Together, these choices ensure the Bracket Master Challenge app is maintainable, scalable, and delightful for users predicting their favorite tournament outcomes on mobile devices.