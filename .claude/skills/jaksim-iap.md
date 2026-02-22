---
name: jaksim-iap
description: IAP 결제, 프리미엄 구독, 환불 처리 관련 작업 시 적용. Use when working with IAP, payment, purchase, premium, trial, entitlement, refund, subscription.
---

# IAP & Entitlement

## 개요
토스 미니앱 IAP(In-App Purchase)를 통한 프리미엄 구독 관리.
무료체험(7일) → 월/연 구독 → 환불 취소 흐름을 처리한다.

## 핵심 파일
- `src/integrations/tossSdk.ts` - 토스 SDK 브릿지 (IAP, Identity)
- `src/backend/contracts.ts` - EntitlementBackend 인터페이스
- `src/backend/stub.ts` - localStorage 기반 백엔드 스텁
- `src/state/AppStateProvider.tsx` - purchasePremium, startFreeTrial, restorePurchases

## 상품 구성
| SKU | 이름 | 기간 |
|-----|------|------|
| `premium_monthly` | 월 이용권 | 30일 |
| `premium_yearly` | 연 이용권 | 365일 |
| `trial` | 무료체험 | 7일 (1회 한정) |

## IAP 결제 흐름
```
1. createIapOrder(sku) → 토스 SDK 브릿지로 주문 생성
2. entitlementBackendStub.registerPendingOrder() → 대기 주문 등록
3. entitlementBackendStub.processProductGrant() → 상품 부여 처리
4. entitlementBackendStub.completeProductGrant() → 부여 완료
5. completeIapProductGrant(orderId) → SDK에 완료 알림
6. getPurchaseEntitlement() → 최종 상태 동기화
```

## 토스 SDK 브릿지 패턴
- 브릿지 탐색 순서: `window.TossMiniApp` → `tossMiniApp` → `appsInToss`
- IAP 브릿지: 루트의 `.IAP`, `.iap`, `.TossIAP`, 루트 자체 순서로 탐색
- 모든 호출에 `typeof fn === "function"` 체크 필수
- 응답 필드명 변형 대응: `orderId`/`orderID`/`id`, `sku`/`productId`
- `createOneTimePurchaseOrder`에 3가지 payload 포맷 시도: `sku`, `{ sku }`, `{ productId: sku }`

## 환불 처리
1. `getIapCompletedOrRefundedOrders()`로 환불 내역 조회
2. 현재 주문이 환불된 경우 `revokePurchaseEntitlement()` 호출
3. `lastRefundedOrderId`, `refundNoticeShown` 으로 환불 배너 표시
4. 배너 dismiss 시 `refundNoticeShown: true`

## 무료체험 흐름
1. `getTrialGate()` → `trialUsed` 확인
2. 미사용이면 `startTrial()` → 7일간 프리미엄 부여
3. `trialUsedLocal: true` 설정 (로컬 중복 방지)
4. 만료 후 `shouldShowTrialExpiredBanner()` → 만료 배너 표시

## 구매 복원 (앱 시작 시 자동 실행)
1. `getIapPendingOrders()` → 런타임 대기 주문
2. `getIapCompletedOrRefundedOrders()` → 완료/환불 주문
3. 대기 주문에 대해 grant → complete 재시도
4. 환불된 주문이 현재 구독이면 revoke 처리

## 주의사항
- userKeyHash는 `getLoginUserKeyHash()`로 획득, 불가 시 `"local-user"` 폴백
- 백엔드 스텁은 localStorage 기반이므로 실제 서버와 다를 수 있음
- `entitlementRestoreDoneRef`로 복원 중복 실행 방지
