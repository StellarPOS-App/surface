import { ApiError } from './api';
import { publicErrorMessage, redactSensitive, reportError, safeStringify } from './safeErrors';

describe('safe error handling', () => {
  it('redacts password-like keys at any depth before logging', () => {
    const form = {
      email: 'cashier@shop.test',
      password: 'hunter2',
      nested: { currentPassword: 'old-secret', apiKey: 'key-123', keep: 42 },
    };

    expect(redactSensitive(form)).toEqual({
      email: 'cashier@shop.test',
      password: '[REDACTED]',
      nested: { currentPassword: '[REDACTED]', apiKey: '[REDACTED]', keep: 42 },
    });
    expect(safeStringify(form)).not.toContain('hunter2');
    expect(safeStringify(form)).not.toContain('old-secret');
  });

  it('never renders server-supplied text as a user-facing message', () => {
    const attackerText = '<img src=x onerror="alert(1)">';
    expect(publicErrorMessage(new ApiError(attackerText, 400))).toBe(
      'Check the information you entered and try again.',
    );
    expect(publicErrorMessage(new Error(attackerText), 'auth')).toBe(
      'Something went wrong. Please try again.',
    );
    expect(publicErrorMessage(new ApiError(attackerText, 401), 'auth')).toBe(
      'The email or password is incorrect.',
    );
  });

  it('reports only error class, status and redacted details', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      reportError('auth.login', new ApiError('server says secret-password-hunter2', 401), {
        email: 'cashier@shop.test',
        password: 'hunter2',
      });
      const logged = spy.mock.calls[0]!.join(' ');
      expect(logged).toContain('[REDACTED]');
      expect(logged).not.toContain('hunter2');
      expect(logged).not.toContain('server says');
    } finally {
      spy.mockRestore();
    }
  });
});
