import { LogOut, Moon, Sun } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/i18n';
import { useRealtime, type Connection } from '@/hooks/useRealtime';
import { useCartStore } from '@/stores/cartStore';
import { useThemeStore } from '@/stores/themeStore';
import type { Role } from '@/types';
import { cn, initials } from '@/utils/helpers';
import Kbd from '../ui/Kbd';
import BrandMark from './BrandMark';
import SessionTimeout from './SessionTimeout';

// Warm a screen's code when the pointer reaches its tab, so the click feels instant.
const PREFETCH: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/dashboard/Dashboard'),
  '/inventory': () => import('@/pages/inventory/Inventory'),
  '/transactions': () => import('@/pages/transactions/Transactions'),
  '/customers': () => import('@/pages/customers/Customers'),
  '/settings': () => import('@/pages/settings/Settings'),
};

const MODES: { to: string; label: string; key: string; minRole?: Role }[] = [
  { to: '/pos', label: 'nav.register', key: '1' },
  { to: '/transactions', label: 'nav.orders', key: '2' },
  { to: '/inventory', label: 'nav.stock', key: '3' },
  { to: '/customers', label: 'nav.customers', key: '4' },
  { to: '/dashboard', label: 'nav.reports', key: '5' },
  { to: '/settings', label: 'nav.settings', key: '6' },
];

const connectionLabel: Record<Connection, string> = {
  live: 'status.live',
  connecting: 'status.connecting',
  offline: 'status.offline',
};

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>;
}

/**
 * The register shell: a mode bar along the top (keys 1-6 jump between
 * modes) and a thin status strip showing connection, network and who is on
 * the till.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, can, role } = useAuth();
  const store = useStoreSettings().data;
  const connection = useRealtime();
  const { theme, toggle } = useThemeStore();
  const cartCount = useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const navigate = useNavigate();
  const t = useT();
  // Stable across renders so the shortcut listener below is attached once.
  const modes = useMemo(
    () => MODES.filter((m) => !m.minRole || can(m.minRole)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, select, [role="dialog"]')) return;
      const mode = modes.find((m) => m.key === e.key);
      if (mode) navigate(mode.to);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modes, navigate]);

  return (
    <div className="min-h-app flex flex-col">
      <header className="no-print sticky top-0 z-30 border-b border-ink-line bg-paper/90 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <NavLink
            to="/pos"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="StellarPOS register"
          >
            <BrandMark />
            <span className="hidden font-display text-[15px] font-bold leading-none md:block">
              {store?.name ?? 'StellarPOS'}
            </span>
          </NavLink>

          <nav
            aria-label="Modes"
            className="scroll-thin -mb-px flex flex-1 items-stretch gap-1 self-stretch overflow-x-auto"
          >
            {modes.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onPointerEnter={() => void PREFETCH[m.to]?.()}
                onFocus={() => void PREFETCH[m.to]?.()}
                className={({ isActive }) =>
                  cn(
                    'group flex shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-3 hover:text-ink',
                  )
                }
              >
                {t(m.label)}
                {m.to === '/pos' && cartCount > 0 && (
                  <span className="figures rounded bg-ink px-1.5 text-[11px] text-paper">
                    {cartCount}
                  </span>
                )}
                <span className="hidden opacity-0 transition-opacity group-hover:opacity-100 xl:inline">
                  <Kbd>{m.key}</Kbd>
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={toggle}
              className="rounded-md p-2 text-ink-3 hover:bg-paper-2 hover:text-ink"
              aria-label={theme === 'dark' ? t('status.dayMode') : t('status.nightShift')}
              title={theme === 'dark' ? t('status.dayMode') : t('status.nightShift')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-paper-3 font-mono text-xs font-semibold">
                {user ? initials(user.name) : '?'}
              </span>
            </div>
            <button
              onClick={logout}
              className="rounded-md p-2 text-ink-3 hover:bg-paper-2 hover:text-ink"
              aria-label={t('status.signOut')}
              title={t('status.signOut')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex h-7 items-center gap-4 overflow-hidden whitespace-nowrap border-t border-ink-line/70 bg-paper-2/60 px-4 font-mono text-[11px] text-ink-3 sm:px-6">
          <span
            className="flex items-center gap-1.5"
            role="status"
            aria-label={`Realtime ${t(connectionLabel[connection])}`}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                connection === 'live'
                  ? 'bg-cash'
                  : connection === 'connecting'
                    ? 'bg-amber'
                    : 'bg-signal',
              )}
            />
            {t(connectionLabel[connection])}
          </span>
          {store && (
            <span className={cn('hidden sm:inline', store.stellar.enabled && 'text-lumen')}>
              Stellar {store.stellar.network}
              {store.stellar.enabled ? ` / ${store.stellar.asset.code}` : ' / not configured'}
            </span>
          )}
          <span className="ml-auto truncate">
            {user?.name} <span className="uppercase">({user?.role})</span>
          </span>
          <Clock />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      <SessionTimeout />
    </div>
  );
}
