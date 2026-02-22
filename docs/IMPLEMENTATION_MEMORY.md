# 작심루틴 구현 메모 (2026-02-21)

## 완료 범위
- 1단계 구현 완료
  - React + TypeScript + Vite 스캐폴딩
  - 라우팅 뼈대 구성
  - 데이터 모델/Storage 레이어 분리
  - IAP/권한 백엔드 stub 인터페이스 분리
  - P0 화면 뼈대(온보딩/홈/루틴/리포트/설정/페이월)
- 2단계 구현 완료
  - 체크인 메모(선택) 입력 흐름 추가
  - 스트릭 계산 로직 추가 (목표 요일 기준 연속 COMPLETED)
  - 배지 5종 자동 획득 로직 추가
  - 주간 리포트 계산 로직 추가 (월~일, KST, 지난주 대비 증감 포함)

## 앱인토스 제약 반영
- 라이트 모드 고정 (`color-scheme: light`)
- meta viewport 핀치줌 비활성화
- 외부 링크/자사 앱 유도 없음
- 결제/체험/권한 지급은 backend stub로 분리

## 검증 결과
- `pnpm install` 성공
- `pnpm typecheck` 성공
- `pnpm lint` 성공 (react-refresh 경고 1건 수정 후 통과)
- `pnpm build` 성공

## 핵심 파일
- 스캐폴딩: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- 상태/저장: `src/state/AppStateProvider.tsx`, `src/storage/appStateRepository.ts`, `src/storage/storageDriver.ts`
- 도메인: `src/domain/models.ts`, `src/domain/progress.ts`, `src/domain/templates.ts`
- 선택자: `src/state/selectors.ts`
- 화면: `src/pages/HomePage.tsx`, `src/pages/RoutineNewPage.tsx`, `src/pages/RoutineDetailPage.tsx`, `src/pages/RoutineEditPage.tsx`, `src/pages/ReportPage.tsx`, `src/pages/SettingsPage.tsx`, `src/pages/PaywallPage.tsx`, `src/pages/OnboardingPage.tsx`

## 다음 이어서 할 일(권장)
- 체크인 메모를 prompt 대신 모달 UI로 교체
- 배지 획득 팝업(BADGE overlay) 화면 반영
- SKIPPED 경고를 토스트 컴포넌트로 반영
- 프리미엄 만료 시 초과 루틴 `archivedAt` 숨김/복원 정책 구현
- 딥링크 3종 진입 처리(`home`, `report`, `routine/new`)

## 2026-02-22 진행 메모 (1단계)
- 체크인 UX 개선 완료
  - `Home`/`RoutineDetail`의 `window.prompt` 제거 후 메모 입력 모달 적용
  - `Home`의 `window.confirm` 제거 후 건너뜀 경고 토스트 + 확인 액션 적용
- 공통 UI 컴포넌트 추가
  - `src/components/NoteModal.tsx`
  - `src/components/WarningToast.tsx`
- 스타일 추가
  - 모달 오버레이/텍스트영역/경고 토스트 스타일 반영 (`src/styles.css`)

## 2026-02-22 진행 메모 (2단계)
- 배지 획득 오버레이 반영 완료
  - `AppStateProvider`에 배지 알림 큐(신규 배지 감지/순차 표시/닫기) 추가
  - 앱 전역 오버레이 컴포넌트 추가 (`src/components/BadgeOverlay.tsx`)
  - `App`에 오버레이 렌더링 연결 (`src/app/App.tsx`)
  - 배지 오버레이 스타일 반영 (`src/styles.css`)

## 2026-02-22 진행 메모 (3단계)
- 프리미엄 만료 시 루틴 숨김/복원 정책 반영 완료
  - `AppStateProvider`에 `applyRoutineArchivePolicy` 추가
  - 비프리미엄 + 활성 루틴 3개 초과 시 초과분 `archivedAt` 자동 설정
  - 프리미엄 활성 시 `archivedAt` 자동 복원
- 홈 화면 숨김 루틴 배너 추가
  - 비프리미엄 상태에서 숨김 루틴 개수/안내/페이월 이동 버튼 표시
- 페이월 stub 흐름 연결
  - `startFreeTrial`, `purchasePremium` 액션 추가
  - Paywall에서 체험 시작/상품 구매 버튼으로 entitlement 상태 갱신

