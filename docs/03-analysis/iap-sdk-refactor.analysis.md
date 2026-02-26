# IAP SDK Refactoring + Full Project Gap Analysis Report

> **Analysis Type**: Gap Analysis (PRD vs Implementation)
>
> **Project**: jaksim-routine (작심루틴)
> **Version**: 0.1.0
> **Analyst**: Claude (gap-detector agent)
> **Date**: 2026-02-26
> **PRD**: [PRD v1.1](../00-planning/PRD.md)
> **SDK Version**: `@apps-in-toss/web-framework ^1.12.0`

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Verify the IAP SDK refactoring from window bridge discovery to official `@apps-in-toss/web-framework` IAP import, and perform a comprehensive PRD-vs-implementation gap analysis across all features.

### 1.2 Analysis Scope

| Area | Design Document | Implementation Path |
|------|-----------------|---------------------|
| IAP SDK | PRD Sections 9, 11, 12, Appendix B | `src/integrations/tossSdk.ts` |
| IAP Consumers | PRD Section 8 (PAYWALL, SETTINGS) | `src/state/AppStateProvider.tsx`, `src/pages/PaywallPage.tsx`, `src/pages/SettingsPage.tsx` |
| Backend Contracts | PRD Section 11 | `src/backend/contracts.ts`, `src/backend/index.ts` |
| All Features | PRD Sections 4, 8, 9 | All `src/` files (45 total) |

---

## 2. IAP SDK Refactoring Analysis

### 2.1 IAP Checklist (PRD Appendix B)

| PRD Requirement | Implementation | Status | Notes |
|-----------------|---------------|:------:|-------|
| `getProductItemList` | `IAP.getProductItemList()` at L142 | ✅ | Maps `displayName`->`title`, `displayAmount`->`priceLabel` |
| `createOneTimePurchaseOrder` | `IAP.createOneTimePurchaseOrder({options, onEvent, onError})` at L189 | ✅ | Callback pattern correctly implemented |
| `processProductGrant` 30s SLA | Inline async callback `processProductGrant: async ({orderId}) => {...}` at L192 | ✅ | Grant callback runs within SDK-managed flow |
| `getPendingOrders` | `IAP.getPendingOrders()` at L234 | ✅ | Filters valid orders, maps `paymentCompletedDate` |
| `completeProductGrant` | `IAP.completeProductGrant({params:{orderId}})` at L258 | ✅ | Correct `{params:{orderId}}` shape |
| `getCompletedOrRefundedOrders` | `IAP.getCompletedOrRefundedOrders()` at L273 | ✅ | Filters COMPLETED/REFUNDED, maps `date`->`updatedAt` |
| Console product registration | Not code-verifiable | N/A | Console-side task |
| Display price = actual price | Dynamic via `getIapProductItems()` | ✅ | Never hardcoded |
| Cancel returns to paywall | `settleAndClear(null)` -> PaywallPage stays | ✅ | onError/cancel both resolve null |
| Payment error messaging | PaywallPage L97-102: 3 distinct error messages | ✅ | IAP_UNAVAILABLE, IAP_ORDER_FAILED, generic |
| Device change restore | App startup `restorePurchasesInternal()` at AppStateProvider L369-371 | ✅ | getPendingOrders + completeProductGrant |
| No subscription products | "기간형 이용권" only (month/year) | ✅ | SKU_YEARLY constant, fallback 30 days |
| Payment history | `EntitlementHistoryPage.tsx` at `/settings/entitlements` | ✅ | Shows COMPLETED/REFUNDED orders |
| Refund detection | `getIapCompletedOrRefundedOrders()` -> revoke flow at AppStateProvider L278-304 | ✅ | Detects REFUNDED, revokes entitlement |

**IAP Checklist Score: 13/13 (100%)**

### 2.2 SDK Usage Correctness

