const SUPPORTED_TARGETS = new Set(["/home", "/report", "/routine/new"]);
const APP_SCHEME_PREFIX = "intoss://jaksim-routine/";
const APP_PATH_PREFIX = "/jaksim-routine/";

function normalizePathCandidate(path: string): string {
  const trimmed = decodeURIComponent(path).trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function toSupportedTarget(path: string): string | null {
  const normalizedPath = normalizePathCandidate(path);
  if (SUPPORTED_TARGETS.has(normalizedPath)) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith(APP_PATH_PREFIX)) {
    const withoutPrefix = `/${normalizedPath.slice(APP_PATH_PREFIX.length)}`;
    if (SUPPORTED_TARGETS.has(withoutPrefix)) {
      return withoutPrefix;
    }
  }

  return null;
}

function toSupportedTargetFromRaw(raw: string): string | null {
  const trimmed = decodeURIComponent(raw).trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(APP_SCHEME_PREFIX)) {
    return toSupportedTarget(trimmed.slice(APP_SCHEME_PREFIX.length));
  }

  return toSupportedTarget(trimmed);
}

export function resolveDeepLinkTargetFromLocation(location: {
  pathname: string;
  search: string;
  hash: string;
}): string | null {
  const search = new URLSearchParams(location.search);
  const searchKeys = ["deeplink", "deepLink", "link", "target"];
  for (const key of searchKeys) {
    const value = search.get(key);
    if (!value) {
      continue;
    }
    const target = toSupportedTargetFromRaw(value);
    if (target) {
      return target;
    }
  }

  if (location.hash) {
    const hashValue = location.hash.slice(1);
    const target = toSupportedTargetFromRaw(hashValue);
    if (target) {
      return target;
    }
  }

  return toSupportedTargetFromRaw(location.pathname);
}

export function resolveNextPathFromSearch(searchValue: string): string | null {
  const search = new URLSearchParams(searchValue);
  const next = search.get("next");
  if (!next) {
    return null;
  }
  return toSupportedTargetFromRaw(next);
}
