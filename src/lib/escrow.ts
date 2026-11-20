/**
 * Stellar Turrets escrow helpers (FEAT-022).
 *
 * All network calls go through the backend — this module only decides
 * whether a given amount should trigger escrow mode and surfaces that
 * decision to the checkout UI.
 */

const THRESHOLD_XLM = Number(
  import.meta.env.VITE_ESCROW_THRESHOLD_XLM ?? '500',
);

const TURRET_ENDPOINT: string =
  import.meta.env.VITE_TURRET_ENDPOINT ?? '';

/** True when the environment is configured for Turrets escrow. */
export function escrowAvailable(): boolean {
  return TURRET_ENDPOINT.length > 0;
}

/**
 * Returns true when `amountXlm` is at or above the configured threshold
 * *and* a Turret endpoint is set.  Both conditions must hold.
 */
export function shouldUseEscrow(amountXlm: number): boolean {
  return escrowAvailable() && amountXlm >= THRESHOLD_XLM;
}

export type EscrowStatus =
  | 'pending_customer'
  | 'pending_merchant'
  | 'releasing'
  | 'released'
  | 'refunded';

export interface EscrowState {
  escrowId: string;
  status: EscrowStatus;
  amountXlm: number;
  expiresAt: string; // ISO-8601
}