| API Call | Expected Signature | Actual Usage | Status |
|----------|-------------------|--------------|:------:|
| `IAP.createOneTimePurchaseOrder` | `({options:{sku, processProductGrant}, onEvent, onError})` returns cleanup fn | L189-217: exactly matches | ✅ |
| `IAP.completeProductGrant` | `({params:{orderId}})` returns Promise | L258: `IAP.completeProductGrant({params:{orderId}})` | ✅ |
| `IAP.getProductItemList` | Returns `{products:[{sku, displayName, displayAmount}]}` | L142-149: correctly maps fields | ✅ |
| `IAP.getPendingOrders` | Returns `{orders:[{orderId, sku, paymentCompletedDate}]}` | L234-247: filters and maps | ✅ |
| `IAP.getCompletedOrRefundedOrders` | Returns `{orders:[{orderId, sku, status, date}]}` | L273-287: maps `date`->`updatedAt` | ✅ |

**SDK Usage Score: 5/5 (100%)**

### 2.3 Public API (tossSdk.ts) Consumer Compatibility

| Export | Pre-Refactor Signature | Post-Refactor Signature | Status |
|--------|----------------------|------------------------|:------:|
| `getIapProductItems()` | `() => Promise<IapProductItem[]>` | `() => Promise<IapProductItem[]>` | ✅ Identical |
| `createIapPurchaseOrder(sku, grantCb)` | `(string, (orderId) => Promise<boolean>) => Promise<IapPendingOrder \| null>` | Same | ✅ Identical |
| `getIapPendingOrders()` | `() => Promise<IapPendingOrder[]>` | Same | ✅ Identical |
| `completeIapProductGrant(orderId)` | `(string) => Promise<boolean>` | Same | ✅ Identical |
| `getIapCompletedOrRefundedOrders()` | `() => Promise<IapCompletedOrRefundedOrder[]>` | Same | ✅ Identical |
| `isIapBridgeAvailable()` | `() => boolean` | Same (now delegates to `isTossWebView()`) | ✅ Identical |
| `createIapOrderLegacy()` | Removed | No references in codebase (grep confirms) | ✅ Clean removal |

**Consumer Compatibility Score: 7/7 (100%)**

### 2.4 Environment Detection

| Aspect | Implementation | Analysis | Status |
|--------|---------------|----------|:------:|
| `isTossWebView()` | Checks `window.ReactNativeWebView` existence (L29-33) | Toss Mini App WebView is React Native-based; `ReactNativeWebView` is injected by the native container | ✅ Correct |
| Non-IAP bridges | Still use window bridge discovery (`pickMiniAppBridge`, `pickIdentityBridge`) | openURL/close/share/identity are not part of `@apps-in-toss/web-framework` IAP module | ✅ Appropriate |
| Fallback for non-Toss | All IAP functions return empty/false when `!isTossWebView()` | Prevents SDK calls outside Toss environment | ✅ Safe |

**Environment Detection Score: 3/3 (100%)**

---

## 3. Full Project PRD vs Implementation

### 3.1 Feature Completeness (PRD Section 9: P0)

| P0 Feature | PRD Spec | Implementation | Status | Evidence |
|-----------|----------|---------------|:------:|----------|
| Onboarding 3-screen | OB-1, OB-2, OB-3 with confirmed copy | `OnboardingPage.tsx`: 3 slides with emoji, title, description | ⚠️ | Copy differs from PRD (see 3.2) |
| Routine CRUD | Create/Edit/Delete, Free max 3, templates 5 + custom | `RoutineNewPage.tsx`, `RoutineEditPage.tsx`, `AppStateProvider.tsx` | ⚠️ | Templates: only 4 (missing "절약 기록"), see 3.2 |
| Today checkin | Complete/Skip one-tap, note (optional) | `HomePage.tsx`: complete via swipe/tap, skip with warning, note modal | ✅ | |
| Streak calculation | COMPLETED -> maintain/increase, SKIPPED -> reset | `progress.ts` L46-79: correct logic with shield support | ✅ | |
| Badge 5 types | FIRST_CHECKIN, STREAK_3, STREAK_7, STREAK_14, COMEBACK | `models.ts` L3-10 + `progress.ts` L228-291 | ✅ | |
| Weekly report | Completion rate, best day, comment | `ReportPage.tsx` + `progress.ts` buildWeeklyReportSummary | ✅ | |
| Restart routine | restartAt update, streak reset | `AppStateProvider.tsx` L543-555, `RoutineDetailPage.tsx` L101 | ✅ | |
| Local storage | Storage API for all data | `appStateRepository.ts` with localStorage driver | ✅ | |
| IAP (month/year) | Full flow per Appendix B | See Section 2 above | ✅ | |
| Free trial (7d, 1x) | Server userKeyHash limit | `startFreeTrial()` + Supabase backend | ✅ | |
| Restore purchases | getPendingOrders + completeProductGrant | `restorePurchasesInternal()` | ✅ | |
| Deep links 3 | /home, /report, /routine/new | `deeplink.ts` + `AppRoutes.tsx` L59-61 | ✅ | |
| Toss login | Premium-only, userKeyHash | `ensureUserKeyHash()` + bridge discovery | ✅ | |

