# IAP QA Scenarios (Manual)

## Scope
- Target app: `jaksim-routine`
- Environment: Apps in Toss sandbox and production candidate build
- Date baseline: 2026-02-22

## Pre-check
1. `npm run qa:iap:static` passes.
2. `npm run build` passes.
3. Sandbox account is ready and has IAP test products.

## Scenario 1: Purchase Success
1. Enter paywall from routine limit trigger.
2. Select monthly or yearly product.
3. Complete payment.

Expected:
- Premium entitlement is active.
- `iap_purchase_start`, `iap_grant_success` events are logged.
- Product appears in entitlement history as `COMPLETED`.

## Scenario 2: Purchase Cancel
1. Enter paywall.
2. Start payment.
3. Cancel payment in purchase sheet.

Expected:
- Premium entitlement does not change.
- Paywall remains usable.
- `iap_grant_fail` event is logged with cancel/fail code.

## Scenario 3: Grant Fail / Retry
1. Force grant failure condition (server or stub fail path).
2. Start payment.

Expected:
- User sees failure notice.
- `iap_grant_fail` is logged.
- Retry should still work afterwards.

## Scenario 4: Restore Pending Orders
1. Create pending order state (payment done, app closed before completion).
2. Re-open app and trigger restore (auto or settings restore button).

Expected:
- Pending order is granted and completed.
- `iap_restore_start`, `iap_restore_done` are logged.
- `restoredCount` reflects recovered orders.

## Scenario 5: Refund Revoke
1. Ensure there is an active paid entitlement.
2. Mark the order as refunded (sandbox/admin flow).
3. Re-open app and run restore flow.

Expected:
- Entitlement is revoked.
- Home shows refund revoke banner.
- `iap_refund_revoke` event is logged.
- Order history includes `REFUNDED`.

## Regression checks
1. Trial banner still works after trial expiry.
2. Free limit archive/unarchive policy still works.
3. Paywall trigger sources still map correctly (`routine_limit`, `settings`, `refund_revoked`).
