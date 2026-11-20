import { Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { useOnline } from '@/hooks/useOnline';
import { speechSupported, useSpeech } from '@/hooks/useSpeech';
import { useLanguageStore, useT } from '@/i18n';
import { parseVoiceCommand } from '@/lib/voice';
import { useCartStore } from '@/stores/cartStore';
import type { CatalogProduct, PaymentMethod } from '@/types';
import { cn } from '@/utils/helpers';

const SPEECH_LANG = { en: 'en-US', fr: 'fr-FR', es: 'es-ES' } as const;

/**
 * Hands-free register: tap, say "add two flat whites" or "charge cash".
 * Every action is confirmed with a toast; nothing is charged without the
 * normal checkout screen.
 */
export default function VoiceButton({
  catalog,
  onSearch,
  onCharge,
}: {
  catalog: CatalogProduct[];
  onSearch: (query: string) => void;
  onCharge: (method: PaymentMethod) => void;
}) {
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const online = useOnline();
  const { add, remove, clear, lines } = useCartStore();

  const run = (said: string) => {
    const cmd = parseVoiceCommand(said, catalog);
    switch (cmd.kind) {
      case 'add':
        if (add(cmd.product, cmd.quantity))
          toast.success(t('voice.added', { count: cmd.quantity, name: cmd.product.name }));
        else
          toast.error(t('pos.onlyInStock', { count: cmd.product.stock, name: cmd.product.name }));
        break;
      case 'remove':
        remove(cmd.product.id);
        toast.success(t('voice.removed', { name: cmd.product.name }));
        break;
      case 'clear':
        clear();
        toast.success(t('voice.cleared'));
        break;
      case 'search':
        onSearch(cmd.query);
        break;
      case 'charge':
        if (!lines.length) toast.error(t('voice.nothingToCharge'));
        else if (!online) toast.error(t('status.offlineBanner'));
        else onCharge(cmd.method);
        break;
      default:
        toast.error(
          cmd.reason === 'no-product'
            ? t('voice.noProduct', { text: said })
            : t('voice.notUnderstood', { text: said }),
        );
    }
  };

  const { listening, interim, start, stop } = useSpeech(SPEECH_LANG[language], run, (error) => {
    if (error === 'not-allowed' || error === 'service-not-allowed')
      toast.error(t('voice.permission'));
  });

  if (!speechSupported()) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? t('voice.stop') : t('voice.start')}
        title={t('voice.hint')}
        className={cn(
          'grid h-12 w-12 place-items-center rounded-lg border shadow-sm transition-colors',
          listening
            ? 'animate-pulse-ring border-lumen bg-lumen text-white'
            : 'border-ink-line bg-paper-card text-ink-2 hover:text-ink',
        )}
      >
        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      {listening && (
        <p
          role="status"
          aria-live="polite"
          className="absolute right-0 top-14 z-10 w-64 rounded-lg bg-ink px-3 py-2 text-sm text-paper shadow-slip"
        >
          {interim || t('voice.listening')}
        </p>
      )}
    </div>
  );
}
