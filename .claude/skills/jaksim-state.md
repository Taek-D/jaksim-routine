---
name: jaksim-state
description: 상태 관리, 저장소, AppStateProvider 관련 작업 시 적용. Use when working with state, context, provider, storage, localStorage, hydration, persistence.
---

# State Management & Storage

## 개요
React Context 기반 전역 상태 관리. localStorage에 자동 저장/복원하는 persistence 계층 포함.

## 핵심 파일
- `src/state/AppStateProvider.tsx` - 전역 상태 Provider, 모든 액션 함수
- `src/state/selectors.ts` - 파생 상태 조회 함수
- `src/storage/appStateRepository.ts` - localStorage 읽기/쓰기
- `src/storage/storageDriver.ts` - StorageDriver 인터페이스
- `src/domain/models.ts` - AppState 타입 정의

## AppState 구조
```typescript
interface AppState {
  schemaVersion: number;        // 현재 1
  onboardingCompleted: boolean;
  routines: Routine[];
  checkins: Checkin[];
  badges: Badge[];
  entitlement: Entitlement;     // 프리미엄/체험판 상태
}
```

## 저장소
- 키: `"jaksim-routine.app-state.v1"`
- 드라이버: `browserStorageDriver` (localStorage 래핑)
- async 인터페이스 (`StorageDriver`)로 추상화되어 있음
- 백엔드 스텁 별도 키: `"jaksim-routine.entitlement-backend.stub.v1"`

## Hydration 패턴
```
1. useState(createInitialAppState()) → 초기값으로 시작
2. useEffect → loadAppState() → setState(loaded) → setHydrated(true)
3. hydrated 이후 모든 state 변경 시 자동 saveAppState()
4. hydrated 전에는 save 하지 않음 (초기값 덮어쓰기 방지)
```

## 제공하는 액션 함수
| 함수 | 설명 |
|------|------|
| `completeOnboarding()` | 온보딩 완료 처리 |
| `createRoutine(input)` | 루틴 생성 (FREE_ROUTINE_LIMIT 체크) |
| `updateRoutine(id, input)` | 루틴 수정 |
| `deleteRoutine(id)` | 루틴 삭제 (체크인도 함께 삭제) |
| `checkinRoutine(id, status, note?)` | 체크인 (배지 자동 부여) |
| `restartRoutine(id)` | 루틴 재시작 (restartAt 갱신) |
| `startFreeTrial()` | 7일 무료체험 시작 |
| `purchasePremium(sku)` | IAP 구매 |
| `restorePurchases()` | 구매 복원 |
| `dismissTrialExpiredBanner()` | 체험판 만료 배너 닫기 |
| `dismissRefundRevokedBanner()` | 환불 배너 닫기 |
| `dismissBadgeNotice()` | 배지 알림 닫기 |
| `resetAllData()` | 전체 데이터 초기화 |

## 파생 상태
| 값 | 설명 |
|----|------|
| `hydrated` | localStorage에서 로딩 완료 여부 |
| `activeRoutines` | archivedAt이 없는 루틴 목록 |
| `isPremiumActive` | premiumUntil이 미래인지 여부 |
| `showTrialExpiredBanner` | 체험판 만료 배너 표시 조건 |
| `showRefundRevokedBanner` | 환불 revoke 배너 표시 조건 |
| `badgeNotice` | 배지 알림 큐의 첫 번째 항목 |

## 사용 방법
```typescript
import { useAppState } from "../state/AppStateProvider";

function MyComponent() {
  const { state, isPremiumActive, createRoutine } = useAppState();
  // ...
}
```

## 핵심 규칙
- `setState` 호출 시 반드시 **콜백 패턴** 사용: `setState(prev => ...)`
- `useAppState()`는 반드시 `AppStateProvider` 하위에서 호출
- 배지 알림은 **큐** 방식 (badgeNoticeQueue) - dismiss 시 다음 것 표시
- entitlement 복원은 앱 시작 시 1회만 실행 (`entitlementRestoreDoneRef`)
- hydrated 전에는 save 방지, archive 정책 적용 방지

## 자주 사용하는 명령어
- `pnpm typecheck` - AppState 타입 변경 후 전체 검증
