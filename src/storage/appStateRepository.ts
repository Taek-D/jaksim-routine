import {
  APP_STATE_SCHEMA_VERSION,
  type AppState,
} from "../domain/models";
import { browserStorageDriver, type StorageDriver } from "./storageDriver";

const APP_STATE_STORAGE_KEY = "jaksim-routine.app-state.v1";

export function createInitialAppState(): AppState {
  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    onboardingCompleted: false,
    routines: [],
    checkins: [],
    badges: [],
    entitlement: {},
  };
}

function isValidAppState(value: unknown): value is AppState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    obj.schemaVersion === APP_STATE_SCHEMA_VERSION &&
    Array.isArray(obj.routines) &&
    Array.isArray(obj.checkins) &&
    Array.isArray(obj.badges) &&
    typeof obj.entitlement === "object" &&
    obj.entitlement !== null
  );
}

function parseState(raw: string | null): AppState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidAppState(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function loadAppState(
  driver: StorageDriver = browserStorageDriver
): Promise<AppState> {
  const raw = await driver.getItem(APP_STATE_STORAGE_KEY);
  return parseState(raw) ?? createInitialAppState();
}

export async function saveAppState(
  state: AppState,
  driver: StorageDriver = browserStorageDriver
): Promise<void> {
  await driver.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
}

export async function clearAppState(
  driver: StorageDriver = browserStorageDriver
): Promise<void> {
  await driver.removeItem(APP_STATE_STORAGE_KEY);
}

