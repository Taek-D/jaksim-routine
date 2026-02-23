import type {
  AppState,
  Badge,
  BadgeType,
  Checkin,
  CheckinStatus,
  DayOfWeek,
  Routine,
} from "./models";
import {
  addDaysToKstDateStamp,
  getKstDateStamp,
  getKstDateStampFromIso,
  getKstWeekLabel,
  getKstWeekRange,
  getKstWeekdayFromDateStamp,
} from "../utils/date";

const WEEKDAY_LABEL: Record<DayOfWeek, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

function getRoutineStartDateStamp(routine: Routine): string {
  return getKstDateStampFromIso(routine.restartAt ?? routine.createdAt);
}

function buildRoutineDateStatusMap(checkins: Checkin[]): Map<string, CheckinStatus> {
  const map = new Map<string, CheckinStatus>();
  checkins.forEach((checkin) => {
    map.set(checkin.date, checkin.status);
  });
  return map;
}

function isRoutineTargetDate(routine: Routine, dateStamp: string): boolean {
  const weekday = getKstWeekdayFromDateStamp(dateStamp);
  return routine.daysOfWeek.includes(weekday);
}

export function getRoutineCurrentStreak(
  routine: Routine,
  routineCheckins: Checkin[],
  todayStamp: string = getKstDateStamp(),
  shieldedDates?: Set<string>
): number {
  const startStamp = getRoutineStartDateStamp(routine);
  const statusByDate = buildRoutineDateStatusMap(routineCheckins);
  let cursor = todayStamp;
  let streak = 0;

  for (let guard = 0; guard < 4000 && cursor >= startStamp; guard += 1) {
    if (!isRoutineTargetDate(routine, cursor)) {
      cursor = addDaysToKstDateStamp(cursor, -1);
      continue;
    }

    if (shieldedDates?.has(cursor)) {
      cursor = addDaysToKstDateStamp(cursor, -1);
      continue;
    }

    const status = statusByDate.get(cursor);
    if (status === "COMPLETED") {
      streak += 1;
      cursor = addDaysToKstDateStamp(cursor, -1);
      continue;
    }

    break;
  }

  return streak;
}

interface RoutineWeekSummary {
  routineId: string;
  title: string;
  completed: number;
  target: number;
  completionRate: number;
  streak: number;
}

export interface WeeklyReportSummary {
  weekLabel: string;
  completionRate: number;
  previousCompletionRate: number;
  deltaRate: number;
  bestWeekdayLabel: string;
  comment: string;
  routines: RoutineWeekSummary[];
}

function calculateRoutineWeekSummary(
  routine: Routine,
  allCheckins: Checkin[],
  weekDays: string[]
): RoutineWeekSummary {
  const routineCheckins = allCheckins.filter((checkin) => checkin.routineId === routine.id);
  const statusByDate = buildRoutineDateStatusMap(routineCheckins);
  const startStamp = getRoutineStartDateStamp(routine);

  let target = 0;
  let completed = 0;
  weekDays.forEach((day) => {
    if (day < startStamp || !isRoutineTargetDate(routine, day)) {
      return;
    }
    target += 1;
    if (statusByDate.get(day) === "COMPLETED") {
      completed += 1;
    }
  });

  return {
    routineId: routine.id,
    title: routine.title,
    completed,
    target,
    completionRate: target === 0 ? 0 : Math.round((completed / target) * 100),
    streak: getRoutineCurrentStreak(routine, routineCheckins),
  };
}

function getOverallCompletionRate(routines: RoutineWeekSummary[]): number {
  const totals = routines.reduce(
    (acc, item) => {
      acc.completed += item.completed;
      acc.target += item.target;
      return acc;
    },
    { completed: 0, target: 0 }
  );
  return totals.target === 0 ? 0 : Math.round((totals.completed / totals.target) * 100);
}

function getBestWeekdayLabel(routines: Routine[], checkins: Checkin[], weekDays: string[]): string {
  const weekSet = new Set(weekDays);
  const activeIds = new Set(routines.map((routine) => routine.id));
  const counts: Record<DayOfWeek, number> = {
    MON: 0,
    TUE: 0,
    WED: 0,
    THU: 0,
    FRI: 0,
    SAT: 0,
    SUN: 0,
  };

  checkins.forEach((checkin) => {
    if (!activeIds.has(checkin.routineId)) {
      return;
    }
    if (checkin.status !== "COMPLETED") {
      return;
    }
    if (!weekSet.has(checkin.date)) {
      return;
    }

    const day = getKstWeekdayFromDateStamp(checkin.date);
    counts[day] += 1;
  });

  let bestDay: DayOfWeek | null = null;
  let max = 0;
  (Object.keys(counts) as DayOfWeek[]).forEach((day) => {
    if (counts[day] > max) {
      max = counts[day];
      bestDay = day;
    }
  });

  if (!bestDay || max === 0) {
    return "데이터 없음";
  }
  return WEEKDAY_LABEL[bestDay];
}

function getWeeklyComment(rate: number, deltaRate: number): string {
  let comment = "다시 시작해도 괜찮아요. 다음 주가 있어요 🔄";
  if (rate >= 80) {
    comment = "이번 주 최고예요! 🎉";
  } else if (rate >= 50) {
    comment = "절반 이상 해냈어요 💪";
  }

  if (deltaRate >= 10) {
    comment = `${comment} 지난주보다 ${deltaRate}% 올랐어요 ↑`;
  }

  return comment;
}

