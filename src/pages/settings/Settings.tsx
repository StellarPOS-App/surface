import { ExternalLink, Moon, Sun, UserPlus } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import {
  useCreateStaff,
  useStaff,
  useStoreSettings,
  useUpdateProfile,
  useUpdateRole,
  useWallet,
} from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/stores/themeStore';
import { LANGUAGES, useLanguageStore, useT, type Language } from '@/i18n';
import ReceiptSettings from './ReceiptSettings';
import TwoFactorSettings from './TwoFactorSettings';
import type { Role } from '@/types';
import { formatAssetAmount, truncateMiddle } from '@/utils/helpers';

/** Settings are laid out as a spec sheet: label column on the left, controls on the right. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-ink-line py-8 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-ink-3">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (next && next.length < 8) return toast.error('New password must be at least 8 characters');
    update.mutate(
      {
        ...(name !== user?.name ? { name } : {}),
        ...(next ? { currentPassword: current, newPassword: next } : {}),
      },
      {
        onSuccess: (u) => {
          setUser(u);
          setCurrent('');
          setNext('');
          toast.success('Profile saved');
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid max-w-xl gap-4 sm:grid-cols-2">
      <Input
        wrapperClassName="sm:col-span-2"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        hint="Leave blank to keep it"
      />
      <div className="sm:col-span-2">
        <Button type="submit" loading={update.isPending} disabled={name === user?.name && !next}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

function Wallet() {
  const store = useStoreSettings().data;
  const { data, isLoading, isError, error } = useWallet();
  if (!store) return null;
  const s = store.stellar;
  const explorer = `https://stellar.expert/explorer/${s.network === 'mainnet' ? 'public' : 'testnet'}/account/${s.merchantPublicKey}`;
  return (
    <div className="space-y-4">
      <dl className="grid max-w-xl grid-cols-[140px_1fr] gap-y-2 font-mono text-sm">
        <dt className="text-ink-3">Network</dt>
        <dd>
          <Badge tone={s.network === 'mainnet' ? 'ink' : 'amber'}>{s.network}</Badge>
        </dd>
        <dt className="text-ink-3">Settles in</dt>
        <dd>
          {s.asset.code}
          {s.asset.issuer ? ` (${truncateMiddle(s.asset.issuer, 4, 4)})` : ' (native)'}
        </dd>
        <dt className="text-ink-3">Rate</dt>
        <dd>
          1 {s.asset.code} = {s.assetRate} {store.currency}
        </dd>
        <dt className="text-ink-3">QR expires</dt>
        <dd>after {s.paymentTtlMinutes} min</dd>
        <dt className="text-ink-3">Receiving account</dt>
        <dd className="break-all">
          {s.merchantPublicKey ? (
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="text-lumen underline-offset-2 hover:underline"
            >
              {truncateMiddle(s.merchantPublicKey, 8, 8)}{' '}
              <ExternalLink className="inline h-3 w-3" />
            </a>
          ) : (
            <span className="text-signal">not configured</span>
          )}
        </dd>
      </dl>
      {s.enabled && (
        <div className="max-w-xl rounded-lg border border-ink-line bg-paper-card">
          <p className="eyebrow border-b border-ink-line px-4 py-2">Live balances</p>
          {isLoading && (
            <div className="p-4">
              <LoadingSpinner />
            </div>
          )}
          {isError && <p className="p-4 text-sm text-signal">{error.message}</p>}
          <ul className="divide-y divide-ink-line">
            {data?.balances.map((b) => (
              <li
                key={`${b.assetCode}-${b.assetIssuer}`}
                className="flex justify-between px-4 py-2.5 font-mono text-sm"
              >
                <span>{b.assetCode}</span>
                <span className="tabular-nums">{formatAssetAmount(b.balance)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="max-w-xl text-xs text-ink-3">
        StellarPOS never holds this account's secret key. The server only watches it for incoming
        payments; moving funds is done from your own wallet.
      </p>
    </div>
  );
}

function Staff() {
  const { user } = useAuth();
  const { data, isLoading } = useStaff();
  const updateRole = useUpdateRole();
  const create = useCreateStaff();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' as Role });

  return (
    <>
      <div className="max-w-2xl overflow-hidden rounded-lg border border-ink-line bg-paper-card">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-ink-line">
            {isLoading && (
              <tr>
                <td className="p-4">
                  <LoadingSpinner />
                </td>
              </tr>
            )}
            {data?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {u.name}
                    {u.id === user?.id && <span className="ml-2 text-xs text-ink-3">(you)</span>}
                  </p>
                  <p className="text-xs text-ink-3">{u.email}</p>
                </td>
                <td className="w-40 px-4 py-3">
                  <Select
                    aria-label={`Role for ${u.name}`}
                    value={u.role}
                    disabled={u.id === user?.id || updateRole.isPending}
                    onChange={(e) =>
                      updateRole.mutate(
                        { id: u.id, role: e.target.value as Role },
                        {
                          onSuccess: () => toast.success(`${u.name} is now ${e.target.value}`),
                          onError: (err) => toast.error(err.message),
                        },
                      )
                    }
                  >
                    <option value="cashier">cashier</option>
                    <option value="manager">manager</option>
                    <option value="admin">admin</option>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button
        variant="secondary"
        className="mt-4"
        icon={<UserPlus className="h-4 w-4" />}
        onClick={() => setAdding(true)}
      >
        Add staff member
      </Button>
      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        eyebrow="Staff"
        title="Add a staff member"
        size="sm"
        footer={
          <Button
            loading={create.isPending}
            onClick={() =>
              create.mutate(form, {
                onSuccess: (u) => {
                  toast.success(`${u.name} can now sign in`);
                  setAdding(false);
                  setForm({ name: '', email: '', password: '', role: 'cashier' });
                },
                onError: (err) => toast.error(err.message),
              })
            }
          >
            Add
          </Button>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Temporary password"
            type="text"
            hint="At least 8 characters. Ask them to change it."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            <option value="cashier">Cashier: sales, payments, customers</option>
            <option value="manager">Manager: plus stock, refunds, wallet</option>
            <option value="admin">Admin: plus staff</option>
          </Select>
        </div>
      </Modal>
    </>
  );
}

function LanguageSection() {
  const t = useT();
  const { language, setLanguage } = useLanguageStore();
  return (
    <Section title={t('settings.language')} description={t('settings.languageHint')}>
      <div
        className="inline-flex rounded-lg border border-ink-line bg-paper-card p-1"
        role="radiogroup"
        aria-label={t('settings.language')}
      >
        {(Object.keys(LANGUAGES) as Language[]).map((code) => (
          <button
            key={code}
            role="radio"
            lang={code}
            aria-checked={language === code}
            onClick={() => setLanguage(code)}
            className={`rounded-md px-4 py-2 text-sm ${language === code ? 'bg-ink text-paper' : 'text-ink-2'}`}
          >
            {LANGUAGES[code].label}
          </button>
        ))}
      </div>
    </Section>
  );
}

export default function Settings() {
  const { can } = useAuth();
  const { theme, setTheme } = useThemeStore();
  const store = useStoreSettings().data;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Settings" title="Till configuration" />
      <Section title="Your profile" description="Your name appears on receipts you ring up.">
        <Profile />
      </Section>
      <Section
        title="Two-factor sign-in"
        description="A code from an authenticator app on top of your password."
      >
        <TwoFactorSettings />
      </Section>
      <Section title="Receipts" description="Header, footer and what prints. Saved on this till.">
        <ReceiptSettings />
      </Section>
      <LanguageSection />
      <Section
        title="Appearance"
        description="Night shift swaps the paper for charcoal. Saved on this device."
      >
        <div
          className="inline-flex rounded-lg border border-ink-line bg-paper-card p-1"
          role="radiogroup"
          aria-label="Theme"
        >
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={theme === t}
              onClick={() => setTheme(t)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm ${theme === t ? 'bg-ink text-paper' : 'text-ink-2'}`}
            >
              {t === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {t === 'light' ? 'Day' : 'Night shift'}
            </button>
          ))}
        </div>
      </Section>
      {store && (
        <Section title="Store" description="Set on the server through environment variables.">
          <dl className="grid max-w-xl grid-cols-[140px_1fr] gap-y-2 font-mono text-sm">
            <dt className="text-ink-3">Name</dt>
            <dd>{store.name}</dd>
            <dt className="text-ink-3">Currency</dt>
            <dd>{store.currency}</dd>
            <dt className="text-ink-3">Sales tax</dt>
            <dd>{(store.taxRateBps / 100).toFixed(2)}%</dd>
          </dl>
        </Section>
      )}
      {can('manager') && (
        <Section
          title="Stellar payments"
          description="Where QR payments land, and what that account holds right now."
        >
          <Wallet />
        </Section>
      )}
      {can('admin') && (
        <Section title="Staff" description="Who can open the till, and what they can do.">
          <Staff />
        </Section>
      )}
    </div>
  );
}
