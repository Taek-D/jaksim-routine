import type { AppState, CheckinStatus, Routine } from "../domain/models";
import { getRoutineCurrentStreak } from "../domain/progress";
import { getKstDateStamp, getKstWeekday } from "../utils/date";

export function getTodayRoutineStatus(state: AppState, routineId: string): CheckinStatus | null {
  const today = getKstDateStamp();
  const item = state.checkins.find((checkin) => checkin.routineId === routineId && checkin.date === today);
  return item?.status ?? null;
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
  return getRoutineCurrentStreak(routine, routineCheckins);
}

