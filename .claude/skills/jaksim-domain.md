---
name: jaksim-domain
description: 루틴, 체크인, 배지, 리포트 도메인 로직 관련 작업 시 적용. Use when working with routine, checkin, badge, streak, report, progress, domain logic.
---

# Domain Logic

## 개요
작심루틴은 일일 루틴 트래킹 앱이다. 루틴 생성 → 매일 체크인 → 연속 달성(스트릭) → 배지 획득 → 주간 리포트의 흐름을 따른다.

## 핵심 파일
- `src/domain/models.ts` - 타입 정의 (Routine, Checkin, Badge, AppState)
- `src/domain/progress.ts` - 스트릭 계산, 배지 부여, 주간 리포트
- `src/state/selectors.ts` - 오늘의 루틴/체크인 상태 조회
- `src/utils/date.ts` - KST 날짜 유틸리티

## 핵심 모델

### Routine
```typescript
type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

// 필수: id, title, daysOfWeek, goalPerDay, createdAt
// 선택: restartAt (리셋 시점), archivedAt (보관 처리)
```

### Checkin
```typescript
type CheckinStatus = "COMPLETED" | "SKIPPED";

// 필수: id, routineId, date (KST YYYY-MM-DD), status, createdAt
// 선택: note (메모)
// 같은 날 중복 체크인 시 기존 것을 교체
```

### Badge
```typescript
type BadgeType = "FIRST_CHECKIN" | "STREAK_3" | "STREAK_7" | "STREAK_14" | "COMEBACK";
// 한 번 획득하면 중복 부여 안 됨 (Set으로 관리)
```

## 핵심 규칙

### 무료 제한
- `FREE_ROUTINE_LIMIT = 3` (활성 루틴 최대 3개)
- 프리미엄 시 무제한
- 프리미엄 만료 시 오래된 루틴부터 archive

### 스트릭 계산 (`getRoutineCurrentStreak`)
1. 오늘부터 과거로 거슬러 올라감
2. 해당 루틴의 대상 요일이 아닌 날은 건너뜀
3. `COMPLETED` 상태면 streak +1, 아니면 종료
4. `restartAt` 이후부터만 계산 (재시작 기능)
5. 최대 4000일 탐색 (guard)

### 배지 부여 (`collectNewBadgesAfterCheckin`)
- `FIRST_CHECKIN` - 첫 번째 COMPLETED 체크인
- `STREAK_3` / `STREAK_7` / `STREAK_14` - 연속 달성
- `COMEBACK` - 과거에 COMPLETED한 적 있고, SKIPPED 또는 restart 이력이 있을 때

### 주간 리포트 (`buildWeeklyReportSummary`)
- 이번 주 vs 지난 주 완수율 비교
- 루틴별 달성 수 / 목표 수 / 달성률 / 스트릭
- 가장 많이 체크인한 요일 표시
- 격려 코멘트 자동 생성 (80%+ / 50%+ / 그 외)

### Archive 정책 (`applyRoutineArchivePolicy`)
- 프리미엄 활성: 모든 archive 해제
- 프리미엄 비활성: 활성 루틴이 FREE_ROUTINE_LIMIT 초과 시 오래된 순 archive

## 날짜 처리 (중요)
- 모든 날짜 비교는 **KST (Asia/Seoul)** 기준
- `getKstDateStamp()` → `"YYYY-MM-DD"` 형식의 KST 날짜
- `getKstWeekday()` → 현재 KST 요일
- `parseKstDateStamp()` → Date 객체로 변환 (UTC - 9시간 보정)
- ISO 문자열과 KST date stamp을 혼용하지 말 것

## 자주 사용하는 명령어
- `pnpm typecheck` - 도메인 타입 변경 후 전체 타입체크
- `pnpm lint` - 코드 품질 확인
