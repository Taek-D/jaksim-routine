# Plan: MVP 런칭 (작심루틴)

## 메타
| 항목 | 내용 |
|------|------|
| Feature | mvp-launch |
| PRD 참조 | docs/PRD.md (v1.1) |
| 작성일 | 2026-02-22 |
| 상태 | Plan |
| 우선순위 | P0 |

## 1. 개요

### 목적
작심루틴 앱인토스 미니앱의 MVP 런칭을 위한 전체 Plan.
PRD v1.1 기준으로 구현 상태를 분석하고, 미완성 항목과 검수 통과를 위한 작업을 정리한다.

### PRD 핵심 요구사항
- 루틴 생성/편집/삭제 (Free 최대 3개)
- 매일 원탭 체크인 (완료/건너뜀) + 한줄 메모
- 스트릭/배지 5종
- 주간 리포트 (월~일, KST)
- "다시 시작하기" 복귀 UX
- IAP 기간형 이용권 (월/연) + 7일 무료체험
- 앱인토스 검수 체크리스트 통과

## 2. 현재 구현 상태 분석

### 구현 완료 (Core Logic)

| 영역 | 파일 | 상태 |
|------|------|------|
| 도메인 모델 | `src/domain/models.ts` | ✅ Routine, Checkin, Badge, Entitlement 타입 정의 완료 |
| 스트릭 계산 | `src/domain/progress.ts` | ✅ KST 기반, 대상 요일 건너뛰기, 최대 4000일 탐색 |
| 배지 부여 | `src/domain/progress.ts` | ✅ 5종 (FIRST_CHECKIN, STREAK_3/7/14, COMEBACK) |
| 주간 리포트 | `src/domain/progress.ts` | ✅ 완료율, 전주 대비, 최고 요일, 코멘트 |
| 상태 관리 | `src/state/AppStateProvider.tsx` | ✅ Context 기반, 전체 CRUD + IAP 액션 |
| 로컬 저장 | `src/storage/` | ✅ localStorage, StorageDriver 추상화 |
| IAP 결제 | `src/integrations/tossSdk.ts` | ✅ 브릿지 탐색, 방어적 호출, 필드명 정규화 |
| IAP 백엔드 | `src/backend/stub.ts` | ✅ localStorage 기반 스텁 (체험판/구매/복원/환불) |
| 딥링크 | `src/app/deeplink.ts` | ✅ 3개 경로 지원 (home/report/routine/new) |
| 날짜 유틸 | `src/utils/date.ts` | ✅ KST 기반 전체 구현 |
| 템플릿 | `src/domain/templates.ts` | ✅ 5종 (운동/공부/절약/정리/독서) |
| 분석 | `src/analytics/analytics.ts` | ✅ 토스 Analytics 브릿지 |

### 구현 완료 (UI Pages)

| 화면 | 파일 | 상태 | 비고 |
|------|------|------|------|
| 온보딩 (OB-1~3) | `OnboardingPage.tsx` | ✅ | 확정 카피 적용 |
| 홈 (오늘 체크인) | `HomePage.tsx` | ✅ | 스트릭, 체크인, 배너 |
| 루틴 생성 | `RoutineNewPage.tsx` | ✅ | 템플릿 5종 + 커스텀 |
| 루틴 상세 | `RoutineDetailPage.tsx` | ✅ | 14일 기록, 재시작 |
| 루틴 편집 | `RoutineEditPage.tsx` | ✅ | 제목/요일/목표 수정 |
| 주간 리포트 | `ReportPage.tsx` | ✅ | 주간 이동, 배지 |
| 페이월 | `PaywallPage.tsx` | ✅ | 상품 동적 표시, 체험판 |
| 설정 | `SettingsPage.tsx` | ✅ | 복원, 초기화, 약관 |
| 이용권 내역 | `EntitlementHistoryPage.tsx` | ✅ | 주문 이력 |
| 앱 셸 | `AppShell.tsx` | ✅ | 내비게이션 바 (로고/더보기/닫기) |

### 구현 완료 (Components)

| 컴포넌트 | 파일 | 상태 |
|----------|------|------|
| 건너뜀 경고 토스트 | `WarningToast.tsx` | ✅ |
| 한줄 메모 모달 | `NoteModal.tsx` | ✅ |
| 배지 획득 오버레이 | `BadgeOverlay.tsx` | ✅ |

### 인프라

| 항목 | 상태 |
|------|------|
| Vite 빌드 | ✅ |
| TypeScript strict | ✅ |
| ESLint 9 flat config | ✅ |
| viewport meta (핀치줌 비활성화) | ✅ `index.html` |
| 라이트 모드 고정 | ✅ `color-scheme: light` |

## 3. Gap 분석 (PRD vs 구현)

### GAP-01: Analytics 이벤트 누락

| 우선순위 | 설명 |
|----------|------|
| **P0** | PRD에 명시된 이벤트 중 일부 누락 가능 |

**PRD 명시 이벤트 vs 구현 확인 필요:**

