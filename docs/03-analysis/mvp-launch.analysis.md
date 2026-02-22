# Gap Analysis: mvp-launch

> **Analysis Type**: Design vs Implementation Gap Analysis
>
> **Project**: 작심루틴 (jaksim-routine)
> **Analyst**: gap-detector
> **Date**: 2026-02-22
> **Design Doc**: [mvp-launch.design.md](../02-design/features/mvp-launch.design.md)

---

## 메타

| 항목 | 내용 |
|------|------|
| Feature | mvp-launch |
| Design 참조 | docs/02-design/features/mvp-launch.design.md |
| 구현 경로 | src/ |
| 분석일 | 2026-02-22 |
| Match Rate | **100%** |

---

## Design Item 검증

### DESIGN-01: 운영 Analytics 이벤트 보완

**상태: PASS**

#### RoutineEditPage.tsx 검증

| 항목 | Design 요구사항 | 실제 구현 | 위치 | 상태 |
|------|----------------|----------|------|------|
| import | `import { trackEvent } from "../analytics/analytics"` | 동일 | L3 | ✅ |
| routine_edit_save | `trackEvent("routine_edit_save", { routineId: routine.id })` | 동일 | L116 | ✅ |
| routine_delete | `trackEvent("routine_delete", { routineId: routine.id })` | 동일 | L132 | ✅ |

- 저장 버튼 onClick 핸들러 내부에서 `updateRoutine` 호출 직후 `trackEvent("routine_edit_save", ...)` 호출 확인
- 삭제 확인(`window.confirm`) 통과 후 `deleteRoutine` 호출 직후 `trackEvent("routine_delete", ...)` 호출 확인

#### EntitlementHistoryPage.tsx 검증

| 항목 | Design 요구사항 | 실제 구현 | 위치 | 상태 |
|------|----------------|----------|------|------|
| import | `import { trackEvent } from "../analytics/analytics"` | 동일 | L3 | ✅ |
| entitlement_history_view | `trackEvent("entitlement_history_view", { count: sorted.length })` | 동일 | L20 | ✅ |

- `useEffect` 내에서 `getCompletedOrRefundedOrders` 결과를 정렬한 후 `sorted.length`를 count로 전달하며 호출 확인

**DESIGN-01 결과: 5/5 항목 일치 (100%)**

---

### DESIGN-02: CSS 터치 영역 보완

**상태: PASS**

#### 문제 1: ghost-button 터치 영역 확대

| 항목 | Design 요구사항 | 실제 구현 | 위치 | 상태 |
|------|----------------|----------|------|------|
| position: relative | `.ghost-button`에 `position: relative` 추가 | 적용됨 | styles.css L79 | ✅ |
| ::after pseudo-element | `content: ""; position: absolute; inset: -6px;` | 적용됨 | styles.css L87-91 | ✅ |

- `.ghost-button`은 32x32px 시각적 크기를 유지하면서 `::after` 가상 요소로 44x44px 터치 영역 확보 (32 + 6*2 = 44)

#### 문제 2: secondary-button.full 클래스

| 항목 | Design 요구사항 | 실제 구현 | 위치 | 상태 |
|------|----------------|----------|------|------|
| .secondary-button.full | `width: 100%` 정의 | `.primary-button.full, .secondary-button.full { width: 100%; }` | styles.css L179-182 | ✅ |

- `.primary-button.full`과 함께 결합 선언으로 구현되어 있음

#### 문제 3: 버튼 최소 높이 44px

| 항목 | Design 요구사항 | 실제 구현 | 위치 | 상태 |
|------|----------------|----------|------|------|
| min-height: 44px | `.primary-button, .secondary-button`에 `min-height: 44px` | 적용됨 | styles.css L154-157 | ✅ |

- `.primary-button, .secondary-button { min-height: 44px; }` 규칙 확인

**DESIGN-02 결과: 4/4 항목 일치 (100%)**

---

### DESIGN-03: 앱인토스 검수 체크리스트 (24항목)

**상태: PASS**

#### 빌드/품질 검증

| 항목 | Design 기록 | 상태 |
|------|------------|------|
| TypeScript | 0 errors | ✅ PASS |
| ESLint | 0 errors | ✅ PASS |
| 빌드 | 550ms 성공 | ✅ PASS |
| 번들 크기 (JS) | 217.88 KB (gzip 68.71 KB) < 500KB 목표 | ✅ PASS |
| IAP 정적 QA | 14/14 PASS | ✅ PASS |

#### 24개 항목 코드 기반 대조