## 2026-02-22 진행 메모 (4단계)
- 딥링크 3종 진입 처리 반영 완료
  - 딥링크 파서 유틸 추가 (`src/app/deeplink.ts`)
  - 지원 타겟: `/home`, `/report`, `/routine/new`
  - 진입 소스: `?deeplink=...`, `#...`, `/jaksim-routine/...` 경로
- 라우팅 연동
  - `RootRedirect`/`OnboardingGuard`에서 딥링크 타겟을 온보딩 전후로 보존해 이동
  - `/jaksim-routine/home|report|routine/new` 별칭 라우트 추가
  - 온보딩 완료 시 `next` 파라미터 우선 이동 처리

## 2026-02-22 진행 메모 (5단계)
- 결제 복원 흐름(stub) 반영 완료
  - 계약 확장: `createOneTimePurchaseOrder`, `getPendingOrders`, `processProductGrant`, `completeProductGrant`
  - stub 저장소를 `localStorage` 기반으로 전환해 새로고침/재실행 복원 시나리오 재현 가능
  - 앱 시작 시 pending order 자동 복원 + entitlement 동기화 effect 추가
- 무료 체험 만료 1회 배너 반영 완료
  - 홈에서 만료 배너 노출 및 닫기 액션(1회 플래그 저장) 추가
- E2E 검증(Playwright) 완료
  - 결제 성공+지급 대기(pending) 상태 시 앱 진입 후 자동 복원 성공
  - 무료 체험 만료 배너: 첫 진입 노출, 닫기 후 재진입 미노출

## 2026-02-22 진행 메모 (6단계)
- 상단 내비게이션 실동작 연결 완료
  - `더보기` 메뉴(신고하기/공유하기) 오버레이 추가
  - `닫기` 동작 분기 반영: 인트로(`onboarding`)는 미니앱 종료 시도, 일반 화면은 이전 화면 이동
  - 토스 SDK 어댑터 추가 (`src/integrations/tossSdk.ts`) 및 `openURL`/`close` 연동
- 분석 이벤트 계층 추가 완료
  - Analytics 어댑터 추가 (`src/analytics/analytics.ts`)
  - 이벤트 연결: `home_view`, `checkin_complete`, `checkin_skip`, `report_view`
- 스모크 검증(Playwright) 완료
  - 더보기 메뉴 액션 노출 확인
  - 이벤트 4종 발생 확인
  - 닫기 동작 분기 확인 (중간 화면: 뒤로, 인트로: 홈 fallback)

## 2026-02-22 진행 메모 (7단계)
- 설정 필수 항목 보강 완료
  - `이용권 복원하기` 버튼 연결 (`restorePurchases`)
  - `이용권 내역 보기` 화면 추가 (`/settings/entitlements`)
  - 고객센터 메일/이용약관/개인정보처리방침 버튼 추가 (`openURL` 어댑터 사용)
- 복원/내역 데이터 계층 확장
  - backend 계약에 `getCompletedOrRefundedOrders` 추가
  - stub에 완료 주문 이력 저장(`completedOrdersByUser`) 및 조회 추가
  - 수동 복원 이벤트 로깅 추가 (`iap_restore_start`, `iap_restore_done`)
- 스모크 검증(Playwright) 완료
  - 설정에서 수동 복원 후 내역 화면에 완료 주문 노출 확인
  - 설정/복원 이벤트(`settings_view`, `iap_restore_start`, `iap_restore_done`) 발생 확인

## 2026-02-22 진행 메모 (8단계)
- 루틴 생성 분석 이벤트 보강 완료
  - `routine_create_start` (루틴 생성 화면 진입 시 1회)
  - `routine_template_select` (템플릿 선택 시)
- 루틴 편집 화면 보강 완료
  - `goalPerDay`(하루 목표 횟수) 입력 UI 추가 (1~10 범위)
  - 저장 시 `updateRoutine`에 수정된 `goalPerDay` 반영
- 회귀 검증 완료
  - `npm run qa:iap:static` 통과
  - `npm run build` 통과
  - `npm run lint` 통과
- 문자열 깨짐 이슈 점검
  - 소스 파일은 UTF-8 기준 정상이며, PowerShell 기본 인코딩 출력에서만 일부 깨져 보일 수 있음을 확인