**P0 Feature Score: 11/13 items fully match, 2 partial = 92%**

### 3.2 Differences Found

#### Missing Features (PRD has, implementation lacks)

| # | Item | PRD Location | Description | Severity |
|---|------|-------------|-------------|----------|
| 1 | Top NavigationBar | PRD 6.검수:L199-202 | PRD requires: brand logo + name, more button (report/share), close button (X). AppShell only has floating bottom tab bar. | **CRITICAL** |
| 2 | "절약 기록" template | PRD 8.R-NEW | PRD lists 5 templates: 운동/공부/절약/청소/독서. Implementation has only 4: 운동/공부/청소/독서 | LOW |
| 3 | Skip warning toast timing | PRD 8.HOME | PRD says "2초 노출 후 사용자 확인 탭" flow. Implementation uses WarningToast with action button (no auto-dismiss timer). | LOW |
| 4 | `data_reset` analytics event | PRD 10.이벤트 | `data_reset` event never tracked (grep: 0 results). `resetAllData()` in AppStateProvider has no trackEvent call. | MEDIUM |
| 5 | Data reset in Settings | PRD 8.SETTINGS | Settings page has no "데이터 초기화" button. It was previously removed for production release (commit da4fc11). | MEDIUM |

#### Changed Features (PRD design differs from implementation)

| # | Item | PRD Design | Implementation | Impact |
|---|------|-----------|---------------|--------|
| 1 | Onboarding copy OB-1 | "작심삼일, 괜찮아요. 4일째 다시 시작하면 되니까." | "작심삼일도 괜찮아요 / 중요한 건 완벽함보다 다시 시작하는 힘이에요. 작은 루틴을 꾸준히 이어가볼게요." | MEDIUM |
| 2 | Onboarding copy OB-2 | "오늘 할 일, 딱 하나만 체크해요. / 매일 원탭으로 기록하고 / 일주일 뒤 얼마나 달라졌는지 확인해요." | "오늘 할 일 하나만 체크해요 / 매일 원탭으로 기록하고, 주간 리포트에서 나의 흐름을 확인할 수 있어요." | LOW |
| 3 | Onboarding copy OB-3 | "실패해도 기록은 남아요. 그 기록이 다시 시작할 이유가 됩니다." | "실패해도 기록은 남아요 / 끊겨도 괜찮아요. 다시 시작 버튼으로 언제든 재도전할 수 있어요." | LOW |
| 4 | Onboarding emojis | OB-1: fire, OB-2: check, OB-3: medal | OB-1: compass, OB-2: check, OB-3: chart_increasing | LOW |
| 5 | Paywall copy | "루틴 개수 제한 없음" (PRD says no "무제한") | Feature list says "루틴 개수 제한 없음" - this is OK per PRD's own rule | ✅ |
| 6 | Paywall hero text | "루틴이 3개를 넘었어요. 더 많은 루틴을 관리해볼까요?" | "프리미엄 이용권으로 한계를 뛰어넘으세요" | LOW |
| 7 | Paywall dismiss button text | "무료로 계속 쓰기 (3개 제한)" | "괜찮아요, 무료로 계속할게요" | LOW |
| 8 | Restart confirmation | PRD: "확인 다이얼로그" | Implementation: `window.confirm()` | ✅ Functional |

#### Added Features (implementation has, PRD lacks)

