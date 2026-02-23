import type { AppState, CheckinStatus, Routine, Checkin } from "../domain/models";
import { getRoutineCurrentStreak } from "../domain/progress";
import {
  addDaysToKstDateStamp,
  getKstDateStamp,
  getKstWeekday,
  getKstWeekdayFromDateStamp,
} from "../utils/date";

export function getShieldedDatesForRoutine(state: AppState, routineId: string): Set<string> {
  const shields = state.entitlement.streakShields;
  if (!shields) {
    return new Set();
  }
  return new Set(
    shields.filter((s) => s.routineId === routineId).map((s) => s.date)
  );
}

export function getTodayCheckin(state: AppState, routineId: string): Checkin | undefined {
  const today = getKstDateStamp();
  return state.checkins.find((checkin) => checkin.routineId === routineId && checkin.date === today);
}

export function getTodayRoutineStatus(state: AppState, routineId: string): CheckinStatus | null {
  return getTodayCheckin(state, routineId)?.status ?? null;
}

export function getTodayTargetRoutines(state: AppState): Routine[] {
  const today = getKstWeekday();
  return state.routines.filter((routine) => !routine.archivedAt && routine.daysOfWeek.includes(today));
}

export function getRoutineStreak(state: AppState, routineId: string): number {
  const routine = state.routines.find((item) => item.id === routineId);
  if (!routine) {
    return 0;
  }
  const routineCheckins = state.checkins.filter((checkin) => checkin.routineId === routineId);
  const shieldedDates = getShieldedDatesForRoutine(state, routineId);
  return getRoutineCurrentStreak(routine, routineCheckins, undefined, shieldedDates);
}

/**
 * Detects if a routine has a shieldable break within the last 2 days.
 * Returns the missed date and the streak that would be restored, or null.
 */
export function detectShieldableBreak(
  state: AppState,
  routine: Routine
): { missedDate: string; restoredStreak: number } | null {
  const today = getKstDateStamp();
  const routineCheckins = state.checkins.filter((c) => c.routineId === routine.id);
  const checkinDates = new Set(
    routineCheckins.filter((c) => c.status === "COMPLETED").map((c) => c.date)
  );
  const shieldedDates = getShieldedDatesForRoutine(state, routine.id);

  // Check yesterday and the day before for a missed target date
  for (let daysAgo = 1; daysAgo <= 2; daysAgo += 1) {
    const candidate = addDaysToKstDateStamp(today, -daysAgo);
    const weekday = getKstWeekdayFromDateStamp(candidate);

    // Must be a target day for this routine
    if (!routine.daysOfWeek.includes(weekday)) {
      continue;
    }
    // Already checked in — no break
    if (checkinDates.has(candidate)) {
      continue;
    }
    // Already shielded
    if (shieldedDates.has(candidate)) {
      continue;
    }

    // Simulate: if we shield this date, what streak would the user have?
    const simulatedShields = new Set(shieldedDates);
    simulatedShields.add(candidate);
    const restoredStreak = getRoutineCurrentStreak(
      routine,
      routineCheckins,
      today,
      simulatedShields
    );

    // Only worth shielding if it actually preserves a streak > 0
    if (restoredStreak > 0) {
      return { missedDate: candidate, restoredStreak };
    }
  }

  return null;
}

