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

## Session Log

### 2026-02-24: Streak Shield (스트릭 보호권) 구현 완료

**구현 내용:**
- 프리미엄 사용자에게 월 2회 스트릭 보호권 제공 (STREAK_SHIELD_MONTHLY_LIMIT = 2)
- 놓친 날을 보호하면 스트릭 유지 (보호된 날은 스트릭 일수에 포함되지 않음)
- 무료 사용자에게는 업셀 프롬프트 → Paywall 이동 (trigger=streak_shield)
- 보호권 소진 시 프리미엄 사용자에게 프롬프트 미표시

**수정 파일 (7개):**
- `src/domain/models.ts` — StreakShieldEntry 타입, streakShields 필드, STREAK_SHIELD_MONTHLY_LIMIT 상수
- `src/domain/progress.ts` — getRoutineCurrentStreak에 shieldedDates 파라미터, collectNewBadgesAfterCheckin에 shieldedDates 전달
- `src/state/selectors.ts` — getShieldedDatesForRoutine, getRoutineStreak shields 전달, detectShieldableBreak 함수
- `src/state/AppStateProvider.tsx` — applyStreakShield, getStreakShieldsRemaining, getStreakShieldsUsedThisMonth, context 노출
- `src/components/StreakShieldPrompt.tsx` — 신규 프롬프트 컴포넌트 (프리미엄/무료 분기)
- `src/pages/HomePage.tsx` — 감지 로직 + 프롬프트 연결 + 세션 내 1회 표시
- `src/pages/PaywallPage.tsx` — streak_shield 트리거, 보호권 피처 설명 추가

**코드 검증 중 발견/수정한 버그:**
1. `useStreakShield` → `applyStreakShield`로 리네임 (ESLint react-hooks/rules-of-hooks 위반)
2. 보호권 소진 후에도 프리미엄 사용자에게 프롬프트가 표시되는 버그 수정
3. 월별 사용량 카운트가 shielded date 기준이 아닌 usedAt 기준으로 수정

**커밋:**
- `0669bb3` feat: add streak shield and premium UX enhancements
- `4230b54` chore: gitignore bkit/pdca tooling files and remove from tracking

**미완료:**
- 브라우저에서 직접 E2E 테스트 (코드 레벨 검증은 완료)
- 무료 사용자 시나리오 브라우저 확인 필요