export function buildWeeklyReportSummary(state: AppState, weekOffset = 0): WeeklyReportSummary {
  const activeRoutines = state.routines.filter((routine) => !routine.archivedAt);
  const currentWeek = getKstWeekRange(new Date(), weekOffset);
  const previousWeek = getKstWeekRange(new Date(), weekOffset - 1);

  const currentRoutines = activeRoutines.map((routine) =>
    calculateRoutineWeekSummary(routine, state.checkins, currentWeek.days)
  );
  const previousRoutines = activeRoutines.map((routine) =>
    calculateRoutineWeekSummary(routine, state.checkins, previousWeek.days)
  );

  const completionRate = getOverallCompletionRate(currentRoutines);
  const previousCompletionRate = getOverallCompletionRate(previousRoutines);
  const deltaRate = completionRate - previousCompletionRate;

  return {
    weekLabel: getKstWeekLabel(new Date(), weekOffset),
    completionRate,
    previousCompletionRate,
    deltaRate,
    bestWeekdayLabel: getBestWeekdayLabel(activeRoutines, state.checkins, currentWeek.days),
    comment: getWeeklyComment(completionRate, deltaRate),
    routines: currentRoutines,
  };
}

const STREAK_BADGE_CONDITIONS: Array<{ minStreak: number; badgeType: BadgeType }> = [
  { minStreak: 3, badgeType: "STREAK_3" },
  { minStreak: 7, badgeType: "STREAK_7" },
  { minStreak: 14, badgeType: "STREAK_14" },
];

function pushBadgeIfNeeded(
  result: Badge[],
  earned: Set<BadgeType>,
  badgeType: BadgeType,
  earnedAt: string
): void {
  if (earned.has(badgeType)) {
    return;
  }
  earned.add(badgeType);
  result.push({ badgeType, earnedAt });
}

export function collectNewBadgesAfterCheckin(params: {
  prevState: AppState;
  routine: Routine;
  nextCheckins: Checkin[];
  status: CheckinStatus;
  todayStamp: string;
  earnedAt: string;
  shieldedDates?: Set<string>;
}): Badge[] {
  const { prevState, routine, nextCheckins, status, todayStamp, earnedAt, shieldedDates } = params;
  if (status !== "COMPLETED") {
    return [];
  }

  const earned = new Set<BadgeType>(prevState.badges.map((badge) => badge.badgeType));
  const newBadges: Badge[] = [];
  const routineCheckins = nextCheckins.filter((checkin) => checkin.routineId === routine.id);

  if (nextCheckins.some((checkin) => checkin.status === "COMPLETED")) {
    pushBadgeIfNeeded(newBadges, earned, "FIRST_CHECKIN", earnedAt);
  }

  const streak = getRoutineCurrentStreak(routine, routineCheckins, todayStamp, shieldedDates);
  STREAK_BADGE_CONDITIONS.forEach(({ minStreak, badgeType }) => {
    if (streak >= minStreak) {
      pushBadgeIfNeeded(newBadges, earned, badgeType, earnedAt);
    }
  });

  const hadPastCompletion = prevState.checkins.some(
    (checkin) =>
      checkin.routineId === routine.id &&
      checkin.status === "COMPLETED" &&
      checkin.date < todayStamp
  );
  const hadSkippedBefore = prevState.checkins.some(
    (checkin) => checkin.routineId === routine.id && checkin.status === "SKIPPED"
  );
  const restarted = Boolean(routine.restartAt);

  if (hadPastCompletion && (hadSkippedBefore || restarted)) {
    pushBadgeIfNeeded(newBadges, earned, "COMEBACK", earnedAt);
  }

  return newBadges;
}

export function getRoutineRecentCheckins(
  state: AppState,
  routineId: string,
  limit = 14
): Checkin[] {
  return state.checkins
    .filter((checkin) => checkin.routineId === routineId)
    .sort((a, b) => {
      if (a.date === b.date) {
        return a.createdAt < b.createdAt ? 1 : -1;
      }
      return a.date < b.date ? 1 : -1;
    })
    .slice(0, limit);
}

/* ── Premium UX data helpers ── */

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function buildHeatmapData(state: AppState, days = 30): HeatmapCell[] {
  const today = getKstDateStamp();
  const countByDate = new Map<string, number>();

  state.checkins.forEach((checkin) => {
    if (checkin.status === "COMPLETED") {
      countByDate.set(checkin.date, (countByDate.get(checkin.date) ?? 0) + 1);
    }
  });

  const cells: HeatmapCell[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDaysToKstDateStamp(today, -i);
    const count = countByDate.get(date) ?? 0;
    let level: HeatmapCell["level"] = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    cells.push({ date, count, level });
  }

  return cells;
}

export interface WeekTrendPoint {
  weekLabel: string;
  completionRate: number;
}

export function buildMonthlyTrend(state: AppState, weeks = 4): WeekTrendPoint[] {
  const points: WeekTrendPoint[] = [];
  for (let offset = -(weeks - 1); offset <= 0; offset += 1) {
    const report = buildWeeklyReportSummary(state, offset);
    points.push({
      weekLabel: report.weekLabel,
      completionRate: report.completionRate,
    });
  }
  return points;
}

export interface NoteEntry {
  date: string;
  routineTitle: string;
  note: string;
}

export function getRecentNotes(state: AppState, limit = 20): NoteEntry[] {
  const routineMap = new Map<string, string>();
  state.routines.forEach((routine) => {
    routineMap.set(routine.id, routine.title);
  });

  return state.checkins
    .filter((checkin): checkin is Checkin & { note: string } => Boolean(checkin.note))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
    .map((checkin) => ({
      date: checkin.date,
      routineTitle: routineMap.get(checkin.routineId) ?? "삭제된 루틴",
      note: checkin.note,
    }));
}
