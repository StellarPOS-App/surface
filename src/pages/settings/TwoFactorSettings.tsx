import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { api } from '@/lib/api';
import { copyText } from '@/lib/clipboard';
import { downloadFile } from '@/lib/csv';
import { useAuthStore } from '@/stores/authStore';

interface Status {
  enabled: boolean;
  recoveryCodesLeft: number;
}

/** Turn authenticator-app sign-in on or off for the signed-in account. */
export default function TwoFactorSettings() {
  const qc = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['2fa'],
    queryFn: () => api.get<Status>('/auth/2fa'),
  });
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const done = (enabled: boolean) => {
    qc.invalidateQueries({ queryKey: ['2fa'] });
    const user = useAuthStore.getState().user;
    if (user) useAuthStore.getState().setUser({ ...user, twoFactorEnabled: enabled });
    setCode('');
    setPassword('');
  };

  const start = useMutation({
    mutationFn: () => api.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/setup'),
    onSuccess: setSetup,
    onError: (e) => toast.error(e.message),
  });
  const enable = useMutation({
    mutationFn: () => api.post<{ recoveryCodes: string[] }>('/auth/2fa/enable', { code }),
    onSuccess: (r) => {
      setCodes(r.recoveryCodes);
      setSetup(null);
      done(true);
      toast.success('Two-factor sign-in is on');
    },
    onError: (e) => toast.error(e.message),
  });
  const disable = useMutation({
    mutationFn: () => api.post('/auth/2fa/disable', { password, code }),
    onSuccess: () => {
      done(false);
      toast.success('Two-factor sign-in is off');
    },
    onError: (e) => toast.error(e.message),
  });

  if (!status) return null;

  if (codes) {
    return (
      <div className="max-w-xl space-y-4">
        <p className="font-medium">
          Save these recovery codes now. Each works once if you lose your phone.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-lg border border-ink-line bg-paper-card p-4 font-mono">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={() =>
              downloadFile('stellarpos-recovery-codes.txt', codes.join('\n') + '\n', 'text/plain')
            }
          >
            Download
          </Button>
          <Button
            variant="secondary"
            onClick={async () => (await copyText(codes.join('\n'))) && toast.success('Copied')}
          >
            Copy
          </Button>
          <Button onClick={() => setCodes(null)}>I have saved them</Button>
        </div>
      </div>
    );
  }

  if (status.enabled) {
    return (
      <form
        className="max-w-xl space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          disable.mutate();
        }}
      >
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cash" />
          <Badge tone="cash">on</Badge>
          <span className="text-sm text-ink-2">{status.recoveryCodesLeft} recovery codes left</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Code or recovery code"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          loading={disable.isPending}
          disabled={!password || code.length < 6}
        >
          Turn off two-factor sign-in
        </Button>
      </form>
    );
  }

  if (setup) {
    return (
      <div className="grid max-w-2xl gap-6 sm:grid-cols-[auto_1fr]">
        <div className="mx-auto rounded-xl bg-white p-3 shadow-slip">
          <QRCode value={setup.otpauthUrl} size={168} aria-label="Two-factor setup QR code" />
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            enable.mutate();
          }}
        >
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
            <li>
              Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password).
            </li>
            <li>Type the 6-digit code it shows.</li>
          </ol>
          <p className="text-xs text-ink-3">
            Can't scan? Enter this key:{' '}
            <code className="break-all font-mono text-ink">{setup.secret}</code>
          </p>
          <Input
            label="Code from the app"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="figures tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={enable.isPending} disabled={code.length !== 6}>
              Turn on
            </Button>
            <Button variant="ghost" onClick={() => setSetup(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-3">
      <p className="text-sm text-ink-2">
        Ask for a code from your phone at sign-in, so a stolen password alone cannot open this till.
      </p>
      <Button
        icon={<ShieldCheck className="h-4 w-4" />}
        loading={start.isPending}
        onClick={() => start.mutate()}
      >
        Set up two-factor sign-in
      </Button>
    </div>
  );
}
