export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type CheckinStatus = "COMPLETED" | "SKIPPED";

export type BadgeType =
  | "FIRST_CHECKIN"
  | "STREAK_3"
  | "STREAK_7"
  | "STREAK_14"
  | "COMEBACK";

export interface Routine {
  id: string;
  title: string;
  daysOfWeek: DayOfWeek[];
  goalPerDay: number;
  createdAt: string;
  restartAt?: string;
  archivedAt?: string;
}

export interface Checkin {
  id: string;
  routineId: string;
  date: string;
  status: CheckinStatus;
  note?: string;
  createdAt: string;
}

export interface Badge {
  badgeType: BadgeType;
  earnedAt: string;
}

export interface Entitlement {
  premiumUntil?: string;
  trialUsedLocal?: boolean;
  trialExpiredBannerShown?: boolean;
  refundNoticeShown?: boolean;
  lastRefundedOrderId?: string;
  lastRefundedAt?: string;
  lastKnownUserKeyHash?: string;
  lastOrderId?: string;
  lastSku?: string;
}

export interface AppState {
  schemaVersion: number;
  onboardingCompleted: boolean;
  routines: Routine[];
  checkins: Checkin[];
  badges: Badge[];
  entitlement: Entitlement;
}

export const APP_STATE_SCHEMA_VERSION = 1;
export const FREE_ROUTINE_LIMIT = 3;
