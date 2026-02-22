import type { DayOfWeek } from "./models";

export interface RoutineTemplate {
  key: string;
  title: string;
  daysOfWeek: DayOfWeek[];
}

const weekdaySet: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI"];

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  { key: "exercise", title: "운동 30분", daysOfWeek: weekdaySet },
  { key: "study", title: "공부 45분", daysOfWeek: weekdaySet },
  { key: "saving", title: "절약 기록", daysOfWeek: weekdaySet },
  { key: "cleaning", title: "정리 15분", daysOfWeek: weekdaySet },
  { key: "reading", title: "독서 10페이지", daysOfWeek: weekdaySet },
];