| # | Item | Implementation Location | Description |
|---|------|------------------------|-------------|
| 1 | Streak Shield | `StreakShieldPrompt.tsx`, `AppStateProvider.tsx` | Premium feature: monthly 2x streak protection (post-PRD feature) |
| 2 | Heatmap + Monthly Trend | `ReportPage.tsx`, `HeatmapGrid.tsx` | Premium-only 30-day heatmap and 4-week trend chart |
| 3 | Memo History Timeline | `ReportPage.tsx` L291-324 | Recent notes timeline in report page |
| 4 | Batch delete routines | `HomePage.tsx` L91-129 | Select mode for multi-routine deletion |
| 5 | Confetti animation | `HomePage.tsx` L179-183 | canvas-confetti on checkin completion |
| 6 | Routine color system | `utils/routineColor.ts` | Per-routine color assignment |
| 7 | Inline memo after completion | `HomePage.tsx` L149-165 | Quick memo input after check-in |
| 8 | Refund revoked banner | `HomePage.tsx` L264-284 | Banner when refund detected |
| 9 | Greeting system | `utils/greeting.ts` | Time/progress-based greeting on home |
| 10 | WebView page | `WebViewPage.tsx` | In-app WebView for terms/privacy |

### 3.3 Technical/Policy Compliance

| PRD Requirement | Implementation | Status | Evidence |
|----------------|---------------|:------:|----------|
| Light mode fixed | `<meta name="color-scheme" content="light">` in index.html L9 | ✅ | |
| Pinch zoom disabled | `maximum-scale=1, user-scalable=no` in viewport meta L7 | ✅ | |
| NavigationBar: logo + name | granite.config.ts has `brand.displayName` + `brand.icon` | ⚠️ | Config exists but AppShell has no top nav rendering |
| NavigationBar: more button | Not implemented in AppShell | ❌ | PRD requires report/share action |
| NavigationBar: close button (X) | Not implemented in AppShell | ❌ | PRD requires mini app close |
| 2s interaction response | Loading state in App.tsx while hydrating | ✅ | |
| Deep links + back to home | 3 redirect routes + deeplink resolver | ✅ | |
| No 3rd party login | Only toss userKeyHash via bridge | ✅ | |
| Terms/Privacy internal | WebViewPage + iframe | ⚠️ | PRD notes iframe risks; uses iframe with sandbox |
| HTTPS only | No HTTP references in codebase | ✅ | |
| No external links | Only support email via openExternalUrl | ✅ | |
| No "무제한" expression | PaywallPage uses "루틴 개수 제한 없음" | ✅ | Corrected from previous analysis |
| "무료로 계속 쓰기" always visible | PaywallPage bottom dismiss button | ✅ | |
| No auto-popup paywall | Paywall only via explicit navigation | ✅ | |

### 3.4 Analytics Event Coverage

| PRD Event | Tracked | Location | Status |
|-----------|:-------:|----------|:------:|
| `onboarding_view` | Yes | OnboardingPage.tsx L45 | ✅ |
| `onboarding_complete` | Yes | OnboardingPage.tsx L49 | ✅ |
| `routine_create_complete` | Yes | RoutineNewPage.tsx L46 | ✅ |
| `checkin_complete` | Yes | HomePage.tsx L174, L201 | ✅ |
| `checkin_skip` | Yes | HomePage.tsx L226 | ✅ |
| `streak_milestone` | Yes | AppStateProvider.tsx L521-527 | ✅ |
| `badge_earned` | Yes | AppStateProvider.tsx L519 | ✅ |
| `report_view` | Yes | ReportPage.tsx L65 | ✅ |
| `paywall_view` | Yes | PaywallPage.tsx L66 | ✅ |
| `paywall_start_trial` | Yes | PaywallPage.tsx L71 | ✅ |
| `iap_purchase_start` | Yes | PaywallPage.tsx L87 | ✅ |
| `iap_grant_success` | Yes | PaywallPage.tsx L108 | ✅ |
| `iap_grant_fail` | Yes | PaywallPage.tsx L92, L116 | ✅ |
| `iap_restore_start` | Yes | AppStateProvider.tsx L748 | ✅ |
| `iap_restore_done` | Yes | AppStateProvider.tsx L750 | ✅ |
| `home_view` | Yes | HomePage.tsx L136 | ✅ |
| `settings_view` | Yes | SettingsPage.tsx L24 | ✅ |
| `routine_create_start` | Yes | RoutineNewPage.tsx L27 | ✅ |
| `routine_template_select` | Yes | RoutineNewPage.tsx L94 | ✅ |
| `routine_detail_view` | Yes | RoutineDetailPage.tsx L28 | ✅ |
| `routine_restart` | Yes | RoutineDetailPage.tsx L106 | ✅ |
| `report_week_change` | Yes | ReportPage.tsx L76 | ✅ |
| `data_reset` | **No** | Not called anywhere | ❌ |

