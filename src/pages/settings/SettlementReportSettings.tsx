import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import {
  useSaveSettlementConfig,
  useSendSettlementReport,
  useSettlementConfig,
} from '@/hooks/useSettlementReport';

// A representative list of IANA timezone identifiers grouped by region.
const TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Accra',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SettlementReportSettings() {
  const { data: config, isLoading } = useSettlementConfig();
  const save = useSaveSettlementConfig();
  const send = useSendSettlementReport();

  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [timezone, setTimezone] = useState(config?.timezone ?? 'UTC');
  const [recipientEmail, setRecipientEmail] = useState(config?.recipientEmail ?? '');
  const [manualDate, setManualDate] = useState(todayISO());

  // Sync local state when remote config loads
  if (config && !isLoading) {
    if (config.enabled !== enabled && recipientEmail === '' && timezone === 'UTC') {
      setEnabled(config.enabled);
      setTimezone(config.timezone);
      setRecipientEmail(config.recipientEmail);
    }
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    save.mutate({ enabled, timezone, recipientEmail });
  }

  function handleSendNow() {
    send.mutate(manualDate);
  }

  if (isLoading) return null;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          id="settlement-enabled"
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-ink-line accent-brand"
        />
        <label htmlFor="settlement-enabled" className="text-sm font-medium">
          Send end-of-day settlement report automatically at midnight
        </label>
      </div>

      <Select
        label="Merchant timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        disabled={!enabled}
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </Select>

      <Input
        label="Report recipient email"
        type="email"
        value={recipientEmail}
        onChange={(e) => setRecipientEmail(e.target.value)}
        placeholder="merchant@example.com"
        required={enabled}
        disabled={!enabled}
      />

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save'}
      </Button>

      <hr className="border-ink-line" />

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink-2">Send report now</p>
        <div className="flex items-end gap-3">
          <Input
            label="Date (YYYY-MM-DD)"
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="w-44"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleSendNow}
            disabled={send.isPending}
          >
            {send.isPending ? 'Sending…' : 'Send report'}
          </Button>
        </div>
        <p className="text-xs text-ink-3">
          Generates and emails the settlement summary for the selected date to the recipient
          address above.
        </p>
      </div>
    </form>
  );
}
