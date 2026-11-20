import { useCallback, useEffect, useRef, useState } from 'react';

/* Minimal typing for the Web Speech API (not in TypeScript's DOM lib). */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

const getCtor = (): RecognitionCtor | undefined =>
  (
    window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    }
  ).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;

export const speechSupported = () => typeof window !== 'undefined' && Boolean(getCtor());

/**
 * One-shot speech recognition: start() listens for a single phrase, then
 * calls onPhrase with the final transcript. Stops itself on unmount.
 */
export function useSpeech(
  lang: string,
  onPhrase: (text: string) => void,
  onError?: (error: string) => void,
) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const rec = useRef<Recognition | null>(null);
  const handlers = useRef({ onPhrase, onError });
  handlers.current = { onPhrase, onError };

  useEffect(() => () => rec.current?.abort(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || rec.current) return;
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      const text = result[0].transcript;
      if (result.isFinal) {
        setInterim('');
        handlers.current.onPhrase(text);
      } else {
        setInterim(text);
      }
    };
    r.onerror = (e) => handlers.current.onError?.(e.error);
    r.onend = () => {
      rec.current = null;
      setListening(false);
      setInterim('');
    };
    rec.current = r;
    setListening(true);
    r.start();
  }, [lang]);

  const stop = useCallback(() => rec.current?.stop(), []);

  return { listening, interim, start, stop };
}