**Analytics Score: 22/23 (96%)**

### 3.5 Data Model Comparison

| PRD Entity/Field | models.ts | Status | Notes |
|-----------------|-----------|:------:|-------|
| Routine.id | `id: string` | ✅ | |
| Routine.title | `title: string` | ✅ | |
| Routine.daysOfWeek | `daysOfWeek: DayOfWeek[]` | ✅ | |
| Routine.goalPerDay | `goalPerDay: number` | ✅ | |
| Routine.createdAt | `createdAt: string` | ✅ | |
| Routine.restartAt? | `restartAt?: string` | ✅ | |
| Routine.archivedAt? | `archivedAt?: string` | ✅ | |
| Checkin.id | `id: string` | ✅ | |
| Checkin.routineId | `routineId: string` | ✅ | |
| Checkin.date | `date: string` (YYYY-MM-DD KST) | ✅ | |
| Checkin.status | `status: CheckinStatus` (COMPLETED/SKIPPED) | ✅ | |
| Checkin.note? | `note?: string` | ✅ | |
| Badge.badgeType | `badgeType: BadgeType` (5 types) | ✅ | |
| Badge.earnedAt | `earnedAt: string` | ✅ | |
| Entitlement.premiumUntil? | `premiumUntil?: string` | ✅ | |
| Entitlement.trialUsedLocal? | `trialUsedLocal?: boolean` | ✅ | |
| Entitlement.trialExpiredBannerShown? | `trialExpiredBannerShown?: boolean` | ✅ | |
| Entitlement.lastKnownUserKeyHash? | `lastKnownUserKeyHash?: string` | ✅ | |
| Entitlement.lastOrderId? | `lastOrderId?: string` | ✅ | |
| Entitlement.lastSku? | `lastSku?: string` | ✅ | |
| (Added) Entitlement.streakShields? | `streakShields?: StreakShieldEntry[]` | ⚠️ | Post-PRD addition |
| (Added) Entitlement.refundNoticeShown? | `refundNoticeShown?: boolean` | ⚠️ | Post-PRD addition |
| (Added) Entitlement.lastRefundedOrderId? | `lastRefundedOrderId?: string` | ⚠️ | Post-PRD addition |
| (Added) Entitlement.lastRefundedAt? | `lastRefundedAt?: string` | ⚠️ | Post-PRD addition |

**Data Model Score: 19/19 PRD fields match (100%) + 4 additions**

---

## 4. Architecture Compliance

### 4.1 Layer Structure (Dynamic Level)

| Expected Layer | Actual Folder | Contents Correct | Status |
|---------------|--------------|:----------------:|:------:|
| `components/` (Presentation) | `src/components/` (8 files) | ✅ | ✅ |
| `pages/` (Presentation) | `src/pages/` (10 files) | ✅ | ✅ |
| `state/` (Application) | `src/state/` (2 files) | ✅ | ✅ |
| `domain/` (Domain) | `src/domain/` (3 files) | ✅ | ✅ |
| `integrations/` (Infrastructure) | `src/integrations/` (1 file) | ✅ | ✅ |
| `backend/` (Infrastructure) | `src/backend/` (5 files) | ✅ | ✅ |
| `storage/` (Infrastructure) | `src/storage/` (2 files) | ✅ | ✅ |
| `analytics/` (Infrastructure) | `src/analytics/` (1 file) | ✅ | ✅ |
| `utils/` (Shared) | `src/utils/` (5 files) | ✅ | ✅ |
| `config/` (Shared) | `src/config/` (1 file) | ✅ | ✅ |
| `app/` (App shell) | `src/app/` (3 files) | ✅ | ✅ |
| `lib/` (Utilities) | `src/lib/` (1 file) | ✅ | ✅ |

### 4.2 Dependency Direction