| 이벤트 | PRD | 구현 |
|--------|-----|------|
| `onboarding_view` | ✅ | ❓ 확인 필요 |
| `onboarding_complete` | ✅ | ❓ 확인 필요 |
| `routine_create_start` | ✅ | ✅ |
| `routine_create_complete` | ✅ | ✅ |
| `routine_template_select` | ✅ | ✅ |
| `home_view` | ✅ | ✅ |
| `checkin_complete` | ✅ | ✅ |
| `checkin_skip` | ✅ | ✅ |
| `routine_detail_view` | ✅ | ✅ |
| `routine_restart` | ✅ | ✅ |
| `report_view` | ✅ | ✅ |
| `report_week_change` | ✅ | ✅ |
| `paywall_view` | ✅ | ✅ |
| `paywall_start_trial` | ✅ | ✅ |
| `iap_purchase_start` | ✅ | ✅ |
| `iap_grant_success` | ✅ | ✅ |
| `iap_grant_fail` | ✅ | ✅ |
| `iap_restore_start` | ✅ | ✅ |
| `iap_restore_done` | ✅ | ✅ |
| `settings_view` | ✅ | ✅ |
| `data_reset` | ✅ | ✅ |
| `streak_milestone` | ✅ | ✅ |
| `badge_earned` | ✅ | ✅ |

**RoutineEditPage**: 편집/삭제 이벤트 없음 (PRD에 명시적 이벤트 없으나 운영 분석 필요)
**EntitlementHistoryPage**: 이벤트 없음 (운영 분석 필요)

### GAP-02: CSS/UI 품질 검증

| 우선순위 | 설명 |
|----------|------|
| **P0** | `styles.css` 검토, 모바일 최적화, 앱인토스 UX 가이드 준수 확인 |

- 터치 영역 (최소 44x44px)
- 명도 대비 (WCAG AA)
- 2초 이내 인터랙션 응답
- 빈 상태 / 에러 상태 UI
- 해요체 UX 라이팅

### GAP-03: 빌드 & 번들 최적화

| 우선순위 | 설명 |
|----------|------|
| **P1** | PRD 성능 목표: 초기 번들 500KB 이하 |

- 현재 번들 크기 미확인
- 코드 스플리팅 적용 여부 확인 필요
- 이미지 WebP 사용 여부

### GAP-04: IAP 정적 분석 QA

| 우선순위 | 설명 |
|----------|------|
| **P0** | `scripts/qa-iap-check.mjs` 결과 확인 및 IAP 5대 시나리오 검증 |

## 4. 작업 계획

### Phase A: Gap 확인 & 분석 이벤트 보완

| # | 작업 | 파일 | 우선순위 |
|---|------|------|----------|
| A-1 | Analytics 이벤트 전수 조사 (PRD 택소노미 vs 코드) | 전체 pages/ | P0 |
| A-2 | 누락 이벤트 추가 (onboarding_view, onboarding_complete 등) | `OnboardingPage.tsx` 등 | P0 |
| A-3 | RoutineEditPage에 편집/삭제 이벤트 추가 | `RoutineEditPage.tsx` | P1 |

### Phase B: UI/UX 품질 검증

| # | 작업 | 파일 | 우선순위 |
|---|------|------|----------|
| B-1 | styles.css 전체 검토 (모바일 최적화, 터치 영역) | `src/styles.css` | P0 |
| B-2 | 빈 상태 / 에러 상태 UI 점검 | 전체 pages/ | P0 |
| B-3 | UX 라이팅 점검 (해요체, 한줄 원칙, 마침표 생략) | 전체 pages/ | P0 |
| B-4 | 접근성 점검 (명도 대비, 스크린 리더) | 전체 | P1 |

### Phase C: 빌드 & 성능

| # | 작업 | 파일 | 우선순위 |
|---|------|------|----------|
| C-1 | `pnpm build` 실행 + 번들 크기 확인 | - | P0 |
| C-2 | 500KB 초과 시 코드 스플리팅 적용 | `vite.config.ts` | P1 |
| C-3 | `pnpm typecheck` + `pnpm lint` 전수 통과 확인 | - | P0 |

### Phase D: IAP QA & 검수 준비

| # | 작업 | 파일 | 우선순위 |
|---|------|------|----------|
| D-1 | `pnpm qa:iap:static` 실행 + 결과 확인 | - | P0 |
| D-2 | IAP 5대 시나리오 매뉴얼 체크리스트 작성 | docs/ | P0 |
| D-3 | 앱인토스 검수 체크리스트 자체 검수 (24개 항목) | docs/ | P0 |

## 5. 성공 기준

| 기준 | 목표 |
|------|------|
| PRD Analytics 이벤트 커버리지 | 100% (23개 이벤트) |
| TypeScript 타입체크 | 0 errors |
| ESLint | 0 errors, 0 warnings |
| 번들 크기 | < 500KB |
| 앱인토스 검수 체크리스트 | 필수 항목 100% 통과 |
| IAP 정적 분석 | 0 issues |

## 6. 리스크

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| 번들 500KB 초과 | 중간 | Vite 코드 스플리팅, 트리 셰이킹 확인 |
| 토스 SDK 브릿지 환경 차이 | 높음 | 방어적 호출 패턴 이미 적용됨 |
| processProductGrant 30초 SLA | 높음 | 백엔드 스텁이므로 즉시 반환, 실 서버 배포 시 재검증 필요 |
| styles.css 모바일 최적화 미흡 | 중간 | 실기기 테스트 필수 |

## 7. 의존성

| 외부 의존성 | 상태 |
|------------|------|
| 앱인토스 콘솔 상품 등록 | 별도 진행 필요 |
| 실 서버 백엔드 (체험판/구매) | 현재 localStorage 스텁, 서버 구현 별도 |
| 토스앱 샌드박스 테스트 환경 | 별도 설정 필요 |
| `.ait` 번들 빌드 도구 | Granite SDK 설정 확인 필요 |

## 8. 다음 단계

1. **Design 단계**: 각 Gap에 대한 상세 설계 (`/pdca design mvp-launch`)
2. **Do 단계**: Gap 수정 구현
3. **Check 단계**: gap-detector로 PRD vs 구현 최종 비교
