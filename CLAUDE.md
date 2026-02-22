# Development Workflow

## Package Manager
- **Always use `pnpm`** - never npm or yarn

## Commands
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- IAP QA check: `pnpm qa:iap:static`

## Development Flow
1. Make changes
2. `pnpm typecheck` - fix type errors first
3. `pnpm lint` - fix lint warnings
4. `pnpm build` - verify production build

## Project Overview
Toss Mini App (apps-in-toss) for daily routine tracking with check-in, badges, and IAP premium features.

## Tech Stack
- React 18 + TypeScript + Vite
- React Router v6 (SPA routing)
- State: React Context (AppStateProvider)
- Storage: localStorage via storageDriver
- Platform: Toss Mini App SDK (window bridge pattern)

## Project Structure
```
src/
  app/           - App shell, routes, deeplink handling
  analytics/     - Toss analytics bridge
  backend/       - Backend contracts and stubs
  components/    - Shared UI components
  config/        - App configuration (env-based)
  domain/        - Domain models and business logic
  integrations/  - Toss SDK bridge (IAP, identity, mini app)
  pages/         - Route page components
  state/         - AppStateProvider (Context-based state)
  storage/       - localStorage persistence layer
  utils/         - Date, ID utilities
```

## Coding Conventions
- Use `type` over `interface` for type definitions (except React component props and context values)
- Use string literal unions instead of `enum`
- Strict TypeScript: `noUnusedLocals`, `noUnusedParameters`, strict mode
- Functional components with hooks only
- State updates via `setState` callback pattern for correctness
- Bridge pattern: always check for function existence before calling SDK methods

## Toss SDK Integration
- All SDK bridges use defensive `typeof fn === "function"` checks
- Multiple candidate roots are tried for bridge discovery (TossMiniApp, tossMiniApp, appsInToss)
- IAP flow: createOrder -> processGrant -> completeGrant -> completeIapProductGrant
- Normalize all SDK responses (field name variants: orderId/orderID/id, sku/productId)

## Domain Rules
- Free users: max 3 active routines (FREE_ROUTINE_LIMIT)
- Premium: unlimited routines, unlocked via trial or IAP purchase
- Checkin dates use KST (Korean Standard Time) date stamps
- Badges: FIRST_CHECKIN, STREAK_3, STREAK_7, STREAK_14, COMEBACK
- Routine archive policy enforced on entitlement changes

## Do NOT
- Use `any` type
- Use `enum` - use string literal union types
- Use class components
- Skip null/undefined checks on SDK bridge calls
- Hardcode date calculations without KST consideration
