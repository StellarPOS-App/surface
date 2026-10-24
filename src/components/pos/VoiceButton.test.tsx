import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { makeProduct, renderWithProviders } from '@/test/utils';
import VoiceButton from './VoiceButton';

/** A fake SpeechRecognition the test can "speak" into. */
class FakeRecognition {
  static last: FakeRecognition | null = null;
  lang = '';
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: unknown) => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = false;
  constructor() {
    FakeRecognition.last = this;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.onend?.();
  }
  say(text: string) {
    const result = Object.assign([{ transcript: text }], { isFinal: true });
    this.onresult?.({ results: [result] });
    this.onend?.();
  }
}

const flat = makeProduct({ name: 'Flat White', sku: 'COF-FLW', stock: 10 });

describe('VoiceButton', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRecognition;
  });
  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it('is hidden when the browser has no speech recognition', () => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    renderWithProviders(<VoiceButton catalog={[flat]} onSearch={vi.fn()} onCharge={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /voice/i })).toBeNull();
  });

  it('adds products by voice in the app language', async () => {
    renderWithProviders(<VoiceButton catalog={[flat]} onSearch={vi.fn()} onCharge={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Voice command' }));
    expect(FakeRecognition.last!.started).toBe(true);
    expect(FakeRecognition.last!.lang).toBe('en-US');
    act(() => FakeRecognition.last!.say('add two flat whites'));
    expect(useCartStore.getState().lines).toEqual([{ product: flat, quantity: 2 }]);
  });

  it('only charges a non-empty order', async () => {
    const onCharge = vi.fn();
    renderWithProviders(<VoiceButton catalog={[flat]} onSearch={vi.fn()} onCharge={onCharge} />);
    await userEvent.click(screen.getByRole('button', { name: 'Voice command' }));
    act(() => FakeRecognition.last!.say('charge cash'));
    expect(onCharge).not.toHaveBeenCalled();

    useCartStore.getState().add(flat);
    await userEvent.click(screen.getByRole('button', { name: 'Voice command' }));
    act(() => FakeRecognition.last!.say('pay with card'));
    expect(onCharge).toHaveBeenCalledWith('card');
  });

  it('routes searches to the search box', async () => {
    const onSearch = vi.fn();
    renderWithProviders(<VoiceButton catalog={[flat]} onSearch={onSearch} onCharge={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Voice command' }));
    act(() => FakeRecognition.last!.say('search for latte'));
    expect(onSearch).toHaveBeenCalledWith('latte');
  });
});
