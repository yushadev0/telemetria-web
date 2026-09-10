import type { ApiErrorBody } from './types';

/**
 * API tabanı. Boş string = same-origin: fetch relative path'e gider
 * (prod nginx reverse-proxy senaryosu). Dev'de `.env` backend'i hedefler.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL?.replace(/\/$/, '') ?? '';

/** `/api/v1/...` → tam istek URL'i. */
export function buildApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

/**
 * `/ws/live/{room}` → tam WS URL'i.
 * - `ws(s)://host` biçiminde taban verilmişse doğrudan kullanılır (dev).
 * - Taban boş ya da `/telemetria` gibi bir yol öneki ise: window.location'dan
 *   protokol+host alınır (http→ws, https→wss), önek araya eklenir (prod, same-origin).
 */
export function buildWsUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (/^wss?:\/\//i.test(WS_BASE_URL)) return `${WS_BASE_URL}${p}`;
  const { protocol, host } = window.location;
  const wsProto = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProto}//${host}${WS_BASE_URL}${p}`;
}

/** Normalize edilmiş API hatası. UI `ErrorState` bunu gösterir. */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  /** slowapi rate limit (429) — çağıran taraf debounce / "lütfen bekleyin" gösterir. */
  get isRateLimit(): boolean {
    return this.status === 429;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

async function extractDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as Partial<ApiErrorBody>;
    if (body && typeof body.detail === 'string') return body.detail;
  } catch {
    /* JSON değil */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export interface ApiFetchOptions {
  signal?: AbortSignal;
  /** Query string parametreleri (undefined olanlar atlanır). */
  params?: Record<string, string | number | undefined>;
}

/**
 * Tek giriş noktası: JSON GET. Hataları `ApiError`'a normalize eder,
 * ağ hatasında status=0 kullanır. TanStack Query dedupe/cache/retry'ı üstte yapar.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = new URL(buildApiUrl(path), window.location.origin);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: options.signal,
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }

  if (!res.ok) {
    throw new ApiError(res.status, await extractDetail(res));
  }

  return (await res.json()) as T;
}

/** Path segment kodlayıcı — `event_name` gibi boşluklu/özel karakterli değerler için. */
export const enc = encodeURIComponent;
