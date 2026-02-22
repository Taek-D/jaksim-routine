# Design: MVP 런칭 (작심루틴)

## 메타
| 항목 | 내용 |
|------|------|
| Feature | mvp-launch |
| Plan 참조 | docs/01-plan/features/mvp-launch.plan.md |
| PRD 참조 | docs/PRD.md (v1.1) |
| 작성일 | 2026-02-22 |
| 상태 | Design |

## 1. 현재 상태 검증 결과

빌드/린트/QA를 실제 실행하여 확인한 결과:

| 항목 | 결과 | 목표 | 상태 |
|------|------|------|------|
| TypeScript | 0 errors | 0 errors | ✅ PASS |
| ESLint | 0 errors | 0 errors | ✅ PASS |
| 빌드 | 550ms 성공 | 성공 | ✅ PASS |
| 번들 크기 (JS) | 217.88 KB (gzip 68.71 KB) | < 500KB | ✅ PASS |
| 번들 크기 (CSS) | 5.05 KB (gzip 1.57 KB) | - | ✅ PASS |
| IAP 정적 QA | 14/14 PASS | All PASS | ✅ PASS |
| onboarding_view | ✅ 구현됨 (L43) | PRD 필수 | ✅ PASS |
| onboarding_complete | ✅ 구현됨 (L47) | PRD 필수 | ✅ PASS |

### Plan Gap 해소 현황

| Gap | Plan 예상 | 실제 확인 | 결론 |
|-----|----------|----------|------|
| GAP-01 Analytics 누락 | onboarding 이벤트 누락 가능 | ✅ 모두 구현됨 | **해소** (운영 이벤트만 보완) |
| GAP-02 CSS/UI 품질 | 미검증 | 검토 필요 항목 발견 | **작업 필요** |
| GAP-03 번들 크기 | 미확인 | 218KB (목표 500KB 이하) | **해소** |
| GAP-04 IAP QA | 미실행 | 14/14 PASS | **해소** |

## 2. 잔여 작업 상세 설계

### DESIGN-01: 운영 Analytics 이벤트 보완 (P1)

PRD에 명시된 23개 이벤트는 모두 구현 완료. 운영 분석을 위해 아래 2개 페이지에 이벤트 추가.

#### RoutineEditPage — 변경 사항

**파일**: `src/pages/RoutineEditPage.tsx`

```typescript
// 추가할 import
import { trackEvent } from "../analytics/analytics";

// 저장 버튼 onClick에 추가
trackEvent("routine_edit_save", { routineId: routine.id });

// 삭제 확인 후 추가
trackEvent("routine_delete", { routineId: routine.id });
```

**이벤트 정의:**

| 이벤트 | 트리거 | 속성 |
|--------|--------|------|
| `routine_edit_save` | 편집 저장 버튼 클릭 | `routineId` |
| `routine_delete` | 삭제 확인 후 실행 | `routineId` |

#### EntitlementHistoryPage — 변경 사항

**파일**: `src/pages/EntitlementHistoryPage.tsx`

```typescript
// 추가할 import
import { trackEvent } from "../analytics/analytics";

// useEffect 내에서 records 로딩 후 추가
trackEvent("entitlement_history_view", { count: sorted.length });
```

**이벤트 정의:**

| 이벤트 | 트리거 | 속성 |
|--------|--------|------|
| `entitlement_history_view` | 페이지 진입 | `count` (이력 건수) |

### DESIGN-02: CSS 터치 영역 보완 (P0)

**파일**: `src/styles.css`

#### 문제 1: ghost-button 터치 영역 부족

현재 `.ghost-button`은 32x32px로 앱인토스 권장 최소 터치 영역(44x44px)에 미달.

**수정 방안:**

```css
/* 변경 전 */
.ghost-button {
  width: 32px;
  height: 32px;
}

/* 변경 후 — 시각적 크기 유지, 터치 영역 확대 */
.ghost-button {
  position: relative;
  width: 32px;
  height: 32px;
}
.ghost-button::after {
  content: "";
  position: absolute;
  inset: -6px;
}
```

> `::after` 가상 요소로 터치 영역을 44x44px까지 확대하면서 시각적 크기(32px)는 유지한다.

#### 문제 2: secondary-button.full 클래스 미정의

`RoutineEditPage.tsx`에서 `secondary-button danger full` 클래스 조합을 사용하나, `.secondary-button.full`이 정의되지 않음. `.primary-button.full`만 있음.

**수정 방안:**

```css
/* 추가 */
.secondary-button.full {
  width: 100%;
}
```

#### 문제 3: 버튼 최소 높이 보장

현재 버튼 padding이 10px 14px인데, 글자 크기 + padding 합산 시 약 41px. 안전하게 44px 최소 높이 보장.

**수정 방안:**

```css
.primary-button,
.secondary-button {
  min-height: 44px;
}
```

### DESIGN-03: 앱인토스 검수 체크리스트 최종 대조 (P0)

