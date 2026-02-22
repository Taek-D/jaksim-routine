import type { DayOfWeek } from "../domain/models";

const KST_LOCALE = "ko-KR";
const KST_TIME_ZONE = "Asia/Seoul";
const KST_OFFSET_HOURS = 9;
export const WEEKDAY_ORDER: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function getNowIso(): string {
  return new Date().toISOString();
}

export function getKstDateStamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function getKstLongDateLabel(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat(KST_LOCALE, {
    timeZone: KST_TIME_ZONE,
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  return formatter.format(date);
}

export function getKstWeekday(date: Date = new Date()): DayOfWeek {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TIME_ZONE,
    weekday: "short",
  }).format(date);

  const map: Record<string, DayOfWeek> = {
    Mon: "MON",
    Tue: "TUE",
    Wed: "WED",
    Thu: "THU",
    Fri: "FRI",
    Sat: "SAT",
    Sun: "SUN",
  };
  return map[weekday] ?? "MON";
}

export function parseKstDateStamp(dateStamp: string): Date {
  const [year, month, day] = dateStamp.split("-").map(Number);
  const utc = Date.UTC(year, month - 1, day, 0, 0, 0);
  return new Date(utc - KST_OFFSET_HOURS * 60 * 60 * 1000);
}

export function getKstDateStampFromIso(iso: string): string {
  return getKstDateStamp(new Date(iso));
}

export function addDaysToKstDateStamp(dateStamp: string, days: number): string {
  const date = parseKstDateStamp(dateStamp);
  date.setUTCDate(date.getUTCDate() + days);
  return getKstDateStamp(date);
}

export function getKstWeekdayFromDateStamp(dateStamp: string): DayOfWeek {
  return getKstWeekday(parseKstDateStamp(dateStamp));
}

export interface KstWeekRange {
  start: string;
  end: string;
  days: string[];
}

export function getKstWeekRange(date: Date = new Date(), weekOffset = 0): KstWeekRange {
  const baseStamp = getKstDateStamp(date);
  const weekday = getKstWeekday(date);
  const mondayOffset = -WEEKDAY_ORDER.indexOf(weekday) + weekOffset * 7;
  const start = addDaysToKstDateStamp(baseStamp, mondayOffset);
  const days = Array.from({ length: 7 }, (_, index) => addDaysToKstDateStamp(start, index));
  return {
    start,
    end: days[6],
    days,
  };
}

export function getCurrentWeekLabel(date: Date = new Date()): string {
  return getKstWeekLabel(date, 0);
}

export function getKstWeekLabel(date: Date = new Date(), weekOffset = 0): string {
  const week = getKstWeekRange(date, weekOffset);
  const monday = parseKstDateStamp(week.start);
  const sunday = parseKstDateStamp(week.end);

  const monthDay = new Intl.DateTimeFormat(KST_LOCALE, {
    timeZone: KST_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  });
  return `${monthDay.format(monday)} ~ ${monthDay.format(sunday)}`;
}
