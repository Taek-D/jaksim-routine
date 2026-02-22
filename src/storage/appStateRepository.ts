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

function parseState(raw: string | null): AppState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.schemaVersion !== APP_STATE_SCHEMA_VERSION) {
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