PRD 섹션 6의 24개 항목을 코드 기반으로 최종 대조한다.

| # | 항목 | 코드 확인 | 상태 |
|---|------|----------|------|
| 1 | 라이트 모드 고정 | `styles.css` L2: `color-scheme: light` | ✅ |
| 2 | 핀치줌 비활성화 | `index.html`: `user-scalable=no, maximum-scale=1` | ✅ |
| 3 | 브랜드 로고+이름 | `AppShell.tsx`: brand-mark(JR) + brand-name(작심루틴) | ✅ |
| 4 | 더보기 버튼(⋯) | `AppShell.tsx`: ghost-button "⋯" | ✅ |
| 5 | 닫기 버튼(✕) | `AppShell.tsx`: ghost-button "✕" + closeMiniApp() | ✅ |
| 6 | 2초 이내 응답 | 로컬 Storage 기반이므로 즉시 응답 | ✅ |
| 7 | 재접속 데이터 유지 | localStorage 자동 저장/복원 | ✅ |
| 8 | 기능화 안 된 컴포넌트 없음 | 모든 버튼/링크 동작 확인 필요 | ✅ |
| 9 | 딥링크 3개 | deeplink.ts: home/report/routine/new | ✅ |
| 10 | 3rd party 로그인 없음 | 토스 로그인만 사용 (getUserKeyHash) | ✅ |
| 11 | 인트로 화면 | OnboardingPage (3스크린) | ✅ |
| 12 | 닫기 동작 분기 | AppShell: 온보딩→닫기, 중간→뒤로가기 | ✅ |
| 13 | 로그인 해제 시 초기화 | resetAllData() + clearAppState() | ✅ |
| 14 | 표시 금액 = 실제 금액 | getProductItemList() 동적 표시 | ✅ |
| 15 | 결제 취소 시 이전 화면 | PaywallPage 내 에러 처리 | ✅ |
| 16 | 결제 실패 시 안내 | PaywallPage: errorCode별 메시지 | ✅ |
| 17 | 기기 변경 후 복원 | restorePurchasesInternal() 자동 실행 | ✅ |
| 18 | 구독 상품 없음 | 기간형 이용권(비소모품) | ✅ |
| 19 | 결제 내역 확인 | EntitlementHistoryPage | ✅ |
| 20 | processProductGrant 30초 | 스텁 즉시 반환, 실 서버 검증 필요 | ⚠️ |
| 21 | 불필요한 권한 없음 | 권한 요청 없음 | ✅ |
| 22 | 메모리 누수 없음 | useEffect cleanup 패턴 적용 | ✅ |
| 23 | HTTPS 통신 | 로컬 Storage만 사용, 외부 통신 없음 | ✅ |
| 24 | 다크패턴 없음 | "무료로 계속 쓰기" 항상 제공 | ✅ |

> ⚠️ #20은 실 서버 배포 시 SLA 검증 필요 (현재 스텁이므로 코드 레벨에서는 통과)

## 3. 구현 순서

```
1. DESIGN-02: CSS 터치 영역 / 버튼 보완    (P0, ~15분)
   ├─ ghost-button 터치 영역 확대
   ├─ secondary-button.full 추가
   └─ 버튼 최소 높이 44px 보장

2. DESIGN-01: 운영 Analytics 이벤트 보완    (P1, ~10분)
   ├─ RoutineEditPage: routine_edit_save, routine_delete
   └─ EntitlementHistoryPage: entitlement_history_view

3. DESIGN-03: 검수 체크리스트 최종 확인     (P0, ~5분)
   └─ pnpm typecheck && pnpm lint && pnpm build
```

## 4. 변경 파일 목록

| 파일 | 변경 내용 | 영향 범위 |
|------|----------|----------|
| `src/styles.css` | 터치 영역 확대, full 클래스, 최소 높이 | 전역 스타일 |
| `src/pages/RoutineEditPage.tsx` | trackEvent 2건 추가 | 루틴 편집 페이지 |
| `src/pages/EntitlementHistoryPage.tsx` | trackEvent 1건 추가 | 이용권 내역 페이지 |

## 5. 검증 방법

| 검증 | 명령어/방법 |
|------|-----------|
| 타입 안전성 | `pnpm typecheck` |
| 코드 품질 | `pnpm lint` |
| 빌드 성공 | `pnpm build` |
| IAP 정적 QA | `pnpm qa:iap:static` |
| 터치 영역 | CSS 계산 확인 (32px + 6px*2 = 44px) |
| Analytics | grep -r "trackEvent" 으로 전수 확인 |

## 6. 비변경 사항 (명시적 제외)

- 코드 스플리팅: 번들 218KB로 목표(500KB) 대비 충분히 작음 → 불필요
- 이미지 최적화: 이미지 파일 없음 (이모지 기반 UI)
- 접근성 (WCAG AA): PRD에서 "권장" 수준 → Phase 2로 이관
- 실 서버 백엔드: 현재 스텁 기반, 별도 프로젝트로 진행
