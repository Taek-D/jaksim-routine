const DEFAULT_SUPPORT_EMAIL = "atef21422@gmail.com";
const DEFAULT_TERMS_URL = "https://example.com/terms";
const DEFAULT_PRIVACY_URL = "https://example.com/privacy";

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function encodeMailSubject(subject: string): string {
  return encodeURIComponent(subject);
}

export const appConfig = {
  supportEmail:
    sanitizeString(import.meta.env.VITE_SUPPORT_EMAIL) ?? DEFAULT_SUPPORT_EMAIL,
  termsUrl:
    sanitizeString(import.meta.env.VITE_TERMS_URL) ?? DEFAULT_TERMS_URL,
  privacyUrl:
    sanitizeString(import.meta.env.VITE_PRIVACY_URL) ?? DEFAULT_PRIVACY_URL,
};

export function buildSupportMailto(subject: string): string {
  return `mailto:${appConfig.supportEmail}?subject=${encodeMailSubject(subject)}`;
}
