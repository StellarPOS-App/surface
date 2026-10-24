import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useAuthStore } from '@/stores/authStore';
import { useT } from '@/i18n';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('That does not look like an email'),
  password: z.string().min(1, 'Enter your password'),
});
type Form = z.infer<typeof schema>;

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const serverError = useAuthStore((s) => s.error);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/pos';
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const challenge = useAuthStore((s) => s.challenge);
  const t = useT();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
      // With two-factor sign-in on, a code step follows instead.
      if (useAuthStore.getState().isAuthenticated) navigate(from, { replace: true });
    } catch {
      // The store holds the message; it is rendered below.
    }
  });

  if (challenge) return <TwoFactorStep onDone={() => navigate(from, { replace: true })} />;

  return (
    <>
      <h2 className="font-display text-4xl font-extrabold tracking-tight">{t('login.title')}</h2>
      <p className="mt-2 text-ink-2">{t('login.subtitle')}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <Input
          label={t('login.email')}
          type="email"
          autoComplete="username"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label={t('login.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {serverError && (
          <p role="alert" className="rounded-lg bg-signal-soft px-3 py-2 text-sm text-signal">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          {t('login.submit')}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-3">
        {t('login.newStore')}{' '}
        <Link to="/auth/register" className="font-medium text-ink underline underline-offset-4">
          {t('login.createOwner')}
        </Link>
      </p>
      <details className="mt-8 rounded-lg border border-dashed border-ink-line px-4 py-3 text-sm text-ink-2">
        <summary className="cursor-pointer font-medium text-ink">Trying the demo?</summary>
        <p className="mt-2">
          After <code className="font-mono">npm run db:seed</code> on the backend, sign in as{' '}
          <code className="font-mono">admin@stellarpos.dev</code> with password{' '}
          <code className="font-mono">stellarpos-demo</code>.
        </p>
      </details>
    </>
  );
}

/** Second sign-in step: a 6-digit code from the authenticator app, or a recovery code. */
function TwoFactorStep({ onDone }: { onDone: () => void }) {
  const { verifyTwoFactor, cancelTwoFactor, error } = useAuthStore();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const valid = recovery
    ? /^[A-Za-z2-9]{4}-?[A-Za-z2-9]{4}$/.test(code.trim())
    : /^\d{6}$/.test(code);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await verifyTwoFactor(code.trim());
      onDone();
    } catch {
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-4xl font-extrabold tracking-tight">Enter your code</h2>
      <p className="mt-2 text-ink-2">
        {recovery
          ? 'Type one of the recovery codes you saved when you turned on two-factor sign-in.'
          : 'Open your authenticator app and type the 6-digit code for this till.'}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <Input
          label={recovery ? 'Recovery code' : 'Authentication code'}
          autoFocus
          autoComplete="one-time-code"
          inputMode={recovery ? 'text' : 'numeric'}
          maxLength={recovery ? 9 : 6}
          placeholder={recovery ? 'XXXX-XXXX' : '123456'}
          className="figures text-center text-2xl tracking-[0.3em]"
          value={code}
          onChange={(e) =>
            setCode(recovery ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))
          }
        />
        {error && (
          <p role="alert" className="rounded-lg bg-signal-soft px-3 py-2 text-sm text-signal">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" fullWidth loading={busy} disabled={!valid}>
          Verify and open register
        </Button>
      </form>
      <div className="mt-6 flex justify-between text-sm">
        <button
          type="button"
          className="text-ink-2 underline underline-offset-4"
          onClick={() => {
            setRecovery(!recovery);
            setCode('');
          }}
        >
          {recovery ? 'Use the authenticator app' : 'Use a recovery code'}
        </button>
        <button type="button" className="text-ink-3 hover:text-ink" onClick={cancelTwoFactor}>
          Back
        </button>
      </div>
    </>
  );
}
