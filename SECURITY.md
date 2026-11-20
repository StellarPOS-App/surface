# Security Policy

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/StellarPOS-App/surface/security/advisories/new).
Do **not** open a public issue for security problems.

Include what you found, the impact, and steps to reproduce. We aim to
acknowledge reports within 3 business days.

## Scope

- Cross-site scripting through product, customer or note fields
- Leaking the session token (it lives in `localStorage` under
  `stellarpos.session`)
- UI states that would let a cashier believe a Stellar payment succeeded when
  it did not

Payment verification itself happens on the server. Issues there belong in the
[backend repository](https://github.com/StellarPOS-App/backend/security/advisories/new).

## Design commitments

- The app never asks for, handles, or stores a Stellar secret key. Customers
  pay from their own wallets; the merchant's account is configured on the
  server by public key only.
- A sale shows as paid only when the server says so, through a socket event or
  a fresh read. The UI never marks payments paid on its own.
- All user-entered text is rendered as text. There is no `dangerouslySetInnerHTML`.

## Supported versions

Only the latest `main` receives security fixes.