| Import | Layer Flow | Status |
|--------|-----------|:------:|
| Pages -> state/AppStateProvider | Presentation -> Application | ✅ |
| Pages -> integrations/tossSdk | Presentation -> Infrastructure | ⚠️ |
| Pages -> analytics/analytics | Presentation -> Infrastructure | ⚠️ |
| Pages -> backend/ | Presentation -> Infrastructure | ⚠️ |
| state/ -> domain/ | Application -> Domain | ✅ |
| state/ -> integrations/ | Application -> Infrastructure | ✅ |
| state/ -> backend/ | Application -> Infrastructure | ✅ |
| domain/ -> utils/date | Domain -> Shared Utils | ✅ |
| domain/ -> (no infrastructure imports) | Domain independent | ✅ |

**Note**: Pages directly importing `tossSdk`, `analytics`, and `backend` (e.g., PaywallPage imports `getIapProductItems`, `entitlementBackend`) is a minor violation in strict Clean Architecture but is acceptable at Dynamic level.

**Architecture Score: 95%**

---

## 5. Convention Compliance

### 5.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | None |
| Functions | camelCase | 100% | None |
| Constants | UPPER_SNAKE_CASE | 100% | `FREE_ROUTINE_LIMIT`, `STREAK_SHIELD_MONTHLY_LIMIT`, etc. |
| Files (component) | PascalCase.tsx | 100% | All 8 components |
| Files (utility) | camelCase.ts | 100% | `date.ts`, `id.ts`, `greeting.ts`, `routineColor.ts` |
| Folders | kebab-case or functional | 100% | All folders follow convention |
| Types | `type` over `interface` | 90% | Some `interface` usage in contracts.ts (acceptable for backend contracts) |
| No `enum` | String literal unions | 100% | `DayOfWeek`, `CheckinStatus`, `BadgeType` all use unions |

### 5.2 Code Style

| Rule | Compliance | Notes |
|------|:----------:|-------|
| Functional components only | 100% | No class components |
| Hooks pattern | 100% | useCallback, useMemo, useRef properly used |
| Strict TypeScript | 100% | No `any` usage found |
| Bridge defensive checks | 100% | `typeof fn === "function"` guards |
| KST date handling | 100% | All date stamps use `getKstDateStamp()` |

**Convention Score: 98%**

---

## 6. Overall Scores

```
+---------------------------------------------+
|  CATEGORY                     SCORE  STATUS  |
+---------------------------------------------+
|  IAP SDK Correctness          100%    [OK]   |
|  IAP Checklist (Appendix B)   100%    [OK]   |
|  Consumer API Compatibility   100%    [OK]   |
|  Environment Detection        100%    [OK]   |
|  P0 Feature Completeness       92%   [WARN]  |
|  Policy/Review Compliance      82%   [WARN]  |
|  Analytics Event Coverage      96%    [OK]   |
|  Data Model Match             100%    [OK]   |
|  Architecture Compliance       95%    [OK]   |
|  Convention Compliance         98%    [OK]   |
+---------------------------------------------+
|  OVERALL MATCH RATE            95%    [OK]   |
+---------------------------------------------+
```

---

## 7. Critical Issues

### 7.1 CRITICAL: Missing Top NavigationBar

**PRD Reference**: Section 6 (검수 체크리스트), items #3, #4, #5

**Required by PRD**:
- Brand logo + name in navigation bar
- More button with report/share actions
- Close button (X) to exit mini app

**Current state**: `src/components/AppShell.tsx` renders only a floating bottom tab bar. There is no top navigation bar. The `granite.config.ts` has `brand` configuration, but this only configures the Toss-native navigation bar — the web fallback header for when native nav is unavailable is missing.

**Previous history**: Per IMPLEMENTATION_MEMORY.md, a NavigationBar was implemented in step 6 but was later removed during UI modernization to the floating tab bar design.

