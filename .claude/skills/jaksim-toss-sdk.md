---
name: jaksim-toss-sdk
description: 토스 SDK 통합, 미니앱 API, IAP 브릿지, 딥링크 관련 작업 시 적용. Use when working with toss, SDK, bridge, mini app, deeplink, identity, login, user key, granite, apps-in-toss.
---

# Toss SDK Integration

## 개요
토스 미니앱(apps-in-toss) SDK와의 통합 레이어. window 브릿지 패턴으로 네이티브 기능에 접근한다.

## 핵심 파일
- `src/integrations/tossSdk.ts` - 토스 SDK 브릿지 전체
- `src/app/deeplink.ts` - 딥링크 파싱
- `src/analytics/analytics.ts` - 분석 이벤트 전송
- `src/config/appConfig.ts` - 환경 설정 (앱 ID 등)

## SDK 브릿지 탐색 패턴

### 루트 객체 탐색
```typescript
// 3가지 후보를 순서대로 탐색
const root = window.TossMiniApp ?? window.tossMiniApp ?? window.appsInToss;
```

### IAP 브릿지 탐색
```typescript
// 루트에서 4가지 경로 탐색
const iap = root?.IAP ?? root?.iap ?? root?.TossIAP ?? root;
```

### 안전한 호출 패턴 (필수)
```typescript
// 모든 SDK 호출은 이 패턴을 따름
if (typeof bridge?.someMethod === "function") {
  try {
    const result = await bridge.someMethod(args);
    // normalize result...
  } catch (err) {
    // graceful fallback
  }
}
```

## 주요 API

### Identity
| 함수 | 설명 |
|------|------|
| `getLoginUserKeyHash()` | 사용자 고유 해시 (로그인 상태 시) |

- 실패 시 `"local-user"` 폴백 사용

### IAP (In-App Purchase)
| 함수 | 설명 |
|------|------|
| `createIapOrder(sku)` | 주문 생성 (결제 UI 표시) |
| `completeIapProductGrant(orderId)` | 상품 부여 완료 알림 |
| `getIapPendingOrders()` | 대기 중인 주문 조회 |
| `getIapCompletedOrRefundedOrders()` | 완료/환불 주문 조회 |

### createIapOrder 상세
- 3가지 payload 포맷을 순차 시도:
  1. `createOneTimePurchaseOrder(sku)` (문자열)
  2. `createOneTimePurchaseOrder({ sku })` (객체)
  3. `createOneTimePurchaseOrder({ productId: sku })` (토스 변형)
- 응답 필드 정규화: `orderId` / `orderID` / `id` → `orderId`

### Mini App
| 함수 | 설명 |
|------|------|
| `setMiniAppTitle(title)` | 미니앱 타이틀바 텍스트 설정 |
| `closeMiniApp()` | 미니앱 종료 |

## 딥링크

### 형식
```
toss://mini-app?appKey=작심루틴&path=/routine/123
```

### 파싱 (`src/app/deeplink.ts`)
- URL 파라미터에서 `path` 추출
- React Router navigate와 연결

## 분석 이벤트 (`src/analytics/analytics.ts`)
- `logEvent(name, params)` - 토스 분석 브릿지로 이벤트 전송
- 브릿지 없으면 console.log 폴백

## 중요 규칙
1. **typeof 체크 필수**: 모든 브릿지 함수 호출 전 `typeof fn === "function"` 확인
2. **try-catch 필수**: 모든 SDK 호출을 try-catch로 감싸기
3. **응답 정규화**: 필드명 변형(orderId/orderID/id 등) 모두 대응
4. **graceful degradation**: SDK 없는 환경(브라우저 개발)에서도 앱이 동작해야 함
5. **다중 payload 시도**: createOrder는 3가지 포맷 순차 시도

## 자주 사용하는 명령어
- `pnpm typecheck` - SDK 타입 변경 후 전체 검증
- `pnpm qa:iap:static` - IAP 흐름 정적 분석
