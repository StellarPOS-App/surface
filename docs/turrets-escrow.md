# Stellar Turrets Escrow

StellarPOS can place high-value transactions into a **trustless escrow** contract
hosted on [Stellar Turrets](https://turrets.stellar.org/) before the payment is
considered settled. The merchant and customer each control one confirmation key;
the Turret acts as the neutral third party that co-signs the release only when
both sides agree.

> **Status:** optional add-on. Escrow is **off by default** and activates only
> for single transactions that exceed the configurable threshold
> (`VITE_ESCROW_THRESHOLD_XLM`). Standard payments below the threshold work
> exactly as before.

---

## How it works

```
 Cashier rings up sale
        │
        ▼
 Amount ≥ threshold?
   No ──────────────► normal Stellar QR checkout (unchanged)
   Yes
        │
        ▼
 Backend calls Turret to create an escrow txn
        │
        ▼
 Customer scans escrow QR and signs  (key A)
        │
        ▼
 Merchant confirms in POS app        (key B)
        │
        ▼
 Turret co-signs and broadcasts the release
        │
        ▼
 POS marks order PAID
```

The escrow contract holds the funds on-chain.  Neither the POS backend nor the
Turret operator can unilaterally redirect them.  If either party fails to sign
within the dispute window the customer's funds are automatically returned.

---

## Configuration

Add these variables to `.env.local` (copy from `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `VITE_ESCROW_THRESHOLD_XLM` | `500` | Minimum XLM amount that triggers escrow mode |
| `VITE_TURRET_ENDPOINT` | *(none)* | Base URL of your Stellar Turret, e.g. `https://turret.example.com` |
| `VITE_ESCROW_MERCHANT_KEY` | *(none)* | Merchant's Stellar public key (G…) used as one escrow signer |
| `VITE_ESCROW_DISPUTE_WINDOW_HOURS` | `48` | Hours before an unsigned escrow auto-refunds |

> All `VITE_` values are **bundled into the browser build** — do not put secret
> keys here. The backend holds the signing secret; the frontend only holds the
> merchant public key.

### Setting up a Turret

1. Deploy a Turret following the [official guide](https://turrets.stellar.org/setup).
2. Upload the `escrow-release.js` TSS function (see `contracts/turrets/`).
3. Set `TURRET_SIGNING_KEY` on the **backend** to the Turret's signing keypair.
4. Set `VITE_TURRET_ENDPOINT` on the **frontend** to the Turret's public URL.

---

## Escrow flow in the POS UI

### Cashier view

When escrow mode triggers the **Stellar QR** checkout panel gains an extra
**Escrow** badge and the QR encodes the escrow deposit transaction instead of a
direct payment.

The status strip cycles through:

| Status | Meaning |
|---|---|
| **Waiting for customer** | Escrow deposit not yet signed |
| **Customer signed — awaiting merchant** | Deposit on-chain; merchant tap required |
| **Releasing funds** | Turret co-signing |
| **Paid** | Funds released, order closed |

The cashier taps **Confirm & Release** after the customer signs.  This triggers
the backend to present the merchant key signature to the Turret.

### Manager / refund flow

A transaction in escrow that has *not* been released can be refunded from the
**Transactions** page — the manager's **Void** action sends a cancel signature
to the Turret, which returns the funds automatically.  After release, the normal
refund process applies.

---

## Security model

| Threat | Mitigation |
|---|---|
| Backend compromise | Escrow requires both merchant *and* customer signatures; backend alone cannot release |
| Turret compromise | Turret can only co-sign; it cannot initiate or redirect the release |
| Customer double-spend | Funds are locked in the escrow account as soon as the deposit is signed |
| Cashier error (wrong amount) | Customer must sign the specific escrow amount; mismatches are rejected on-chain |
| Network partition during release | Dispute window auto-refunds if release is never co-signed |

---

## Development / testnet

Set `STELLAR_NETWORK=testnet` on the backend.  A testnet-funded escrow account
is created automatically by `npm run db:seed`.  You can test the full flow with
[LOBSTR](https://lobstr.co) in testnet mode.

To exercise the dispute-window auto-refund locally, set
`VITE_ESCROW_DISPUTE_WINDOW_HOURS=0` — the Turret will immediately return funds
if the release is not co-signed.

---

## Related

- [Stellar Turrets documentation](https://turrets.stellar.org)
- [SEP-0007 URI scheme](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md)
- [`contracts/turrets/`](../contracts/turrets/) — TSS function source
- [`.env.example`](../.env.example) — full variable reference
