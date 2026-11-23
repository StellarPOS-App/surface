/**
 * Fixed, user-facing error strings.
 *
 * Never derive these from an API response: the server's `error`/`details`
 * fields are untrusted and may contain attacker-controlled markup or text.
 * The UI only ever renders strings from this module.
 */

export type ErrorContext =
  | 'default'
  | 'auth'
  | 'register'
  | 'twoFactor'
  | 'receipt'
  | 'validation';

export const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function staticErrorMessage(status: number, context: ErrorContext = 'default'): string {
  if (status === 0) return 'Cannot reach the server. Check your connection and try again.';

  switch (status) {
    case 400:
    case 422:
      return context === 'validation'
        ? 'Check this field and try again.'
        : 'Check the information you entered and try again.';
    case 401:
      if (context === 'auth') return 'The email or password is incorrect.';
      if (context === 'register') return 'We could not create that account with these details.';
      if (context === 'twoFactor') return 'That code is not valid. Try again.';
      return 'Your session has expired. Sign in again.';
    case 403:
      return context === 'receipt'
        ? 'You are not allowed to view this receipt.'
        : 'You do not have permission to do that.';
    case 404:
      return context === 'receipt'
        ? 'This receipt could not be found.'
        : 'We could not find what you were looking for.';
    case 409:
      return 'That conflicts with a recent change. Try again.';
    case 429:
      return 'Too many attempts. Wait a moment and try again.';
    default:
      if (status >= 500) return 'The server had a problem. Try again shortly.';
      return GENERIC_ERROR;
  }
}
