/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  FREE_ROUTINE_LIMIT,
  STREAK_SHIELD_MONTHLY_LIMIT,
  type AppState,
  type Badge,
  type CheckinStatus,
  type DayOfWeek,
  type Routine,
  type StreakShieldEntry,
} from "../domain/models";
import { collectNewBadgesAfterCheckin } from "../domain/progress";
import { getShieldedDatesForRoutine } from "./selectors";
import { makeId } from "../utils/id";
import { getKstDateStamp, getNowIso } from "../utils/date";
import {
  clearAppState,
  createInitialAppState,
  loadAppState,
  saveAppState,
} from "../storage/appStateRepository";
import { entitlementBackend } from "../backend";
import { trackEvent } from "../analytics/analytics";
import {
  completeIapProductGrant,
  createIapOrder,
  getIapCompletedOrRefundedOrders,
  getIapPendingOrders,
  getLoginUserKeyHash,
} from "../integrations/tossSdk";

interface CreateRoutineInput {
  title: string;
  daysOfWeek: DayOfWeek[];
  goalPerDay?: number;
}

interface UpdateRoutineInput {
  title: string;
  daysOfWeek: DayOfWeek[];
  goalPerDay: number;
}

interface AppStateContextValue {
  state: AppState;
  hydrated: boolean;
  activeRoutines: Routine[];
  isPremiumActive: boolean;
  showTrialExpiredBanner: boolean;
  showRefundRevokedBanner: boolean;
  badgeNotice: Badge | null;
  completeOnboarding: () => void;
  createRoutine: (input: CreateRoutineInput) => { ok: boolean; reason?: "LIMIT_REACHED" };
  updateRoutine: (routineId: string, input: UpdateRoutineInput) => void;
  deleteRoutine: (routineId: string) => void;
  checkinRoutine: (
    routineId: string,
    status: CheckinStatus,
    note?: string
  ) => void;
  addNoteToCheckin: (routineId: string, note: string) => void;
  restartRoutine: (routineId: string) => void;
  startFreeTrial: () => Promise<{ ok: boolean; reason?: "ALREADY_USED" }>;
  purchasePremium: (
    sku: string
  ) => Promise<{ ok: boolean; orderId?: string; sku?: string; errorCode?: string }>;
  restorePurchases: () => Promise<{ restoredCount: number }>;
  applyStreakShield: (routineId: string, date: string) => boolean;
  getStreakShieldsRemaining: () => number;
  dismissTrialExpiredBanner: () => void;
  dismissRefundRevokedBanner: () => void;
  dismissBadgeNotice: () => void;
  resetAllData: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);
const DEFAULT_USER_KEY_HASH = "local-user";

function isPremiumEntitlementActive(premiumUntil?: string): boolean {
  if (!premiumUntil) {
    return false;
  }
  return new Date(premiumUntil).getTime() > Date.now();
}

