import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

function walkTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(fullPath);
    }
  }
  return files;
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function hasPatternInFiles(files, pattern) {
  return files.some((filePath) => pattern.test(read(filePath)));
}

function runCheck(name, condition, detail) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    return 0;
  }
  console.error(`[FAIL] ${name}`);
  if (detail) {
    console.error(`       ${detail}`);
  }
  return 1;
}

const srcFiles = walkTsFiles(SRC_DIR);
let failed = 0;

const requiredEvents = [
  "paywall_view",
  "paywall_start_trial",
  "iap_purchase_start",
  "iap_grant_success",
  "iap_grant_fail",
  "iap_restore_start",
  "iap_restore_done",
  "iap_refund_revoke",
];

for (const eventName of requiredEvents) {
  const pattern = new RegExp(`trackEvent\\(\\"${eventName}\\"`);
  failed += runCheck(
    `analytics event wired: ${eventName}`,
    hasPatternInFiles(srcFiles, pattern),
    `src 내에서 ${eventName} 트래킹을 찾지 못했습니다.`
  );
}

const appStateProvider = read(path.join(SRC_DIR, "state", "AppStateProvider.tsx"));
const tossSdk = read(path.join(SRC_DIR, "integrations", "tossSdk.ts"));
const homePage = read(path.join(SRC_DIR, "pages", "HomePage.tsx"));
const paywallPage = read(path.join(SRC_DIR, "pages", "PaywallPage.tsx"));

failed += runCheck(
  "runtime pending restore wired",
  /getIapPendingOrders\(/.test(appStateProvider) && /registerPendingOrder/.test(appStateProvider),
  "runtime pending 주문 동기화 코드가 누락되었습니다."
);

failed += runCheck(
  "runtime refunded sync wired",
  /getIapCompletedOrRefundedOrders\(/.test(appStateProvider) &&
    /registerCompletedOrRefundedOrder/.test(appStateProvider),
  "runtime 환불/완료 이력 동기화 코드가 누락되었습니다."
);

failed += runCheck(
  "refund entitlement revoke wired",
  /revokePurchaseEntitlement\(/.test(appStateProvider),
  "환불 시 권한 회수 코드가 누락되었습니다."
);

failed += runCheck(
  "tossSdk has pending/completed API wrappers",
  /export async function getIapPendingOrders/.test(tossSdk) &&
    /export async function getIapCompletedOrRefundedOrders/.test(tossSdk),
  "tossSdk IAP 래퍼(getPending/getCompletedOrRefunded) 중 일부가 없습니다."
);

failed += runCheck(
  "home has refund banner flow",
  /showRefundRevokedBanner/.test(homePage) && /refund_revoked/.test(homePage),
  "홈 환불 안내 배너 또는 paywall trigger(refund_revoked)가 누락되었습니다."
);

failed += runCheck(
  "paywall trigger parser exists",
  /resolveTrigger/.test(paywallPage),
  "paywall trigger 파싱 코드가 누락되었습니다."
);

if (failed > 0) {
  console.error(`\nIAP static QA failed: ${failed} check(s) failed.`);
  process.exit(1);
}

console.log("\nIAP static QA passed.");
