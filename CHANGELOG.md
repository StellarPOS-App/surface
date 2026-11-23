# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## 1.0.0 (2026-11-23)


### Features

* add end-of-day settlement report ([#143](https://github.com/StellarPOS-App/surface/issues/143)) ([7ef59bd](https://github.com/StellarPOS-App/surface/commit/7ef59bd61f9c2814e1e8a89a022c1dfec3c42bd0))
* add Stellar Turrets escrow module and design doc (FEAT-022) ([b28e63f](https://github.com/StellarPOS-App/surface/commit/b28e63f52dd5837d1c1eaf81a70ee9d5f0e4887c))
* add WebhookSettings panel to Settings page (FEAT-018) ([cda475a](https://github.com/StellarPOS-App/surface/commit/cda475aeb9a99dd32b6370943523a72c6d5d97df))
* **app:** API client, stores, register shell and UI kit ([dda9f06](https://github.com/StellarPOS-App/surface/commit/dda9f064fc369d46468d342d93797d05a0df4dfb))
* **auth:** sign idle tills out with a five-minute warning ([69c167a](https://github.com/StellarPOS-App/surface/commit/69c167a1f21ec436ab41d8e4cbc86d917db010f1))
* **auth:** two-factor sign-in screens ([414535e](https://github.com/StellarPOS-App/surface/commit/414535e089de3cf063d6a4c114f7742bee614e04))
* barcode scanner for product lookup at the register ([#134](https://github.com/StellarPOS-App/surface/issues/134)) ([f67135c](https://github.com/StellarPOS-App/surface/commit/f67135c95b7c68267797a83d47d2808a385ccc8c))
* **barcode-scanner:** add useBarcodeScanner hook + BarcodeScanner modal ([068a6cf](https://github.com/StellarPOS-App/surface/commit/068a6cffa55270b862bfe8fe1e8816b52e76113b))
* **brand:** add the Scan Star logo assets and favicon ([f942305](https://github.com/StellarPOS-App/surface/commit/f9423057e8ad676f1b4432b5dc69efd0ca62f03d))
* **brand:** draw the Scan Star mark in the app header and login ([94664c2](https://github.com/StellarPOS-App/surface/commit/94664c26b5dd82f62a317f57f1d5859bb7855e39))
* **checkout:** add path-payment asset selector to StellarCheckout ([0c49a52](https://github.com/StellarPOS-App/surface/commit/0c49a52b93870bf679f77094cd5de76d09204197))
* **i18n:** translate the shell, register, checkout and sign-in ([67a4b66](https://github.com/StellarPOS-App/surface/commit/67a4b66aed9207aa3328a5a624d14c34165c3642))
* **i18n:** typed translation layer with English, French and Spanish ([66bf79f](https://github.com/StellarPOS-App/surface/commit/66bf79ffd33ec838bb17c69f4f14f2f19f20d16f))
* **invoice:** add B2B invoice generation for Stellar transactions ([#149](https://github.com/StellarPOS-App/surface/issues/149)) ([522c65e](https://github.com/StellarPOS-App/surface/commit/522c65e22f14a08c97e9cc16a0f43786ab6a5374))
* **invoice:** add Invoice button and modal to transaction detail ([11c5f20](https://github.com/StellarPOS-App/surface/commit/11c5f20d7cd5406b7455f9ab228d3aec8e949afe))
* **invoice:** add InvoiceView component with A4 print layout ([1ca5427](https://github.com/StellarPOS-App/surface/commit/1ca542720c81fb4e99e4c8b83996b9f941f03760)), closes [#149](https://github.com/StellarPOS-App/surface/issues/149)
* **mobile:** sticky order bar and bottom sheet on phones ([100693f](https://github.com/StellarPOS-App/surface/commit/100693f9bcc588715c6922dc89b930244e76f5b9))
* **offline:** installable app with a caching service worker ([2779a48](https://github.com/StellarPOS-App/surface/commit/2779a48738533c54305545d4c9a339f40c62a9ba))
* **offline:** offline banner, safe tender buttons, persistent cart ([bd05dfd](https://github.com/StellarPOS-App/surface/commit/bd05dfd706fb6f571b91ffb7b285d4714a137e49))
* **orders:** export sales to CSV, paging through any volume ([df63176](https://github.com/StellarPOS-App/surface/commit/df63176a0ec3a8e6f87f06c21ede0e170e1f700c))
* **pages:** orders, stock, customers, reports, settings and auth ([411d252](https://github.com/StellarPOS-App/surface/commit/411d25238c1d9965afa6478a5ec519e0cc1faddd))
* **path-payments:** add Horizon strict-receive path finding ([14e242d](https://github.com/StellarPOS-App/surface/commit/14e242dbfd40f980a71fbfd349167af24853afcd))
* **pos-terminal:** wire barcode-scanner button into the register toolbar ([22fdbad](https://github.com/StellarPOS-App/surface/commit/22fdbadc33dd7fe411d9a8f72a91b4ec960e5257))
* **pos:** instant, forgiving product search on the register ([b8b2b5c](https://github.com/StellarPOS-App/surface/commit/b8b2b5c55b192ab774c9bd7c4f6e01673fb18aaa))
* **pos:** register and checkout with live Stellar QR payments ([caa0cba](https://github.com/StellarPOS-App/surface/commit/caa0cba219f8399bfb2d5c3ce55e94474fdee6ff))
* **receipts:** customizable receipt header, footer and fields ([6d5962f](https://github.com/StellarPOS-App/surface/commit/6d5962f52861101a08b4613416204071ef0b8fad))
* **settings:** add End-of-day Settlement Report section to Settings UI ([#143](https://github.com/StellarPOS-App/surface/issues/143)) ([ede7cd8](https://github.com/StellarPOS-App/surface/commit/ede7cd8942b4bd876034254451aacef15abbc1d4))
* **settlement:** add report builder, API integration and midnight scheduler ([#143](https://github.com/StellarPOS-App/surface/issues/143)) ([26d5007](https://github.com/StellarPOS-App/surface/commit/26d50076b5a1c8d94bca2f8b12fead992d76e1d5))
* Stellar path payment support at checkout ([#147](https://github.com/StellarPOS-App/surface/issues/147)) ([9a1c05f](https://github.com/StellarPOS-App/surface/commit/9a1c05f6714929c0b3348c57f2a8fa520d41b660))
* Stellar Turrets trustless escrow for high-value transactions (FEAT-022, [#154](https://github.com/StellarPOS-App/surface/issues/154)) ([6bf0409](https://github.com/StellarPOS-App/surface/commit/6bf0409949a4951f781d66847ccd640786f47c87))
* **storybook:** add Storybook with stories for Button, Badge, and Modal ([f6aa8d8](https://github.com/StellarPOS-App/surface/commit/f6aa8d84c802c51f2a02e4ffd21337a029259154))
* **storybook:** add visual regression testing with Storybook + Chromatic ([#104](https://github.com/StellarPOS-App/surface/issues/104)) ([0c08bff](https://github.com/StellarPOS-App/surface/commit/0c08bff894a7080da973494ac9daea70c0889a2f))
* **theme:** follow the OS color scheme until the user chooses ([3bf7439](https://github.com/StellarPOS-App/surface/commit/3bf74394234e83d432d3ab2534889432041f6f01))
* **voice:** hands-free register with a mic button ([c6d1fda](https://github.com/StellarPOS-App/surface/commit/c6d1fda30f206180c7f7460b512ca31cea65b808))
* **voice:** parse spoken register commands ([30d3eac](https://github.com/StellarPOS-App/surface/commit/30d3eacbf9c12a2605f291d5d13bc50e64f1402c))
* webhook config types, validator, and query hooks (FEAT-018) ([1b519f8](https://github.com/StellarPOS-App/surface/commit/1b519f835f7b278da3b22aaabc3a63efa65af35e))
* webhook notifications for transaction events (FEAT-018, [#150](https://github.com/StellarPOS-App/surface/issues/150)) ([e964609](https://github.com/StellarPOS-App/surface/commit/e9646090cbd54688b718f47971e7806e3bf603cf))


### Bug Fixes

* add aria-label and text labels to StatusBadge ([#178](https://github.com/StellarPOS-App/surface/issues/178)) ([26d5d51](https://github.com/StellarPOS-App/surface/commit/26d5d5155db487df211a4dc8fa0d97d51c562bb2))
* add aria-label and text labels to StatusBadge for transaction status ([#178](https://github.com/StellarPOS-App/surface/issues/178)) ([0d30c08](https://github.com/StellarPOS-App/surface/commit/0d30c08026cea5530f92c53383cbd519e43e42a6))
* add font-display swap to prevent font load layout shift ([#198](https://github.com/StellarPOS-App/surface/issues/198)) ([6f5257a](https://github.com/StellarPOS-App/surface/commit/6f5257a52ef2217456d4812f79e20c7e17ae51e5))
* add font-display swap to prevent layout shift on font load ([#198](https://github.com/StellarPOS-App/surface/issues/198)) ([8d074e4](https://github.com/StellarPOS-App/surface/commit/8d074e45c1511353b460639b3f6fad4bb354214c))
* add visual success banner on payment confirmation ([#186](https://github.com/StellarPOS-App/surface/issues/186)) ([56f2d60](https://github.com/StellarPOS-App/surface/commit/56f2d60d9c0e67864fa707917adff51dd3e27872))
* add visual success banner on payment confirmation ([#186](https://github.com/StellarPOS-App/surface/issues/186)) ([5562ad2](https://github.com/StellarPOS-App/surface/commit/5562ad2661a04d189cc8aef5f0113e6a8ac2cf3f))
* **ci:** cache node_modules and Docker layers to eliminate redundant installs ([#121](https://github.com/StellarPOS-App/surface/issues/121)) ([90c014b](https://github.com/StellarPOS-App/surface/commit/90c014bcb16a393525d87da235acd5a1bc0dca3a))
* **ci:** cache node_modules keyed on package-lock.json hash ([90e9efa](https://github.com/StellarPOS-App/surface/commit/90e9efa444739f5fbd1fa691380e4a5d02864221))
* harden redirects, sensitive caching, dependencies and CDN scripts ([26b19ec](https://github.com/StellarPOS-App/surface/commit/26b19ec646a36a91ab46b15cf0722cc53d799842))
* harden redirects, sensitive caching, dependencies and CDN scripts ([733bf44](https://github.com/StellarPOS-App/surface/commit/733bf447253df33e183f81cbb51fbe6fd40c5f31))
* make toast close button keyboard accessible ([#190](https://github.com/StellarPOS-App/surface/issues/190)) ([a5728e2](https://github.com/StellarPOS-App/surface/commit/a5728e252db13ea95b9d1f87e0cbcd7f92e6767e))
* make toast close button keyboard accessible ([#190](https://github.com/StellarPOS-App/surface/issues/190)) ([a965051](https://github.com/StellarPOS-App/surface/commit/a96505193614a82b31dddfab458e9bbb430c4fe5))
* **orders:** stop leaking work after leaving the Orders screen ([81bff35](https://github.com/StellarPOS-App/surface/commit/81bff352c98900a6c2cfacb5e58123bff9fbc71c))
* restore visible focus indicators for keyboard navigation ([#182](https://github.com/StellarPOS-App/surface/issues/182)) ([9558fb4](https://github.com/StellarPOS-App/surface/commit/9558fb49470f94aa9fa68c3e3010c668be0eb5d1))
* restore visible focus indicators for keyboard navigation ([#182](https://github.com/StellarPOS-App/surface/issues/182)) ([653d007](https://github.com/StellarPOS-App/surface/commit/653d007355f2bbe18f37a69a92c5e7ca106871c0))
* **safari:** viewport height, input zoom and clipboard on iOS ([a6b002b](https://github.com/StellarPOS-App/surface/commit/a6b002ba13b69706bd36c8f0339c3b6b61765acb))


### Performance Improvements

* add CSS-native virtual scrolling to inventory list ([61d3b13](https://github.com/StellarPOS-App/surface/commit/61d3b13b71733342c6f1e4dd86714843c50b0343)), closes [#213](https://github.com/StellarPOS-App/surface/issues/213)
* **app:** lazy-load back-office screens and prefetch on hover ([6c779a6](https://github.com/StellarPOS-App/surface/commit/6c779a6a6f1144eeb1b5e11016d2fbb6a8cd67e8))
* **build:** let Recharts split with Reports ([a95eff9](https://github.com/StellarPOS-App/surface/commit/a95eff9d7ee68e4c1f1ff11fac7932629ac36b91))
* CSS-native virtual scrolling for inventory list ([#213](https://github.com/StellarPOS-App/surface/issues/213)) ([4da0e57](https://github.com/StellarPOS-App/surface/commit/4da0e57c6221b7324e2b6c4c7d65601ca516b5e1))
* extract stable inline styles to CSS classes in Inventory ([#206](https://github.com/StellarPOS-App/surface/issues/206)) ([e2596a8](https://github.com/StellarPOS-App/surface/commit/e2596a860897932bc7924abe3f2c8622ae0f1f6a))
* extract stable inline styles to CSS classes in Inventory ([#206](https://github.com/StellarPOS-App/surface/issues/206)) ([8349c0a](https://github.com/StellarPOS-App/surface/commit/8349c0ae7c6859f1d2dfd74472d7826372f1159d))
* fetch only current time-range data in dashboard hourly chart ([#205](https://github.com/StellarPOS-App/surface/issues/205)) ([2246f05](https://github.com/StellarPOS-App/surface/commit/2246f053fe612c7c4c45ab2d5e7e6fbf2406d841))
* fetch only current time-range data in dashboard hourly chart ([#205](https://github.com/StellarPOS-App/surface/issues/205)) ([84efda5](https://github.com/StellarPOS-App/surface/commit/84efda577049e534c28f96a6405a6f4602f8b975))
* lazy-load product catalog images to reduce initial load ([#194](https://github.com/StellarPOS-App/surface/issues/194)) ([19c22d9](https://github.com/StellarPOS-App/surface/commit/19c22d9e92ef327b40a67cd8f24c588623d77c21))
* lazy-load product catalog images to reduce initial load ([#194](https://github.com/StellarPOS-App/surface/issues/194)) ([c6b14d3](https://github.com/StellarPOS-App/surface/commit/c6b14d3e7e00a1c73c1a2eae414bf4b0a5913bec))

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
