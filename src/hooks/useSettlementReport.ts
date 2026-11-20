import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { generateAndSendSettlementReport, toLocalDate } from '@/lib/settlementReport';
import { useStoreSettings } from '@/hooks/queries';

export interface SettlementConfig {
  enabled: boolean;
  timezone: string;
  recipientEmail: string;
}

const SETTLEMENT_KEY = ['store', 'settlement-config'] as const;

/** Fetch the merchant's settlement report configuration. */
export const useSettlementConfig = () =>
  useQuery({
    queryKey: SETTLEMENT_KEY,
    queryFn: () => api.get<SettlementConfig>('/store/settlement-config'),
    staleTime: 5 * 60_000,
  });

/** Save the merchant's settlement report configuration. */
export const useSaveSettlementConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: SettlementConfig) =>
      api.put<SettlementConfig>('/store/settlement-config', config),
    onSuccess: (data) => {
      qc.setQueryData(SETTLEMENT_KEY, data);
      toast.success('Settlement report settings saved.');
    },
    onError: () => toast.error('Failed to save settlement report settings.'),
  });
};

/** Trigger a settlement report manually for a specific date (YYYY-MM-DD). */
export const useSendSettlementReport = () => {
  const { data: storeSettings } = useStoreSettings();
  const { data: settlementConfig } = useSettlementConfig();

  return useMutation({
    mutationFn: (date: string) => {
      const timezone = settlementConfig?.timezone ?? 'UTC';
      const currency = storeSettings?.currency ?? 'USD';
      return generateAndSendSettlementReport(date, timezone, currency);
    },
    onSuccess: (_data, date) => toast.success(`Settlement report for ${date} sent.`),
    onError: () => toast.error('Failed to generate or send the settlement report.'),
  });
};

/**
 * Schedules the end-of-day settlement report to fire at midnight in the
 * merchant's configured timezone. Clears and reschedules whenever the
 * config changes. Does nothing when settlement reports are disabled.
 */
export function useScheduleSettlementReport() {
  const { data: storeSettings } = useStoreSettings();
  const { data: config } = useSettlementConfig();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currency = storeSettings?.currency ?? 'USD';
  const enabled = config?.enabled ?? false;
  const timezone = config?.timezone ?? 'UTC';

  useEffect(() => {
    if (!enabled) return;

    function scheduleNext() {
      const now = new Date();
      // Current local date in the merchant timezone
      const todayLocal = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        dateStyle: 'short',
      }).format(now);

      // Build the next midnight UTC for this timezone
      const [y, m, d] = todayLocal.split('-').map(Number);
      // Tomorrow midnight in merchant timezone: iterate minute-by-minute is
      // expensive; use a shortcut — start from tomorrow noon UTC and walk back
      // until the local date flips.
      const tomorrowNoonUtc = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
      const tomorrowLocal = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        dateStyle: 'short',
      }).format(tomorrowNoonUtc);

      // Binary-search midnight offset (± 14 h)
      let lo = -14 * 60,
        hi = 14 * 60;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const candidate = new Date(Date.UTC(y, m - 1, d + 1, 0, -mid, 0));
        const local = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          dateStyle: 'short',
        }).format(candidate);
        if (local <= tomorrowLocal) hi = mid;
        else lo = mid + 1;
      }
      const nextMidnightUtc = new Date(Date.UTC(y, m - 1, d + 1, 0, -lo, 0));
      const msUntilMidnight = nextMidnightUtc.getTime() - now.getTime();

      timerRef.current = setTimeout(async () => {
        try {
          await generateAndSendSettlementReport(todayLocal, timezone, currency);
          toast.success(`End-of-day report for ${todayLocal} sent.`);
        } catch {
          toast.error('Scheduled settlement report failed.');
        }
        scheduleNext(); // reschedule for the following midnight
      }, msUntilMidnight);
    }

    scheduleNext();
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [enabled, timezone, currency]);
}
