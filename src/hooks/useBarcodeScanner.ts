import { useCallback, useEffect, useRef, useState } from 'react';

export type ScannerStatus = 'idle' | 'requesting' | 'scanning' | 'denied' | 'unsupported';

export interface UseBarcodeScanner {
  status: ScannerStatus;
  videoRef: React.RefObject<HTMLVideoElement>;
  start: () => void;
  stop: () => void;
}

/** True when the browser's BarcodeDetector API is available. */
export function barcodeScannerSupported(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * Drives the device camera + BarcodeDetector to call `onDetected` with the
 * first raw barcode value found in each animation frame.
 *
 * Usage: mount a <video ref={videoRef} autoPlay playsInline muted /> in your
 * component, call start() to open the camera, and stop() / unmount to release it.
 */
export function useBarcodeScanner(onDetected: (value: string) => void): UseBarcodeScanner {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<InstanceType<typeof BarcodeDetector> | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!barcodeScannerSupported()) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (!detectorRef.current) {
        detectorRef.current = new BarcodeDetector({
          formats: [
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'code_93',
            'qr_code',
            'data_matrix',
          ],
        });
      }

      setStatus('scanning');

      const scan = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const barcodes = await detectorRef.current!.detect(video);
          if (barcodes.length > 0) {
            onDetectedRef.current(barcodes[0].rawValue);
            return; // caller decides whether to stop
          }
        } catch {
          // detect() throws if the video frame isn't ready yet — just skip it
        }
        rafRef.current = requestAnimationFrame(scan);
      };

      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setStatus(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'idle');
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Clean up on unmount.
  useEffect(
    () => () => {
      stop();
    },
    [stop],
  );

  return { status, videoRef, start, stop };
}
