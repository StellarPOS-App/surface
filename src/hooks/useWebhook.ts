import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WebhookConfig, WebhookEvent } from '@/lib/webhook';

const WEBHOOK_KEY = ['store', 'webhook'] as const;

/** Fetch the merchant's current webhook configuration. */
export function useWebhookConfig() {
  return useQuery({
    queryKey: WEBHOOK_KEY,
    queryFn: () => api.get<WebhookConfig>('/store/webhook'),
    // A 404 means no webhook is configured yet — treat it as empty rather
    // than an error so the form renders with blank fields.
    retry: (failureCount, err: unknown) => {
      const status = (err as { status?: number }).status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}

interface SaveWebhookInput {
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
}

/** Create or update the merchant's webhook configuration. */
export function useSaveWebhookConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWebhookInput) => api.put<WebhookConfig>('/store/webhook', input),
    onSuccess: (data) => {
      qc.setQueryData(WEBHOOK_KEY, data);
    },
  });
}
