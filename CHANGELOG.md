# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0]

The first version that builds and runs.

### Added
- Register with category-colored product tags, scanner-friendly search,
  receipt-style cart, customer attach, and discounts.
- Checkout with cash (quick tender and change), card, split tender, and Stellar
  SEP-0007 QR payments that settle live over Socket.IO.
- Orders with printable receipts, voids, and manager refunds.
- Stock management with inline adjustments and low-stock alerts.
- Customers with visit and spend history.
- Reports: Z report, revenue by day, busy-hours strip, best sellers.
- Settings: profile and password, night-shift theme (follows the OS until chosen, then persisted), Stellar
  wallet balances, staff and roles.
- Build tooling (tsconfig, PostCSS, Tailwind plugins), 35 tests, CI, Docker
  image with nginx, and Dependabot.

### Removed
- Unused dependencies, the commit-generation and issue-creation scripts, and
  the fabricated contributor list.
