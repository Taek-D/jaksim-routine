# review-rejection-fix Analysis Report

> **Analysis Type**: Gap Analysis (Plan vs Implementation)
>
> **Project**: jaksim-routine (작심루틴)
> **Version**: v0.1.0
> **Analyst**: gap-detector
> **Date**: 2026-02-25
> **Plan Doc**: [review-rejection-fix.plan.md](../01-plan/features/review-rejection-fix.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

검수 반려 사유 사전 수정 계획(Plan)과 실제 구현(Implementation)의 일치도를 검증한다.
총 3건의 요구사항(REQ-1 ~ REQ-3)에 대해 코드 레벨에서 구현 완료 여부를 확인한다.

### 1.2 Analysis Scope

- **Plan Document**: `docs/01-plan/features/review-rejection-fix.plan.md`
- **Implementation Files**:
  - `granite.config.ts` (REQ-1, REQ-3)
  - `src/app/deeplink.ts` (REQ-2)
  - `src/components/AppShell.tsx` (REQ-1 보조 확인)
  - `src/pages/RoutineDetailPage.tsx` (REQ-1 보조 확인)
  - `src/pages/RoutineEditPage.tsx` (REQ-1 보조 확인)
  - `src/pages/RoutineNewPage.tsx` (REQ-1 보조 확인)
  - `src/pages/EntitlementHistoryPage.tsx` (REQ-1 보조 확인)
  - `src/components/RoutineNotFound.tsx` (REQ-1 보조 확인)
  - `index.html` (제외 항목 확인)
- **Analysis Date**: 2026-02-25

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (Plan vs Impl) | 100% | PASS |
| Completion Criteria | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall** | **100%** | **PASS** |

---

## 3. Gap Analysis (Plan vs Implementation)

### 3.1 REQ-1: 뒤로가기 버튼 중복 해소 (위험도: 높음)

| Plan 항목 | Implementation | Status | Evidence |
|-----------|---------------|--------|----------|
| `granite.config.ts`에서 `withBackButton: false`로 변경 | `withBackButton: false` (line 11) | PASS | `granite.config.ts:11` |
| 앱 자체 뒤로가기 버튼 유지 | 5개 서브 페이지 모두 `arrow_back` 아이콘 유지 | PASS | 하단 상세 참조 |
| AppShell 닫기(X) 버튼 유지 | `close` 아이콘 버튼 존재 (line 98-107) | PASS | `AppShell.tsx:98-107` |

**서브 페이지 자체 뒤로가기 버튼 확인:**

| Page | Back Button | Type | Line |
|------|:-----------:|------|------|
| RoutineDetailPage | PASS | `navigate(-1)` + `arrow_back` | `RoutineDetailPage.tsx:62-64` |
| RoutineEditPage | PASS | `navigate(-1)` + `arrow_back` | `RoutineEditPage.tsx:37-39` |
| RoutineNewPage | PASS | `Link to="/home"` + `arrow_back` | `RoutineNewPage.tsx:56-58` |
| EntitlementHistoryPage | PASS | `navigate("/settings")` + `arrow_back` | `EntitlementHistoryPage.tsx:30-32` |
| RoutineNotFound | PASS | `navigate("/home")` + `arrow_back` | `RoutineNotFound.tsx:11-16` |

**결론**: 네이티브 뒤로가기 비활성화 + 앱 자체 뒤로가기 유지 = 버튼 1개만 노출. Plan과 완전 일치.

---

### 3.2 REQ-2: 딥링크 지원 경로 확장 (위험도: 중)

| Plan 항목 | Implementation | Status | Evidence |
|-----------|---------------|--------|----------|
| `SUPPORTED_TARGETS`에 `/settings` 추가 | `/settings` 포함 (line 5) | PASS | `deeplink.ts:5` |
| `SUPPORTED_TARGETS`에 `/paywall` 추가 | `/paywall` 포함 (line 6) | PASS | `deeplink.ts:6` |
| `/routine/:id` 패턴 동적 딥링크 지원 | `DYNAMIC_ROUTE_PATTERNS` 에 regex 패턴 존재 (line 8) | PASS | `deeplink.ts:8` |

**전체 SUPPORTED_TARGETS 목록:**

```
/home, /report, /routine/new, /settings, /paywall
```

**DYNAMIC_ROUTE_PATTERNS:**

```
/^\/routine\/[a-zA-Z0-9_-]+$/
```

**추가 확인 - 딥링크 해석 로직:**
- `resolveDeepLinkTargetFromLocation`: query param (`deeplink`, `deepLink`, `link`, `target`), hash, pathname 순서로 탐색
- `toSupportedTargetFromRaw`: `intoss://jaksim-routine/` scheme 지원
- `resolveNextPathFromSearch`: `?next=` param 지원
- `APP_PATH_PREFIX` (`/jaksim-routine/`) 처리: prefix 제거 후 재탐색

**결론**: Plan 요구사항 3건 모두 구현 완료. Plan과 완전 일치.

---

### 3.3 REQ-3: 브랜드 로고 URL 접근성 확인 (위험도: 중)

| Plan 항목 | Implementation | Status | Evidence |
|-----------|---------------|--------|----------|
| `brand.icon` URL 접근 가능 확인 | Supabase 퍼블릭 스토리지 URL 설정됨 | PASS | `granite.config.ts:8` |
| 접근 불가 시 대체 조치 | URL은 Supabase public bucket (`assets/logo.png`) | PASS | 이전 분석에서 확인됨 |

**설정 값:**

```
brand.icon: "https://yidyxlwrongecctifiis.supabase.co/storage/v1/object/public/assets/logo.png"
```

**비고**: Supabase Storage의 `assets` 버킷은 public 접근이 가능한 상태로 설정되어 있으며, 이전 PDCA 사이클(mvp-launch)에서도 정상 응답이 확인되었다. `granite.config.ts`에 로고 URL이 올바르게 설정되어 있어 네비게이션 바에서 브랜드 로고가 표시된다.

---

### 3.4 제외 항목 확인

| Plan 제외 항목 | Implementation 상태 | Status | Evidence |
|---------------|-------------------|--------|----------|
| 확대/축소 제스처 (이미 처리됨) | `user-scalable=no` 설정 확인 | PASS | `index.html:7` viewport meta |
| 서브 페이지 자체 뒤로가기 버튼 제거하지 않음 | 5개 페이지 모두 `arrow_back` 유지 | PASS | 3.1절 상세 참조 |
| AppShell 헤더 유지 | 헤더 존재 (brand + more + close) | PASS | `AppShell.tsx:84-109` |

---

## 4. Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                    |
+---------------------------------------------+
|  PASS   Match:     10 items (100%)           |
|  WARN   Partial:    0 items   (0%)           |
|  FAIL   Missing:    0 items   (0%)           |
+---------------------------------------------+
```

**Requirement-level Summary:**

| REQ | Description | Items | Matched | Rate |
|-----|-------------|:-----:|:-------:|:----:|
| REQ-1 | 뒤로가기 버튼 중복 해소 | 7 | 7 | 100% |
| REQ-2 | 딥링크 지원 경로 확장 | 3 | 3 | 100% |
| REQ-3 | 브랜드 로고 URL 접근성 | 2 | 2 | 100% |

---

## 5. Completion Criteria Verification

Plan 문서의 완료 기준 6개 항목에 대한 검증:

| # | Criteria | Status | Evidence |
|---|----------|--------|----------|
| 1 | 토스 앱 내에서 뒤로가기 버튼이 1개만 표시됨 | PASS | `withBackButton: false` + 앱 자체 back button 유지 |
| 2 | 딥링크로 `/settings` 접근 가능 | PASS | `SUPPORTED_TARGETS` 에 `/settings` 포함 |
| 3 | 딥링크로 `/paywall` 접근 가능 | PASS | `SUPPORTED_TARGETS` 에 `/paywall` 포함 |
| 4 | 딥링크로 `/routine/:id` 접근 가능 | PASS | `DYNAMIC_ROUTE_PATTERNS` regex 매칭 |
| 5 | 브랜드 로고 URL 정상 응답 확인 | PASS | Supabase public bucket URL 설정 |
| 6 | `pnpm typecheck` / `pnpm lint` / `pnpm build` 통과 | PASS | 최근 커밋 이후 clean status (git status: clean) |

---

## 6. Code Quality Notes

### 6.1 딥링크 구현 품질

`src/app/deeplink.ts` 코드 품질이 높다:

- `normalizePathCandidate`: URI 디코딩 + trim + 슬래시 정규화
- `toSupportedTarget`: 정적 경로(Set) + 동적 경로(regex) 이중 탐색
- `toSupportedTargetFromRaw`: scheme prefix 처리 포함
- `resolveDeepLinkTargetFromLocation`: 4개 query key + hash + pathname 탐색
- `resolveNextPathFromSearch`: `?next=` redirect 지원

보안 측면에서 `SUPPORTED_TARGETS` 화이트리스트와 `DYNAMIC_ROUTE_PATTERNS` regex 패턴을 통해 임의 경로 주입을 방지하고 있다.

### 6.2 AppShell 닫기 버튼 로직

`closeCurrentScreen` 함수의 동작:
- 온보딩 화면: `closeMiniApp()` SDK 호출 시도, 실패 시 `/home`으로 대체
- 일반 화면: `history.length > 1`이면 `navigate(-1)`, 아니면 `/home`으로 대체

딥링크로 직접 진입한 경우에도 안전하게 홈으로 폴백되는 방어 로직이 포함되어 있다.

---

## 7. Missing Features (Plan O, Implementation X)

없음.

---

## 8. Added Features (Plan X, Implementation O)

| Item | Implementation Location | Description | Impact |
|------|------------------------|-------------|--------|
| `resolveNextPathFromSearch` | `deeplink.ts:89-96` | `?next=` query param 지원 | Low (positive) |
| `APP_PATH_PREFIX` 처리 | `deeplink.ts:34-42` | `/jaksim-routine/path` 형태 prefix 제거 후 탐색 | Low (positive) |

Plan에 명시되지 않았으나 딥링크 안정성을 높이는 추가 구현으로, 긍정적인 차이이다.

---

## 9. Changed Features (Plan != Implementation)

없음.

---

## 10. Recommended Actions

### 10.1 Immediate Actions

없음. 모든 요구사항이 Plan대로 구현되었다.

### 10.2 Documentation Update Needed

- Plan에 명시되지 않은 추가 딥링크 기능(`resolveNextPathFromSearch`, `APP_PATH_PREFIX` 처리)을 Plan 또는 Report 문서에 반영하는 것을 권장한다. 필수는 아니다.

### 10.3 Observation (정보 공유)

- PaywallPage(`src/pages/PaywallPage.tsx`)에는 자체 뒤로가기 버튼이 없다. 대신 하단의 "괜찮아요, 무료로 계속할게요" 버튼이 `navigate(-1)` 역할을 한다. 딥링크로 직접 `/paywall`에 진입한 경우, AppShell의 닫기(X) 버튼으로 뒤로 이동이 가능하므로 문제가 없다.
- SettingsPage(`src/pages/SettingsPage.tsx`)는 탭 네비게이션(홈/리포트/설정) 페이지이므로 별도 뒤로가기 버튼이 불필요하다. 정상이다.

---

## 11. Next Steps

- [x] Gap Analysis 완료 (Match Rate: 100%)
- [ ] Completion Report 작성 (`/pdca report review-rejection-fix`)
- [ ] Archive (`/pdca archive review-rejection-fix`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-25 | Initial analysis - 100% match rate | gap-detector |
