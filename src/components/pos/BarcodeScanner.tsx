import { ScanBarcode } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { barcodeScannerSupported, useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useT } from '@/i18n';
import type { CatalogProduct } from '@/types';
import { cn } from '@/utils/helpers';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function BarcodeScanner({
  open,
  onClose,
  catalog,
  onMatch,
}: {
  open: boolean;
  onClose: () => void;
  catalog: CatalogProduct[];
  onMatch: (productId: string) => void;
}) {
  const t = useT();

  const handleDetected = (raw: string) => {
    const value = raw.trim();
    const hit = catalog.find((p) => p.sku === value);
    if (hit) {
      onMatch(hit.id);
      toast.success(t('pos.barcodeFound', { name: hit.name }));
      onClose();
    } else {
      toast.error(t('pos.barcodeNotFound', { code: value }));
    }
  };

  const { status, videoRef, start, stop } = useBarcodeScanner(handleDetected);

  // Start scanning when the modal opens; stop when it closes.
  useEffect(() => {
    if (open) {
      start();
    } else {
      stop();
    }
  }, [open, start, stop]);

  if (!barcodeScannerSupported()) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t('pos.barcodeScannerEyebrow')}
      title={t('pos.barcodeScannerTitle')}
      size="sm"
    >
      <div className="space-y-4">
        {/* Camera viewfinder */}
        <div className="relative overflow-hidden rounded-xl bg-ink aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-label={t('pos.barcodeCameraFeed')}
          />
          {/* Aim reticle */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="h-40 w-56 rounded-xl border-2 border-lumen opacity-70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>

          {status === 'requesting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/60">
              <p className="text-sm text-paper">{t('pos.barcodeRequesting')}</p>
            </div>
          )}
          {status === 'denied' && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-6 text-center">
              <p className="text-sm text-signal">{t('pos.barcodeDenied')}</p>
            </div>
          )}
        </div>

        <p
          className={cn(
            'text-center text-sm',
            status === 'scanning' ? 'text-ink-2' : 'text-ink-3',
          )}
        >
          {status === 'scanning'
            ? t('pos.barcodeScanning')
            : status === 'requesting'
              ? t('pos.barcodeRequesting')
              : status === 'denied'
                ? t('pos.barcodeDenied')
                : t('pos.barcodeIdle')}
        </p>

        <Button variant="secondary" className="w-full" onClick={onClose}>
          {t('pos.cancel')}
        </Button>
      </div>
    </Modal>
  );
}
