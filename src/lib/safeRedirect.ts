/** The screen opened after sign-in when no usable destination was supplied. */
export const DEFAULT_REDIRECT = '/pos';

/**
 * Resolve a post-authentication redirect target.
 *
 * Only same-origin, root-relative paths are accepted. Query strings and
 * fragments are preserved so a deep link keeps its state, but absolute URLs,
 * protocol-relative URLs (`//evil.example`) and browser-normalised backslash
 * tricks (`/\evil.example`) all fall back to the default screen.
 */
export function safeRedirectPath(target: unknown, fallback = DEFAULT_REDIRECT): string {
  if (typeof target !== 'string') return fallback;
  const value = target.trim();
  if (!value.startsWith('/')) return fallback;

  // Browsers normalise backslashes to slashes (`/\evil.example` is parsed as
  // `//evil.example`), and control characters can smuggle a scheme past naive
  // checks. Reject both outright.
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code === 0x5c || code < 0x20 || code === 0x7f) return fallback;
  }

  const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  let url: URL;
  try {
    url = new URL(value, origin);
  } catch {
    return fallback;
  }
  if (url.origin !== origin) return fallback;

  return `${url.pathname}${url.search}${url.hash}` || fallback;
}
