import { Webhook } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useWebhookConfig, useSaveWebhookConfig } from '@/hooks/useWebhook';
import { WEBHOOK_EVENTS, validateWebhookUrl, type WebhookEvent } from '@/lib/webhook';

export default function WebhookSettings() {
  const { data, isLoading } = useWebhookConfig();
  const save = useSaveWebhookConfig();

  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['transaction.completed']);
  const [enabled, setEnabled] = useState(true);

  // Sync local state once the query resolves.
  const [synced, setSynced] = useState(false);
  if (data && !synced) {
    setUrl(data.url);
    setEvents(data.events);
    setEnabled(data.enabled);
    setSynced(true);
  }

  function toggleEvent(ev: WebhookEvent) {
    setEvents((prev) => (prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const urlError = validateWebhookUrl(url);
    if (urlError) {
      toast.error(urlError);
      return;
    }
    if (events.length === 0) {
      toast.error('Select at least one event to subscribe to');
      return;
    }
    save.mutate(
      { url, events, enabled },
      {
        onSuccess: () => toast.success('Webhook configuration saved'),
        onError: () => toast.error('Failed to save webhook configuration'),
      },
    );
  }

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div className="space-y-1">
        <Input
          label="Endpoint URL"
          type="url"
          placeholder="https://yourapp.example.com/hooks/pos"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <p className="text-xs text-ink-3">
          Must be HTTPS. The backend sends a POST with an{' '}
          <code className="font-mono">X-StellarPOS-Signature</code> header (HMAC-SHA256 of the
          payload, keyed to your signing secret).
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Events to receive</legend>
        <div className="space-y-2">
          {WEBHOOK_EVENTS.map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="accent-hue h-4 w-4 rounded border-ink-line"
                checked={events.includes(value)}
                onChange={() => toggleEvent(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="accent-hue h-4 w-4 rounded border-ink-line"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span>Enable webhook delivery</span>
      </label>

      {data?.secret && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-700 dark:bg-amber-900/20">
          <p className="font-semibold text-amber-700 dark:text-amber-400">
            Signing secret — copy now, it won't be shown again
          </p>
          <code className="mt-1 block break-all font-mono text-amber-800 dark:text-amber-300">
            {data.secret}
          </code>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={save.isPending}>
          <Webhook className="h-4 w-4" />
          Save webhook
        </Button>
        {data?.url && !save.isPending && (
          <p className="text-xs text-ink-3">
            Last saved: <span className="font-mono">{data.url}</span>
          </p>
        )}
      </div>
    </form>
  );
}
