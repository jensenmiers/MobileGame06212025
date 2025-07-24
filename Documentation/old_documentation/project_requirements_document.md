# Project Requirements Document (PRD)

## 1. Project Overview

Bracket Master Challenge is a mobile‐first web application that lets video‐game tournament spectators predict the top 8 finishers before the real results are in. Users sign up using social OAuth (Google, Apple, Discord), then choose their bracket picks by dragging or tapping participants from an “All Players” list into eight ordered slots. Once the eight predictions are in place, they submit their bracket and are later scored against real tournament outcomes to see how they stack up against other fans.

We’re building this as a web app (rather than native iOS/Android) to maximize accessibility and lower friction—anyone with a mobile browser can join without installing an app. Success means:\
• Users can register and log in securely in under 30 seconds.\
• Participants can make and submit full top‐8 predictions in under one minute.\
• Once real results are entered by an admin, user scores and a live leaderboard appear without errors.\
• Response times remain under 200 ms for core interactions on 4G networks.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (MVP)**

*   Social login (Google, Apple, Discord) with Supabase Auth
*   Mobile-responsive dark-themed UI with glassmorphism and #55ca0e accents
*   Landing page with tournament info and “Start Prediction” CTA
*   Two-column prediction interface (All Players vs. Your Predictions)
*   Drag/tap selection, slot highlighting, undo (trash/X) per slot
*   “Submit Prediction” button enabled only when all 8 slots filled
*   Confirmation screen on successful submission
*   Admin interface (simplified) for entering real results and cutoff enforcement
*   Automatic scoring logic & live leaderboard
*   Hosting on Vercel, domain fullcombo.gg via GoDaddy pointing

**Out-of-Scope (Phase 2+)**

*   User profile/history pages with past brackets and aggregate stats
*   Concurrent multi-tournament management or archiving
*   CSV upload or bulk admin tools for participant list
*   Advanced accessibility (WCAG Level AA) or multiple languages
*   Push notifications or email alerts
*   Paid features, in-app purchases

## 3. User Flow

A new visitor opens the app on a mobile browser and lands on a full-screen, dark-themed sign-up page branded “Bracket Master Challenge.” They tap one of the social login buttons, complete the OAuth flow (granting basic email and username only), see a brief privacy-policy notice, and are quickly redirected to the main landing page.

On the landing page, they read a concise tournament description and rules, then tap “Start Prediction.” The screen splits into two scrollable columns: left shows 16 placeholder players (“Player 1”–“Player 16”), right shows eight empty slots labeled 1st–8th. They tap a player, then tap the desired slot; that player animates into place and the next pick is prompted. After filling all eight, the “Submit Prediction” button glows and becomes active. The user taps submit, sees a loading animation, and arrives at a success screen confirming their bracket. They can then view the live leaderboard or return home.

## 4. Core Features

*   **Authentication & Onboarding**\
    • Social OAuth (Google, Apple, Discord) via Supabase Auth\
    • Privacy-policy notice\
    • Mobile-first, dark theme with glassmorphism

*   **Main Landing Page**\
    • Tournament overview, rules, and “Start Prediction” CTA\
    • Auth status indicator with logout

*   **Prediction Interface**\
    • Two-column layout: “All Players” vs. “Your Predictions”\
    • Tap-to-select players and assign to ordered slots (1–8)\
    • Highlight target slot on player tap\
    • Undo (trash/X) per slot to return player to list\
    • Disabled “Submit” until slots are full; animated when active

*   **Submission & Confirmation**\
    • Secure save of predictions with timestamp\
    • Cutoff enforcement: lock interface after deadline\
    • Success screen with recap and navigation

*   **Admin Results Entry & Scoring**\
    • Admin UI to enter real tournament placements (1–8)\
    • Automated scoring based on point structure:

    *   1 pt per correct top 8
    *   4 pt per correct top 4
    *   8 pt third place, 16 pt second, 32 pt champion\
        • Live leaderboard display sorted by total points

## 5. Tech Stack & Tools

*   **Frontend**: React + Next.js 14 + TypeScript + Tailwind CSS
*   **UI Library**: shadcn/ui (optional)
*   **Design System**: Inter font, dark theme, #55ca0e accents, glassmorphism
*   **Backend & Auth**: Supabase (PostgreSQL + Auth)
*   **Hosting & CI/CD**: Vercel (serverless functions, auto-scaling)
*   **Domain**: fullcombo.gg via GoDaddy DNS
*   **IDEs & AI Tools**: Windsurf, Cursor

## 6. Non-Functional Requirements

*   **Performance**:\
    • Initial page load ≤ 1.5 s on 4G; subsequent interactions ≤ 200 ms
*   **Security & Privacy**:\
    • OAuth tokens stored securely; HTTPS everywhere\
    • Minimal data collection; clear privacy notice
*   **Usability**:\
    • Fully responsive portrait view; landscape adapts without layout break\
    • Touch-friendly targets ≥ 44 × 44 px
*   **Scalability**:\
    • Handle up to 10 000 concurrent users in peak periods

## 7. Constraints & Assumptions

*   Single tournament at a time for MVP.
*   Participant list managed via manual database edits.
*   Users limited to one bracket submission per tournament; edits allowed until cutoff.
*   Native English speakers only; no localization initially.
*   No formal WCAG compliance beyond basic color contrast.
*   Reliance on Supabase availability and Vercel region coverage.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits**: Supabase free tier may throttle under high load.\
    *Mitigation*: Monitor usage, upgrade tier before peak.
*   **Mobile Browser Quirks**: Glassmorphism/transparency can impact performance on older devices.\
    *Mitigation*: Provide fallback solid backgrounds if frame rate drops.
*   **Cutoff Sync**: Ensuring client and server clocks align for submission lockout.\
    *Mitigation*: Use server‐timestamp checks; display “closed” state based on server response.
*   **OAuth Edge Cases**: Users with disabled pop-ups or strict privacy settings may block flows.\
    *Mitigation*: Provide fallback email/password login as a future update.

This document defines all core functionality, flows, and boundaries for the Bracket Master Challenge MVP. It should serve as the sole reference for detailed technical designs, implementation plans, and coding guidelines.
