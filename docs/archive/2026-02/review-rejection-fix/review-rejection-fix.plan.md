# Plan: review-rejection-fix (앱 심사 반려 사유 수정)

## 개요

다른 앱의 심사 반려 사유 4건을 작심루틴에 대입하여 해당되는 항목을 사전 수정한다.
심사 통과율을 높이고 UX 가이드라인 준수를 보장하기 위한 예방적 수정.

## 배경

타 앱 반려 사유 (Android Galaxy S22 Ultra, 버전 16):
1. 앱 내 기능의 랜딩스킴이 접속되지 않음
2. 내비게이션에 브랜드 로고가 표시되지 않음
3. 불필요한 화면 확대·축소 제스처 활성화
4. 내비게이션 바 뒤로가기 + 미니앱 자체 뒤로가기 중복 노출

## 점검 결과

| # | 반려 사유 | 해당 여부 | 위험도 | 조치 필요 |
|---|----------|----------|--------|----------|
| 1 | 랜딩스킴 접속 불가 | 부분 해당 | 중 | O |
| 2 | 브랜드 로고 미표시 | 확인 필요 | 중 | O |
| 3 | 확대·축소 제스처 | 해당 없음 | - | X |
| 4 | 뒤로가기 중복 | **해당** | **높음** | **O** |

## 요구사항

### REQ-1: 뒤로가기 버튼 중복 해소 (위험도: 높음)

**현상:**
- `granite.config.ts`에서 `withBackButton: true` → 플랫폼 네이티브 뒤로가기 표시
- 서브 페이지(RoutineNewPage, RoutineDetailPage, RoutineEditPage, EntitlementHistoryPage, RoutineNotFound)에 자체 `arrow_back` 버튼 존재
- 토스 앱 내 실행 시 뒤로가기 2개 동시 노출

**수정 방안:**
- `granite.config.ts`에서 `withBackButton: false`로 변경
- 앱 자체 뒤로가기 버튼은 유지 (이미 페이지별로 적절한 네비게이션 로직 구현됨)
- AppShell의 닫기(X) 버튼은 유지 (미니앱 종료용)

**대상 파일:**
- `granite.config.ts`

### REQ-2: 딥링크 지원 경로 확장 (위험도: 중)

**현상:**
- `SUPPORTED_TARGETS`가 3개 경로로 제한: `/home`, `/report`, `/routine/new`
- `/settings`, `/paywall` 등 주요 경로가 딥링크 미지원

**수정 방안:**
- `SUPPORTED_TARGETS`에 `/settings`, `/paywall` 추가
- `/routine/:id` 패턴의 동적 딥링크 지원 추가

**대상 파일:**
- `src/app/deeplink.ts`

### REQ-3: 브랜드 로고 URL 접근성 확인 (위험도: 중)

**현상:**
- `granite.config.ts`의 `brand.icon` URL이 Supabase 퍼블릭 스토리지를 참조
- URL 접근 불가 시 내비게이션에 브랜드 로고 미표시

**수정 방안:**
- 로고 URL 접근 가능 여부 확인
- 접근 불가 시 로컬 에셋으로 대체하거나 URL 수정

**대상 파일:**
- `granite.config.ts` (필요 시)

## 수정 대상 파일 목록

| 파일 | REQ | 변경 내용 |
|------|-----|----------|
| `granite.config.ts` | REQ-1, REQ-3 | withBackButton: false, 로고 URL 확인 |
| `src/app/deeplink.ts` | REQ-2 | SUPPORTED_TARGETS 확장, 동적 경로 패턴 |

## 수정하지 않는 항목

- **반려 사유 #3 (확대·축소)**: `index.html`에 이미 `user-scalable=no` 설정 완료
- **서브 페이지 자체 뒤로가기 버튼**: 제거하지 않음 (앱 자체 네비게이션으로 유지)
- **AppShell 헤더**: 유지 (웹 폴백 + 브랜드 표시 역할)

## 완료 기준

- [ ] 토스 앱 내에서 뒤로가기 버튼이 1개만 표시됨
- [ ] 딥링크로 `/settings`, `/paywall`, `/routine/:id` 접근 가능
- [ ] 브랜드 로고 URL 정상 응답 확인
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm build` 성공

## 우선순위

1. REQ-1 (뒤로가기 중복) — 심사 반려 직결
2. REQ-2 (딥링크 확장) — 심사 반려 가능성
3. REQ-3 (로고 확인) — 심사 반려 가능성