| # | 항목 | 코드 확인 | 상태 |
|---|------|----------|------|
| 1 | 라이트 모드 고정 | `styles.css` L2: `color-scheme: light` + `index.html` L9: `<meta name="color-scheme" content="light">` | ✅ |
| 2 | 핀치줌 비활성화 | `index.html` L7: `user-scalable=no, maximum-scale=1` | ✅ |
| 3 | 브랜드 로고+이름 | `AppShell.tsx` L91: `brand-mark` "JR" + L92: `brand-name` "작심루틴" | ✅ |
| 4 | 더보기 버튼 | `AppShell.tsx` L96-102: ghost-button "..." + aria-label="더보기" | ✅ |
| 5 | 닫기 버튼 | `AppShell.tsx` L103-112: ghost-button 닫기 + closeMiniApp() | ✅ |
| 6 | 2초 이내 응답 | localStorage 기반 즉시 응답 | ✅ |
| 7 | 재접속 데이터 유지 | localStorage 자동 저장/복원 (appStateRepository.ts) | ✅ |
| 8 | 기능화 안 된 컴포넌트 없음 | 모든 버튼/링크에 onClick/to 핸들러 확인 | ✅ |
| 9 | 딥링크 3개 | `deeplink.ts` L1: `/home`, `/report`, `/routine/new` | ✅ |
| 10 | 3rd party 로그인 없음 | 토스 SDK만 사용 (tossSdk.ts) | ✅ |
| 11 | 인트로 화면 | `OnboardingPage.tsx` 3스크린 구현 | ✅ |
| 12 | 닫기 동작 분기 | `AppShell.tsx` L40-53: 온보딩이면 closeMiniApp, 그 외 navigate(-1) | ✅ |
| 13 | 로그인 해제 시 초기화 | resetAllData + clearAppState (AppStateProvider.tsx) | ✅ |
| 14 | 표시 금액 = 실제 금액 | getProductItemList() 동적 표시 (PaywallPage.tsx) | ✅ |
| 15 | 결제 취소 시 이전 화면 | PaywallPage 에러 처리 | ✅ |
| 16 | 결제 실패 시 안내 | PaywallPage: errorCode별 메시지 | ✅ |
| 17 | 기기 변경 후 복원 | restorePurchasesInternal() 자동 실행 | ✅ |
| 18 | 구독 상품 없음 | 기간형 이용권(비소모품) | ✅ |
| 19 | 결제 내역 확인 | EntitlementHistoryPage 구현 | ✅ |
| 20 | processProductGrant 30초 | 스텁 즉시 반환 (실 서버 검증 필요) | ⚠️ |
| 21 | 불필요한 권한 없음 | 권한 요청 없음 | ✅ |
| 22 | 메모리 누수 없음 | useEffect cleanup 패턴 적용 | ✅ |
| 23 | HTTPS 통신 | 로컬 Storage만 사용, 외부 통신 없음 | ✅ |
| 24 | 다크패턴 없음 | "무료로 계속 쓰기" 항상 제공 | ✅ |

> #20은 Design 문서에서도 "코드 레벨에서는 통과, 실 서버 배포 시 SLA 검증 필요"로 명시됨. 현재 스텁 기반이므로 코드 레벨 PASS 처리.

