import { useAuthStore } from '@/stores/authStore';
import { staticErrorMessage } from './errorMessages';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Keep validation field names, but replace untrusted server messages. */
function safeDetails(raw: unknown): { field: string; message: string }[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .map((entry) => ({
      field:
        typeof entry.field === 'string' && /^[a-zA-Z0-9_.-]{1,64}$/.test(entry.field)
          ? entry.field
          : 'field',
      message: staticErrorMessage(400, 'validation'),
    }));
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = `${BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Fetch wrapper for the StellarPOS API. Unwraps the `{ success, data }`
 * envelope, raises ApiError with a fixed user-facing message (never the
 * server's untrusted text), and signs the user out when the token is rejected.
 */
export async function request<T>(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Query; raw?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const token = useAuthStore.getState().token;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers: {
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the StellarPOS server. Check your connection.', 0);
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok || payload?.success === false) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      useAuthStore.getState().logout();
    }
    throw new ApiError(staticErrorMessage(res.status), res.status, safeDetails(payload?.details));
  }
  return (opts.raw ? payload : payload.data) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  getPage: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>('GET', path, { query, raw: true, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