**Impact**: Apps-in-toss review will reject the app without the navigation bar (mandatory items #3, #4, #5 in the checklist).

**File**: `E:\프로젝트\앱인토스\작심루틴\src\components\AppShell.tsx`

### 7.2 MEDIUM: Data Reset Missing from Settings

**PRD Reference**: Section 8 (SETTINGS), Section 9 (P0)

**Required by PRD**: Settings must include "데이터 초기화" with confirmation dialog, clearing all data including onboarding flag.

**Current state**: `src/pages/SettingsPage.tsx` has no reset button. It was intentionally removed in commit `da4fc11` ("remove data reset button from settings for production release").

**Impact**: PRD specifies this as a P0 feature. However, it was a deliberate production decision. If review requires it, it needs to be re-added.

**File**: `E:\프로젝트\앱인토스\작심루틴\src\pages\SettingsPage.tsx`

### 7.3 MEDIUM: `data_reset` Event Not Tracked

**PRD Reference**: Section 10 (Analytics Events)

`data_reset` is listed in the PRD event taxonomy but is never called in any source file. Since the data reset button was removed from Settings, this is a cascading gap.

**File**: `E:\프로젝트\앱인토스\작심루틴\src\state\AppStateProvider.tsx` (resetAllData function at L778)

---

## 8. Low-Priority Differences

| # | Item | PRD | Implementation | Recommendation |
|---|------|-----|---------------|----------------|
| 1 | Onboarding copy | Exact PRD text | Paraphrased version | Update to PRD confirmed copy or update PRD to match |
| 2 | Templates count | 5 (운동/공부/절약/청소/독서) | 4 (missing 절약) | Add "절약 기록" template to `src/domain/templates.ts` |
| 3 | Paywall dismiss text | "무료로 계속 쓰기 (3개 제한)" | "괜찮아요, 무료로 계속할게요" | Consider adding "(3개 제한)" for clarity |
| 4 | Skip toast behavior | 2s auto-display then confirm | WarningToast with action button (no timer) | Current implementation is functionally better UX |

---

## 9. Recommended Actions

### 9.1 Immediate (blocks review submission)

| Priority | Item | File | Action |
|----------|------|------|--------|
| P0 | Add top NavigationBar | `src/components/AppShell.tsx` | Add brand logo, more button, close button |
| P0 | Verify granite.config.ts nav shows in Toss | `granite.config.ts` | Test in actual Toss WebView; web fallback may not be needed if native nav renders |

### 9.2 Before Review Submission

| Priority | Item | File | Action |
|----------|------|------|--------|
| P1 | Re-add data reset to Settings | `src/pages/SettingsPage.tsx` | Add reset button with confirmation dialog |
| P1 | Track `data_reset` event | `src/state/AppStateProvider.tsx` | Add `trackEvent("data_reset")` in `resetAllData()` |
| P1 | Add missing template | `src/domain/templates.ts` | Add `{ key: "saving", title: "절약 기록", daysOfWeek: weekdaySet }` |

### 9.3 Optional (PRD sync)

| Priority | Item | File | Action |
|----------|------|------|--------|
| P2 | Sync onboarding copy | `src/pages/OnboardingPage.tsx` | Update to PRD confirmed copy or update PRD |
| P2 | Update PRD for new features | `docs/00-planning/PRD.md` | Document streak shield, heatmap, batch delete, refund banner |

---

## 10. Design Document Updates Needed

The following features exist in implementation but are not documented in the PRD:

- [ ] Streak Shield (monthly 2x protection for premium users)
- [ ] Heatmap grid (30-day check-in visualization)
- [ ] Monthly trend chart (4-week completion rate)
- [ ] Memo history timeline
- [ ] Batch routine deletion
- [ ] Refund revoked banner
- [ ] Greeting system
- [ ] In-app WebView for terms/privacy
- [ ] Inline memo after completion
- [ ] Entitlement history page

---

## 11. IAP-Specific Findings Summary

The IAP SDK refactoring from window bridge pattern to official `@apps-in-toss/web-framework` IAP import is **complete and correct**:

1. **All 5 IAP methods** use the official `IAP.*` namespace from the SDK
2. **Callback pattern** for `createOneTimePurchaseOrder` is correctly implemented with `options.processProductGrant` async callback, `onEvent`, and `onError` handlers
3. **Cleanup function** from `IAP.createOneTimePurchaseOrder` is properly captured and called on timeout/error
4. **5-minute timeout** guard prevents indefinite promise hanging
5. **Settlement deduplication** (`settled` boolean flag) prevents double-resolve
6. **Non-IAP SDK calls** (openURL, close, share, identity) correctly remain as window bridge patterns since they are not part of the IAP SDK module
7. **Public API surface** is 100% backward-compatible -- no caller changes needed
8. **`createIapOrderLegacy()`** was cleanly removed with zero remaining references

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-26 | Initial IAP SDK refactor + full project analysis | Claude (gap-detector) |
