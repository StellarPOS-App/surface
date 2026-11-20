import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderWithProviders } from '@/test/utils';
import TwoFactorSettings from './TwoFactorSettings';

describe('TwoFactorSettings', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('enrols with a QR code and shows recovery codes once', async () => {
    mockFetch({
      'GET /api/v1/auth/2fa': {
        body: { success: true, data: { enabled: false, recoveryCodesLeft: 0 } },
      },
      'POST /api/v1/auth/2fa/setup': {
        body: {
          success: true,
          data: {
            secret: 'JBSWY3DPEHPK3PXP',
            otpauthUrl: 'otpauth://totp/Shop:ada?secret=JBSWY3DPEHPK3PXP',
          },
        },
      },
      'POST /api/v1/auth/2fa/enable': {
        body: { success: true, data: { enabled: true, recoveryCodes: ['AAAA-BBBB', 'CCCC-DDDD'] } },
      },
    });
    renderWithProviders(<TwoFactorSettings />);
    await userEvent.click(await screen.findByRole('button', { name: /set up two-factor/i }));

    expect(await screen.findByLabelText('Two-factor setup QR code')).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    const turnOn = screen.getByRole('button', { name: 'Turn on' });
    expect(turnOn).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Code from the app'), '654321');
    await userEvent.click(turnOn);

    expect(await screen.findByText('AAAA-BBBB')).toBeInTheDocument();
    expect(screen.getByText('CCCC-DDDD')).toBeInTheDocument();
  });

  it('turning off needs the password and a code', async () => {
    const fetch = mockFetch({
      'GET /api/v1/auth/2fa': {
        body: { success: true, data: { enabled: true, recoveryCodesLeft: 6 } },
      },
      'POST /api/v1/auth/2fa/disable': { body: { success: true, data: { enabled: false } } },
    });
    renderWithProviders(<TwoFactorSettings />);
    expect(await screen.findByText('6 recovery codes left')).toBeInTheDocument();
    const off = screen.getByRole('button', { name: /turn off/i });
    expect(off).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse-1');
    await userEvent.type(screen.getByLabelText('Code or recovery code'), '123456');
    await userEvent.click(off);
    const call = fetch.mock.calls.find(([u]) => String(u).includes('/2fa/disable'))!;
    expect(JSON.parse(String(call[1]!.body))).toEqual({
      password: 'correct-horse-1',
      code: '123456',
    });
  });
});