**DESIGN-03 결과: 24/24 항목 일치 (100%) -- 1건 조건부 통과(#20)**

---

## PRD Analytics 이벤트 커버리지

### PRD 필수 이벤트 23개

| # | 이벤트 | 구현 파일 | 라인 | 상태 |
|---|--------|----------|------|------|
| 1 | `onboarding_view` | OnboardingPage.tsx | L43 | ✅ |
| 2 | `onboarding_complete` | OnboardingPage.tsx | L47 | ✅ |
| 3 | `routine_create_start` | RoutineNewPage.tsx | L35 | ✅ |
| 4 | `routine_create_complete` | RoutineNewPage.tsx | L54 | ✅ |
| 5 | `routine_template_select` | RoutineNewPage.tsx | L74 | ✅ |
| 6 | `home_view` | HomePage.tsx | L50 | ✅ |
| 7 | `checkin_complete` | HomePage.tsx | L70, L189; RoutineDetailPage.tsx L52 | ✅ |
| 8 | `checkin_skip` | HomePage.tsx | L90 | ✅ |
| 9 | `routine_detail_view` | RoutineDetailPage.tsx | L25 | ✅ |
| 10 | `routine_restart` | RoutineDetailPage.tsx | L92 | ✅ |
| 11 | `report_view` | ReportPage.tsx | L18 | ✅ |
| 12 | `report_week_change` | ReportPage.tsx | L29 | ✅ |
| 13 | `paywall_view` | PaywallPage.tsx | L56 | ✅ |
| 14 | `paywall_start_trial` | PaywallPage.tsx | L61 | ✅ |
| 15 | `iap_purchase_start` | PaywallPage.tsx | L77 | ✅ |
| 16 | `iap_grant_success` | PaywallPage.tsx | L92 | ✅ |
| 17 | `iap_grant_fail` | PaywallPage.tsx | L82, L100 | ✅ |
| 18 | `iap_restore_start` | AppStateProvider.tsx | L612 | ✅ |
| 19 | `iap_restore_done` | AppStateProvider.tsx | L614 | ✅ |
| 20 | `settings_view` | SettingsPage.tsx | L21 | ✅ |
| 21 | `data_reset` | SettingsPage.tsx | L108 | ✅ |
| 22 | `streak_milestone` | AppStateProvider.tsx | L500, L502, L504 | ✅ |
| 23 | `badge_earned` | AppStateProvider.tsx | L498 | ✅ |

**PRD 필수 이벤트: 23/23 (100%)**

### 운영 추가 이벤트 3개 (DESIGN-01)

| # | 이벤트 | 구현 파일 | 라인 | 상태 |
|---|--------|----------|------|------|
| 24 | `routine_edit_save` | RoutineEditPage.tsx | L116 | ✅ |
| 25 | `routine_delete` | RoutineEditPage.tsx | L132 | ✅ |
| 26 | `entitlement_history_view` | EntitlementHistoryPage.tsx | L20 | ✅ |

**운영 이벤트: 3/3 (100%)**

### Design에 없는 추가 이벤트 (참고)

| 이벤트 | 구현 파일 | 라인 | 비고 |
|--------|----------|------|------|
| `iap_refund_revoke` | AppStateProvider.tsx | L298 | 환불 취소 처리용 -- Design에 명시되지 않았으나 방어적 구현으로 판단 |

> 추가 이벤트 1건은 Design 문서에 없으나 기능 확장이므로 Gap으로 분류하지 않음.

**총 이벤트 커버리지: 26/26 (100%)**

---

## Gap 목록

### 누락된 기능 (Design O, 구현 X)

없음.

### 추가된 기능 (Design X, 구현 O)

| 항목 | 구현 위치 | 설명 | 영향 |
|------|----------|------|------|
| `iap_refund_revoke` 이벤트 | AppStateProvider.tsx L298 | 환불 취소 시 추적 이벤트 | Low -- 방어적 구현, 문서 반영 권장 |

### 변경된 기능 (Design != 구현)

없음.

---

## 점수 요약

| 카테고리 | 항목 수 | 일치 | 점수 | 상태 |
|---------|:------:|:----:|:----:|:----:|
| DESIGN-01: Analytics 이벤트 | 5 | 5 | 100% | ✅ |
| DESIGN-02: CSS 터치 영역 | 4 | 4 | 100% | ✅ |
| DESIGN-03: 검수 체크리스트 | 24 | 24 | 100% | ✅ |
| PRD Analytics 이벤트 | 23 | 23 | 100% | ✅ |
| 운영 추가 이벤트 | 3 | 3 | 100% | ✅ |
| **총합** | **59** | **59** | **100%** | ✅ |

---

## 결론

```
Match Rate: 100%

  Design Items:   3/3 PASS (DESIGN-01, DESIGN-02, DESIGN-03)
  Analytics:     26/26 events implemented
  Checklist:     24/24 items verified

  Status: PASS -- Design과 Implementation이 완전히 일치합니다.
```

Design 문서에 명시된 모든 변경 사항이 구현 코드에 정확히 반영되어 있다.

- DESIGN-01의 3개 운영 Analytics 이벤트가 올바른 파일, 올바른 위치에 올바른 인자로 구현됨
- DESIGN-02의 CSS 터치 영역 보완(ghost-button ::after, secondary-button.full, min-height 44px)이 모두 적용됨
- DESIGN-03의 24개 검수 항목이 코드 기반으로 확인됨 (#20은 Design에서도 조건부 통과로 명시)
- PRD 필수 23개 + 운영 3개 = 총 26개 Analytics 이벤트가 모두 구현됨

### 권장 사항

1. **문서 반영**: `iap_refund_revoke` 이벤트를 Design 문서 또는 Analytics 이벤트 목록에 추가
2. **배포 전 검증**: #20 (processProductGrant 30초 SLA)은 실 서버 환경에서 재검증 필요

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-22 | Initial gap analysis | gap-detector |