function getPremiumDaysBySku(sku: string): number {
  if (sku === "premium_yearly") {
    return 365;
  }
  return 30;
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function shouldShowTrialExpiredBanner(state: AppState): boolean {
  if (!state.entitlement.trialUsedLocal) {
    return false;
  }
  if (state.entitlement.trialExpiredBannerShown) {
    return false;
  }
  if (state.entitlement.lastSku && state.entitlement.lastSku !== "trial") {
    return false;
  }
  if (!state.entitlement.premiumUntil) {
    return false;
  }
  return new Date(state.entitlement.premiumUntil).getTime() <= Date.now();
}

function shouldShowRefundRevokedBanner(state: AppState): boolean {
  if (!state.entitlement.lastRefundedOrderId) {
    return false;
  }
  if (state.entitlement.refundNoticeShown) {
    return false;
  }
  return true;
}

function applyRoutineArchivePolicy(state: AppState): AppState {
  const premiumActive = isPremiumEntitlementActive(state.entitlement.premiumUntil);
  if (premiumActive) {
    if (!state.routines.some((routine) => routine.archivedAt)) {
      return state;
    }
    return {
      ...state,
      routines: state.routines.map((routine) =>
        routine.archivedAt ? { ...routine, archivedAt: undefined } : routine
      ),
    };
  }

  const activeRoutines = state.routines.filter((routine) => !routine.archivedAt);
  if (activeRoutines.length <= FREE_ROUTINE_LIMIT) {
    return state;
  }

  const keepIds = new Set(
    [...activeRoutines]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, FREE_ROUTINE_LIMIT)
      .map((routine) => routine.id)
  );
  const archivedAt = getNowIso();
  let changed = false;

  const nextRoutines = state.routines.map((routine) => {
    if (routine.archivedAt) {
      return routine;
    }
    if (keepIds.has(routine.id)) {
      return routine;
    }
    changed = true;
    return { ...routine, archivedAt };
  });

  if (!changed) {
    return state;
  }

  return {
    ...state,
    routines: nextRoutines,
  };
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AppState>(createInitialAppState());
  const [hydrated, setHydrated] = useState(false);
  const [badgeNoticeQueue, setBadgeNoticeQueue] = useState<Badge[]>([]);
  const badgeWatcherReadyRef = useRef(false);
  const knownBadgeCountRef = useRef(0);
  const entitlementRestoreDoneRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const resolveUserKeyHash = useCallback(
    (targetState: AppState = state) =>
      targetState.entitlement.lastKnownUserKeyHash ?? DEFAULT_USER_KEY_HASH,
    [state]
  );

  const ensureUserKeyHash = useCallback(async (): Promise<string> => {
    const bridgeUserKeyHash = await getLoginUserKeyHash();
    if (!bridgeUserKeyHash) {
      return resolveUserKeyHash();
    }

    setState((prev) => {
      if (prev.entitlement.lastKnownUserKeyHash === bridgeUserKeyHash) {
        return prev;
      }
      return {
        ...prev,
        entitlement: {
          ...prev.entitlement,
          lastKnownUserKeyHash: bridgeUserKeyHash,
        },
      };
    });

    return bridgeUserKeyHash;
  }, [resolveUserKeyHash]);

  const syncEntitlementSnapshot = useCallback(async (userKeyHash: string) => {
    const gate = await entitlementBackend.getTrialGate(userKeyHash);
    const entitlement = await entitlementBackend.getPurchaseEntitlement(userKeyHash);
    setState((prev) => ({
      ...prev,
      entitlement: {
        ...prev.entitlement,
        premiumUntil: entitlement.premiumUntil,
        trialUsedLocal: prev.entitlement.trialUsedLocal || gate.trialUsed,
        lastOrderId: entitlement.lastOrderId,
        lastSku: entitlement.lastSku,
        lastKnownUserKeyHash: userKeyHash,
      },
    }));
  }, []);

  const restorePurchasesInternal = useCallback(
    async (userKeyHash: string): Promise<number> => {
      const runtimePendingOrders = await getIapPendingOrders();
      for (const runtimeOrder of runtimePendingOrders) {
        await entitlementBackend.registerPendingOrder(userKeyHash, runtimeOrder);
      }
      const runtimeOrderHistory = await getIapCompletedOrRefundedOrders();
      for (const historyItem of runtimeOrderHistory) {
        await entitlementBackend.registerCompletedOrRefundedOrder(userKeyHash, historyItem);
      }

      const pendingOrders = await entitlementBackend.getPendingOrders(userKeyHash);
      const runtimePendingOrderIdSet = new Set(
        runtimePendingOrders.map((order) => order.orderId)
      );
      let restoredCount = 0;
      for (const order of pendingOrders) {
        const grant = await entitlementBackend.processProductGrant(
          userKeyHash,
          order.orderId,
          order.sku
        );
        if (!grant.granted) {
          continue;
        }
        const complete = await entitlementBackend.completeProductGrant(userKeyHash, order.orderId);
        if (complete.completed) {
          if (runtimePendingOrderIdSet.has(order.orderId)) {
            void completeIapProductGrant(order.orderId);
          }
          restoredCount += 1;
        }
      }
      let revokedOrderId: string | undefined;
      let revokedOrderSku: string | undefined;
      let revokedAt: string | undefined;

      const orderHistory = await entitlementBackend.getCompletedOrRefundedOrders(userKeyHash);
      const refundedOrders = orderHistory
        .filter((item) => item.status === "REFUNDED")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

      if (refundedOrders.length > 0) {
        const entitlement = await entitlementBackend.getPurchaseEntitlement(userKeyHash);
        const refundedByOrderId = new Map(
          refundedOrders.map((item) => [item.orderId, item] as const)
        );
        const latestRefundedOrder = refundedOrders[0];
        const refundedCurrentOrder = entitlement.lastOrderId
          ? refundedByOrderId.get(entitlement.lastOrderId)
          : undefined;
        const hasLegacyPremiumWithoutOrderId =
          !entitlement.lastOrderId &&
          Boolean(entitlement.premiumUntil) &&
          entitlement.lastSku !== undefined &&
          entitlement.lastSku !== "trial";

        if (refundedCurrentOrder || hasLegacyPremiumWithoutOrderId) {
          const targetOrder = refundedCurrentOrder ?? latestRefundedOrder;
          await entitlementBackend.revokePurchaseEntitlement(userKeyHash);
          revokedOrderId = targetOrder.orderId;
          revokedOrderSku = targetOrder.sku;
          revokedAt = targetOrder.updatedAt;
        }
      }

      await syncEntitlementSnapshot(userKeyHash);
      if (revokedOrderId) {
        trackEvent("iap_refund_revoke", {
          orderId: revokedOrderId,
          sku: revokedOrderSku,
        });
        setState((prev) => ({
          ...prev,
          entitlement: {
            ...prev.entitlement,
            premiumUntil: undefined,
            lastOrderId: undefined,
            lastSku: undefined,
            lastRefundedOrderId: revokedOrderId,
            lastRefundedAt: revokedAt ?? getNowIso(),
            refundNoticeShown: false,
          },
        }));
      }
      return restoredCount;
    },
    [syncEntitlementSnapshot]
  );

  useEffect(() => {
    let cancelled = false;
    loadAppState().then((loaded) => {
      if (cancelled) {
        return;
      }
      setState(loaded);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void saveAppState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setState((prev) => applyRoutineArchivePolicy(prev));
  }, [hydrated, state.entitlement.premiumUntil]);

  useEffect(() => {
    if (!hydrated || entitlementRestoreDoneRef.current) {
      return;
    }

    entitlementRestoreDoneRef.current = true;
    let cancelled = false;

    const restoreEntitlement = async () => {
      const userKeyHash = await ensureUserKeyHash();
      await restorePurchasesInternal(userKeyHash);
      if (cancelled) {
        return;
      }
    };

    void restoreEntitlement();

    return () => {
      cancelled = true;
    };
  }, [ensureUserKeyHash, hydrated, restorePurchasesInternal]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!badgeWatcherReadyRef.current) {
      badgeWatcherReadyRef.current = true;
      knownBadgeCountRef.current = state.badges.length;
      return;
    }

    if (state.badges.length > knownBadgeCountRef.current) {
      const newBadges = state.badges.slice(knownBadgeCountRef.current);
      setBadgeNoticeQueue((prev) => [...prev, ...newBadges]);
    } else if (state.badges.length < knownBadgeCountRef.current) {
      setBadgeNoticeQueue([]);
    }

    knownBadgeCountRef.current = state.badges.length;
  }, [hydrated, state.badges]);

  const isPremiumActive = useMemo(() => {
    return isPremiumEntitlementActive(state.entitlement.premiumUntil);
  }, [state.entitlement.premiumUntil]);

  const activeRoutines = useMemo(
    () => state.routines.filter((routine) => !routine.archivedAt),
    [state.routines]
  );
  const showTrialExpiredBanner = shouldShowTrialExpiredBanner(state);
  const showRefundRevokedBanner = shouldShowRefundRevokedBanner(state);
  const badgeNotice = badgeNoticeQueue[0] ?? null;

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const createRoutine = useCallback(
    (input: CreateRoutineInput) => {
      const currentRoutines = stateRef.current.routines;
      const activeCount = currentRoutines.filter((routine) => !routine.archivedAt).length;
      if (!isPremiumActive && activeCount >= FREE_ROUTINE_LIMIT) {
        return { ok: false as const, reason: "LIMIT_REACHED" as const };
      }

      const newRoutine: Routine = {
        id: makeId("routine"),
        title: input.title.trim(),
        daysOfWeek: input.daysOfWeek,
        goalPerDay: input.goalPerDay ?? 1,
        createdAt: getNowIso(),
      };

      setState((prev) => {
        const prevActiveCount = prev.routines.filter((r) => !r.archivedAt).length;
        if (!isPremiumActive && prevActiveCount >= FREE_ROUTINE_LIMIT) {
          return prev;
        }
        return { ...prev, routines: [...prev.routines, newRoutine] };
      });
      return { ok: true as const };
    },
    [isPremiumActive]
  );

  const updateRoutine = useCallback((routineId: string, input: UpdateRoutineInput) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.map((routine) =>
        routine.id === routineId
          ? {
              ...routine,
              title: input.title.trim(),
              daysOfWeek: input.daysOfWeek,
              goalPerDay: input.goalPerDay,
            }
          : routine
      ),
    }));
  }, []);

  const deleteRoutine = useCallback((routineId: string) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.filter((routine) => routine.id !== routineId),
      checkins: prev.checkins.filter((checkin) => checkin.routineId !== routineId),
    }));
  }, []);

  const checkinRoutine = useCallback((routineId: string, status: CheckinStatus, note?: string) => {
    const date = getKstDateStamp();
    const createdAt = getNowIso();
    const earnedBadgeTypes = new Set<Badge["badgeType"]>();

    setState((prev) => {
      const routine = prev.routines.find((item) => item.id === routineId);
      const withoutToday = prev.checkins.filter(
        (item) => !(item.routineId === routineId && item.date === date)
      );
      const nextCheckins = [
        ...withoutToday,
        {
          id: makeId("checkin"),
          routineId,
          date,
          status,
          note: note?.trim() || undefined,
          createdAt,
        },
      ];
      const shieldedDates = routine
        ? getShieldedDatesForRoutine(prev, routine.id)
        : undefined;
      const newBadges =
        routine == null
          ? []
          : collectNewBadgesAfterCheckin({
              prevState: prev,
              routine,
              nextCheckins,
              status,
              todayStamp: date,
              earnedAt: createdAt,
              shieldedDates,
            });

      newBadges.forEach((badge) => earnedBadgeTypes.add(badge.badgeType));

      return {
        ...prev,
        checkins: nextCheckins,
        badges: [...prev.badges, ...newBadges],
      };
    });

    [...earnedBadgeTypes].forEach((badgeType) => {
      trackEvent("badge_earned", { badgeType });
      if (badgeType === "STREAK_3") {
        trackEvent("streak_milestone", { routineId, days: 3 });
      } else if (badgeType === "STREAK_7") {
        trackEvent("streak_milestone", { routineId, days: 7 });
      } else if (badgeType === "STREAK_14") {
        trackEvent("streak_milestone", { routineId, days: 14 });
      }
    });
  }, []);

  const addNoteToCheckin = useCallback((routineId: string, note: string) => {
    const date = getKstDateStamp();
    setState((prev) => ({
      ...prev,
      checkins: prev.checkins.map((checkin) =>
        checkin.routineId === routineId && checkin.date === date
          ? { ...checkin, note: note.trim() || undefined }
          : checkin
      ),
    }));
  }, []);

  const restartRoutine = useCallback((routineId: string) => {
    setState((prev) => ({
      ...prev,
      routines: prev.routines.map((routine) =>
        routine.id === routineId
          ? {
              ...routine,
              restartAt: getNowIso(),
            }
          : routine
      ),
    }));
  }, []);

  const getStreakShieldsUsedThisMonth = useCallback(
    (shields?: StreakShieldEntry[]): number => {
      const entries = shields ?? state.entitlement.streakShields ?? [];
      const now = getKstDateStamp();
      const currentMonth = now.slice(0, 7); // "YYYY-MM"
      return entries.filter((s) => {
        const usedMonth = getKstDateStamp(new Date(s.usedAt)).slice(0, 7);
        return usedMonth === currentMonth;
      }).length;
    },
    [state.entitlement.streakShields]
  );

  const getStreakShieldsRemaining = useCallback((): number => {
    return STREAK_SHIELD_MONTHLY_LIMIT - getStreakShieldsUsedThisMonth();
  }, [getStreakShieldsUsedThisMonth]);

  const applyStreakShield = useCallback(
    (routineId: string, date: string): boolean => {
      const currentShields = stateRef.current.entitlement.streakShields ?? [];
      if (currentShields.some((s) => s.routineId === routineId && s.date === date)) {
        return false;
      }
      const usedThisMonth = getStreakShieldsUsedThisMonth(currentShields);
      if (usedThisMonth >= STREAK_SHIELD_MONTHLY_LIMIT) {
        return false;
      }

      const entry: StreakShieldEntry = {
        routineId,
        date,
        usedAt: getNowIso(),
      };

      setState((prev) => {
        const prevShields = prev.entitlement.streakShields ?? [];
        if (prevShields.some((s) => s.routineId === routineId && s.date === date)) {
          return prev;
        }
        const prevUsedThisMonth = getStreakShieldsUsedThisMonth(prevShields);
        if (prevUsedThisMonth >= STREAK_SHIELD_MONTHLY_LIMIT) {
          return prev;
        }
        return {
          ...prev,
          entitlement: {
            ...prev.entitlement,
            streakShields: [...prevShields, entry],
          },
        };
      });

      trackEvent("streak_shield_used", { routineId, date });
      return true;
    },
    [getStreakShieldsUsedThisMonth]
  );

  const startFreeTrial = useCallback(async () => {
    const userKeyHash = await ensureUserKeyHash();
    const gate = await entitlementBackend.getTrialGate(userKeyHash);
    if (gate.trialUsed || stateRef.current.entitlement.trialUsedLocal) {
      return { ok: false as const, reason: "ALREADY_USED" as const };
    }

    const trial = await entitlementBackend.startTrial(userKeyHash);
    setState((prev) => ({
      ...prev,
      entitlement: {
        ...prev.entitlement,
        trialUsedLocal: true,
        premiumUntil: trial.trialExpiresAt,
        trialExpiredBannerShown: false,
        refundNoticeShown: true,
        lastRefundedOrderId: undefined,
        lastRefundedAt: undefined,
        lastSku: "trial",
        lastOrderId: undefined,
        lastKnownUserKeyHash: userKeyHash,
      },
    }));

    return { ok: true as const };
  }, [ensureUserKeyHash]);

  const purchasePremium = useCallback(async (sku: string) => {
    const userKeyHash = await ensureUserKeyHash();
    const runtimeOrder = await createIapOrder(sku);
    if (runtimeOrder) {
      await entitlementBackend.registerPendingOrder(userKeyHash, runtimeOrder);
    }
    let order =
      runtimeOrder ?? (await entitlementBackend.createOneTimePurchaseOrder(userKeyHash, sku));
    let grant = await entitlementBackend.processProductGrant(
      userKeyHash,
      order.orderId,
      order.sku
    );
    if (!grant.granted) {
      order = await entitlementBackend.createOneTimePurchaseOrder(userKeyHash, sku);
      grant = await entitlementBackend.processProductGrant(
        userKeyHash,
        order.orderId,
        order.sku
      );
    }
    if (!grant.granted) {
      return {
        ok: false as const,
        orderId: order.orderId,
        sku: order.sku,
        errorCode: "GRANT_REJECTED",
      };
    }
    const complete = await entitlementBackend.completeProductGrant(userKeyHash, order.orderId);
    if (!complete.completed) {
      return {
        ok: false as const,
        orderId: order.orderId,
        sku: order.sku,
        errorCode: "COMPLETE_FAILED",
      };
    }
    if (runtimeOrder) {
      void completeIapProductGrant(runtimeOrder.orderId);
    }
    const entitlement = await entitlementBackend.getPurchaseEntitlement(userKeyHash);

    setState((prev) => ({
      ...prev,
      entitlement: {
        ...prev.entitlement,
        premiumUntil: entitlement.premiumUntil ?? addDaysIso(getPremiumDaysBySku(sku)),
        lastOrderId: entitlement.lastOrderId ?? order.orderId,
        lastSku: entitlement.lastSku ?? sku,
        refundNoticeShown: true,
        lastRefundedOrderId: undefined,
        lastRefundedAt: undefined,
        lastKnownUserKeyHash: userKeyHash,
      },
    }));

    return { ok: true as const, orderId: order.orderId, sku: order.sku };
  }, [ensureUserKeyHash]);

  const restorePurchases = useCallback(async () => {
    const userKeyHash = await ensureUserKeyHash();
    trackEvent("iap_restore_start");
    const restoredCount = await restorePurchasesInternal(userKeyHash);
    trackEvent("iap_restore_done", { restoredCount });
    return { restoredCount };
  }, [ensureUserKeyHash, restorePurchasesInternal]);

  const dismissTrialExpiredBanner = useCallback(() => {
    setState((prev) => ({
      ...prev,
      entitlement: {
        ...prev.entitlement,
        trialExpiredBannerShown: true,
      },
    }));
  }, []);

  const dismissRefundRevokedBanner = useCallback(() => {
    setState((prev) => ({
      ...prev,
      entitlement: {
        ...prev.entitlement,
        refundNoticeShown: true,
      },
    }));
  }, []);

  const dismissBadgeNotice = useCallback(() => {
    setBadgeNoticeQueue((prev) => prev.slice(1));
  }, []);

  const resetAllData = useCallback(async () => {
    await clearAppState();
    setState((prev) => ({
      ...createInitialAppState(),
      entitlement: prev.entitlement,
    }));
    setBadgeNoticeQueue([]);
    knownBadgeCountRef.current = 0;
    badgeWatcherReadyRef.current = true;
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      hydrated,
      activeRoutines,
      isPremiumActive,
      showTrialExpiredBanner,
      showRefundRevokedBanner,
      badgeNotice,
      completeOnboarding,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      checkinRoutine,
      addNoteToCheckin,
      restartRoutine,
      applyStreakShield,
      getStreakShieldsRemaining,
      startFreeTrial,
      purchasePremium,
      restorePurchases,
      dismissTrialExpiredBanner,
      dismissRefundRevokedBanner,
      dismissBadgeNotice,
      resetAllData,
    }),
    [
      state,
      hydrated,
      activeRoutines,
      isPremiumActive,
      showTrialExpiredBanner,
      showRefundRevokedBanner,
      badgeNotice,
      completeOnboarding,
      createRoutine,
      updateRoutine,
      deleteRoutine,
      checkinRoutine,
      addNoteToCheckin,
      restartRoutine,
      applyStreakShield,
      getStreakShieldsRemaining,
      startFreeTrial,
      purchasePremium,
      restorePurchases,
      dismissTrialExpiredBanner,
      dismissRefundRevokedBanner,
      dismissBadgeNotice,
      resetAllData,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
