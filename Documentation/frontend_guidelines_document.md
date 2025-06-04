# Frontend Guideline Document

This document outlines the frontend setup, design principles, and technologies used in the **Bracket Master Challenge** web app. It is written in everyday language so anyone can understand how the frontend is structured and why.

## 1. Frontend Architecture

### 1.1 Overview
- **Framework:** React with Next.js 14 (App Router).  
- **Language:** TypeScript.  
- **Styling:** Tailwind CSS (with custom theme) + optional Shadcn UI components.  
- **Hosting:** Vercel.  
- **Backend Integration:** Supabase (Auth + PostgreSQL) via supabase-js client.

### 1.2 Folder Structure (Suggested)
```
/app              # Next.js App Router pages and layouts
/components       # Reusable UI components (atoms → molecules → organisms)
/hooks            # Custom React hooks (e.g., useAuth, usePrediction)
/lib              # Supabase client, utility functions
/styles           # Tailwind config, global CSS
/tests            # Unit and integration tests
/public           # Static assets (images, icons)
```

### 1.3 Scalability & Maintainability
- **Modular pages & components:** each feature lives in its own folder.  
- **Code splitting & SSR/ISR:** Next.js handles splitting and pre-rendering for fast loads.  
- **Type safety:** TypeScript catches errors early and makes refactors safer.

## 2. Design Principles

1. **Usability:** clear calls-to-action, consistent icons/buttons, simple two-column mobile layout.  
2. **Accessibility (A11y):** keyboard navigation, ARIA labels on interactive elements, sufficient color contrast.  
3. **Responsiveness:** mobile-first design optimized for portrait view, adapts to landscape/tablet.  
4. **Visual Feedback:** hover/focus/active states on taps and drags.  
5. **Consistency:** same layout patterns and spacing across all screens.

We apply these by building reusable components (buttons, cards) that embed focus styles, ARIA roles, and responsive classes.

## 3. Styling and Theming

### 3.1 CSS Approach
- **Tailwind CSS JIT:** utility-first, small bundle sizes.  
- **No BEM/SMACSS**—we rely on Tailwind’s class names for clarity.  
- **Glassmorphism Utilities:** custom utilities in `tailwind.config.js` for translucent backgrounds and blurs.

### 3.2 Theme Configuration (tailwind.config.js)
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#121212',        // Dark base
        surface: '#1F1F1F',           // Cards, glass panes
        text: '#FFFFFF',              // Primary text
        accent: '#55CA0E',            // Buttons, highlights
        'glass-light': 'rgba(255,255,255,0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        sm: '4px',
        md: '10px',
      },
    },
  },
}
```

### 3.3 Visual Style
- **UI Style:** modern glassmorphism (translucent panels + blur) on a dark background.  
- **Color Palette:**
  • background: #121212  
  • surface: #1F1F1F  
  • text: #FFFFFF  
  • accent: #55CA0E  
  • glass overlay: rgba(255,255,255,0.1)
- **Typography:** Inter family for all headings and body text.  

## 4. Component Structure

### 4.1 Atomic Design Layers
- **Atoms:** Buttons, Inputs, Icons, Text.  
- **Molecules:** Card, Modal, PlayerListItem, PredictionSlot.  
- **Organisms:** Header, Footer, PredictionPanel, LeaderboardTable.

### 4.2 Organization & Reuse
- Each component folder contains:
  - `Component.tsx`  
  - `Component.types.ts`  
  - `Component.module.css` or styled Tailwind file  
  - `Component.test.tsx`

### 4.3 Benefits of Componentization
- **Maintainability:** change style or behavior in one place.  
- **Scalability:** easy to add or remove features without breaking other parts.  
- **Clarity:** well-named components map directly to UI elements.

## 5. State Management

### 5.1 Tools & Patterns
- **Local UI State:** React `useState` and `useReducer`.  
- **Global & Auth State:** React Context (e.g., AuthContext) or use Supabase’s auth listener.  
- **Server State / Caching:** React Query (optional) for data fetching, caching, and revalidation of predictions, leaderboard, and tournament info.

### 5.2 Data Flow
1. On page load, check `supabase.auth.getSession()` to set user context.  
2. Fetch participants list & existing user prediction via React Query.  
3. Local drag/tap interactions update a `prediction` array in component state.  
4. On submit, post to Supabase and invalidates query to refresh leaderboards.

## 6. Routing and Navigation

### 6.1 Next.js App Router
- **Pages/Routes:**
  • `/` – Sign-Up / Landing  
  • `/home` – Main introduction  
  • `/predict` – Prediction interface (protected)  
  • `/confirm` – Confirmation screen  
  • `/leaderboard` – Leaderboard  
  • `/admin` – Admin input (protected by role)

### 6.2 Navigation Patterns
- Use `<Link>` and `useRouter()` for client transitions.  
- Protect routes with a higher-order component or middleware that checks auth & user role.  
- Show loading skeleton while checking session.

## 7. Performance Optimization

- **Code Splitting & Dynamic Imports:** load heavy components (e.g., Admin panel) only when needed.  
- **Image & Asset Optimization:** use Next.js `<Image>` with lazy loading.  
- **Tailwind JIT:** generates only used CSS classes.  
- **Lazy Load:** defer non-critical components (leaderboard visuals) until after first paint.  
- **Pre-fetching:** Next.js prefetches linked pages in view.

These measures keep bundle sizes small and initial render fast on mobile devices.

## 8. Testing and Quality Assurance

### 8.1 Unit & Integration Tests
- **Jest** for unit tests.  
- **React Testing Library** for component behavior and accessibility checks.

### 8.2 End-to-End Tests
- **Cypress** for E2E flows: sign-up, prediction drag/drop, submission, and leaderboard display.

### 8.3 Linting & Formatting
- **ESLint** with TypeScript rules.  
- **Prettier** for consistent formatting.  
- **Commit Hooks:** Husky + lint-staged to run tests and linters before each commit.

### 8.4 Accessibility Audits
- **axe-core** integration in testing to catch color-contrast or missing ARIA issues early.

## 9. Conclusion and Overall Frontend Summary

This guideline covers everything from project architecture to styling, components, state, routing, performance, and testing. We use Next.js 14 and React to build a modular, scalable, and fast mobile-first app. Design principles ensure usability and accessibility; our dark, glassy theme with green accents creates a sleek, consistent experience. Tailwind CSS, TypeScript, and well-structured components make development predictable and safe. Finally, robust testing and CI checks guarantee reliability as we grow the **Bracket Master Challenge** platform.