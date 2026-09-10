import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * staleTime politikası (new-client.md §7):
 *  - schedule (years/races/sessions/drivers): ~1 saat
 *  - telemetry / laps / compare: ~1 gün (geçmiş veri değişmez)
 * Bu sabitler query hook'larında `staleTime` olarak kullanılır.
 */
export const STALE = {
  schedule: HOUR,
  telemetry: DAY,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.schedule,
      gcTime: DAY,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Rate limit ve 4xx'te tekrar deneme; yalnızca 1 kez retry.
        if (error instanceof ApiError) {
          if (error.isRateLimit || (error.status >= 400 && error.status < 500)) return false;
        }
        return failureCount < 1;
      },
    },
  },
});
