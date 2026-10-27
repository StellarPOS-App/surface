# StellarPOS Surface

The point-of-sale app cashiers and managers use: ring up sales, take cash,
card or **Stellar QR** payments, and run the shop's stock, customers and
end-of-day reports.

[![CI](https://github.com/StellarPOS-App/surface/actions/workflows/ci.yml/badge.svg)](https://github.com/StellarPOS-App/surface/actions/workflows/ci.yml)
![React](https://img.shields.io/badge/react-18-149eca)
![License](https://img.shields.io/badge/license-MIT-green)

![The register with an order in progress](docs/screenshots/register-cart.png)

| Repository | What it is |
|---|---|
| [`surface`](https://github.com/StellarPOS-App/surface) (this repo) | The point-of-sale web app |
| [`backend`](https://github.com/StellarPOS-App/backend) | REST + WebSocket API, Stellar payment watcher |
| [`contracts`](https://github.com/StellarPOS-App/contracts) | Soroban contracts: settlement, loyalty, treasury, escrow |

## What it does

**Register.** Product tags color-coded by category, search that doubles as a
barcode-scanner input (scan a SKU and press Enter), and an order panel laid
out like the receipt it will print. Attach a customer, apply a discount, and
see tax computed exactly as the server computes it.

**Three ways to pay, in any mix.** Each method keeps its color everywhere in
the app:

- **Cash**: quick-tender buttons (exact, next note up) and change shown
  before the drawer opens.
- **Card**: confirm the amount your card terminal approved. Charge less than
  the balance to split the bill.
- **Stellar**: a SEP-0007 QR the customer scans with any Stellar wallet. The
  screen waits for the network and flips to *Paid* by itself the moment the
  payment lands. No hash copying, no "did it go through?".

| Stellar QR checkout | Settled on-chain, receipt ready |
|---|---|
| ![QR checkout](docs/screenshots/stellar-qr.png) | ![Paid receipt](docs/screenshots/paid-receipt.png) |

**Orders.** Every sale with its printable 80mm receipt, the transaction
hash for Stellar payments, voids for open sales (stock goes back on the
shelf), and manager refunds.

**Stock.** A dense table with inline receive and write-off controls,
low-stock flags, archive instead of delete for anything already sold, and
real-time "running low" alerts.

**Reports.** The day's Z report (gross, tender split, refunds, voids) laid
out the way a till prints it, next to revenue by day, a heat strip of busy
hours, and best sellers.

![Reports](docs/screenshots/reports.png)

**And:** customer history and lifetime spend, staff and role management,
live merchant wallet balances, keyboard shortcuts (keys `1` to `6` switch
modes, `/` searches), a "night shift" dark theme, and a layout that works on
a tablet or phone.

| Night shift | Phone |
|---|---|
| ![Night shift](docs/screenshots/register-night.png) | ![Phone](docs/screenshots/mobile-register.png) |

## Getting started

You need the [backend](https://github.com/StellarPOS-App/backend) running
(it takes about a minute: `npm install && npm run db:seed && npm run dev`).

```bash
git clone https://github.com/StellarPOS-App/surface.git
cd surface
npm install
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` and `/socket.io` to `http://localhost:3000`, so
there is nothing to configure. Sign in as `admin@stellarpos.dev` with
password `stellarpos-demo` (created by the backend seed).

To try Stellar checkout, set `STELLAR_MERCHANT_PUBLIC_KEY` on the backend to
a funded testnet account, then pay the QR from any testnet wallet.

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | API base path, or an absolute URL if the API is on another origin |
| `VITE_SOCKET_URL` | same origin | Socket.IO origin |
| `VITE_DEV_API_TARGET` | `http://localhost:3000` | Where `npm run dev` proxies |

### Docker

```bash
docker build -t stellarpos-surface .
docker run -p 8080:80 -e API_UPSTREAM=http://host.docker.internal:3000 stellarpos-surface
```

nginx serves the build with SPA routing and long-lived caching for hashed
assets, and proxies `/api` and `/socket.io` (with WebSocket upgrade) to
`API_UPSTREAM`.

### Netlify

The repository includes a [`netlify.toml`](netlify.toml), so connecting
**this repository** (`StellarPOS-App/surface`, branch `main`) needs no build
settings in the dashboard. Netlify builds with Node 22, publishes `dist/`, and
serves the app for every route.

The API cannot run on Netlify (it is a long-running server with
WebSockets). Host the [backend](https://github.com/StellarPOS-App/backend)
elsewhere, then in Netlify go to *Site configuration > Environment
variables* and set:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-api-host>/api/v1` |
| `VITE_SOCKET_URL` | `https://<your-api-host>` |

Finally, set `CLIENT_URL` on the backend to your Netlify URL so its CORS
settings allow the app.

If a build fails with TypeScript printing its full option list, Netlify is
building an outdated fork that predates the TypeScript config. Point the
site at this repository, or sync the fork.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with API proxy |
| `npm run build` | Type-check and build to `dist/` |
| `npm test` | Vitest + Testing Library (35 tests) |
| `npm run check` | Lint, type-check, test: what CI runs |

## How it is built

- **React 18 + TypeScript + Vite**, styled with **Tailwind** on a small token
  system (`src/styles/globals.css`): paper and ink surfaces with one hue per
  payment method. Type is Bricolage Grotesque, Instrument Sans and IBM Plex
  Mono, with tabular figures for every amount.
- **TanStack Query** for server state, with one hooks module
  (`src/hooks/queries.ts`) covering every endpoint. Mutations invalidate
  exactly what a sale touches: orders, stock, reports, customers.
- **Zustand** for the session (persisted), the cart, and the theme.
- **Socket.IO** (`src/hooks/useRealtime.ts`) turns server events into cache
  updates and toasts, so every terminal in the shop stays in sync.
- **react-hook-form + zod** for forms; validation messages are written for
  cashiers, not developers.
- **Money is never a float.** Prices are integer cents end to end, and the
  cart uses the same rounding as the server.

```
src/
  components/
    layout/      register shell (mode bar + status strip), auth layout
    pos/         product tags, receipt cart, checkout, Stellar QR, receipt
    ui/          buttons, fields, modal/drawer, badges, money
  hooks/         queries, realtime, auth, hotkeys, countdown
  lib/           API client, POS helpers
  pages/         register, orders, stock, customers, reports, settings, auth
  stores/        session, cart, theme
  utils/         formatting and parsing
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately,
as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)

## Redux Store Code Splitting\n\nThe Redux store must be split per feature using dynamic reducers that load only when the corresponding route is visited. A monolithic store loads all feature state on initial page load regardless of the current route.