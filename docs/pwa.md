# Progressive Web App (PWA)

StellarPOS ships as a Progressive Web App. This document covers installation,
offline behaviour, and known platform limitations.

---

## Installing

### Chrome / Edge (desktop and Android)
1. Open `https://<your-domain>` in the browser.
2. Look for the **Install** icon in the address bar (or the browser menu →
   *Install StellarPOS*).
3. Click **Install**. The app opens in its own window without browser chrome.

On Android, Chrome may show an **Add to Home screen** banner automatically
after a few visits.

### Safari (iOS / iPadOS)
1. Open the app in Safari.
2. Tap the **Share** button (box with an arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name and tap **Add**.

> iOS places the icon on the Home Screen. The app opens in standalone mode
> (no Safari address bar) but runs inside a WebKit web view, not a separate
> process — see [iOS limitations](#ios--ipados) below.

### Firefox
Firefox does not support the Web App Manifest install prompt on desktop.
You can still use the app from a pinned tab; offline support works via the
service worker, but there is no installable icon.

---

## Offline behaviour

The service worker (`public/sw.js`) implements three caching strategies:

| Request type | Strategy | Notes |
|---|---|---|
| Navigation (page loads) | Network-first, fallback to cached `index.html` | The app opens without a connection |
| Built assets (`/assets/*`, content-hashed) | Cache-first | Hash never changes, so stale cache is never served |
| Read-only register data (`/api/v1/store`, catalog, categories) | Stale-while-revalidate | Products are visible offline; silently refreshed when online |
| Sales, payments, auth | Network-only | A sale is never faked offline |

The app shell (index, manifest, icons) is pre-cached on the first visit so
the register loads instantly and survives a lost connection.

### What works offline
- Browsing the product catalog
- Viewing store settings
- Accessing the POS UI

### What requires a connection
- Processing a sale or payment
- Syncing new products or categories
- Authentication / account changes

---

## Updating

The service worker version is set in `public/sw.js` (`const VERSION = 'v1'`).
When a new version is deployed:

1. The browser downloads the new service worker in the background.
2. It waits until all tabs running the old version are closed.
3. On the next open, the new worker activates, old caches are deleted, and
   the new shell is pre-cached.

To force an immediate update during development, open DevTools →
*Application → Service Workers* and click **Update** then **skipWaiting**.

---

## Platform limitations

### iOS / iPadOS

| Limitation | Detail |
|---|---|
| **No push notifications** | iOS restricts Web Push to Home Screen PWAs on iOS 16.4+; older versions have no support at all |
| **Storage cap** | Safari evicts origin storage (caches, IndexedDB) after ~7 days of inactivity |
| **Standalone quirks** | The app loses its standalone state if the user navigates to an external URL and taps Back |
| **No `beforeinstallprompt`** | The install prompt cannot be triggered programmatically; the user must use the Share sheet |

### Android (Chrome)

| Limitation | Detail |
|---|---|
| **Background sync** | Background Sync API is supported but requires the device to be online when the sync fires |
| **Storage** | Chrome on Android respects the Storage API quota; persistent storage can be requested via `navigator.storage.persist()` |

### Desktop (Chrome / Edge)

| Limitation | Detail |
|---|---|
| **Window management** | The app opens in a standalone window; OS-level window snapping and taskbar pinning behave like any native app |
| **Dev Tools** | Right-click → Inspect works as normal |

### Firefox (all platforms)

| Limitation | Detail |
|---|---|
| **No install prompt** | Firefox does not implement `beforeinstallprompt`; the app cannot be installed as a standalone icon on desktop |
| **Service worker** | Service workers and caching work normally |

---

## Manifest reference

The app's Web App Manifest is at `public/manifest.webmanifest`:

```json
{
  "name": "StellarPOS",
  "short_name": "StellarPOS",
  "start_url": "/pos",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#F5F0E6",
  "theme_color": "#F5F0E6"
}
```

Icons are served at `/icon-192.png` (192 × 192) and `/icon-512.png`
(512 × 512, maskable).

---

## Troubleshooting

**The install button never appears.**
Confirm the app is served over HTTPS, the manifest is reachable at
`/manifest.webmanifest`, and the service worker is registered. Open
DevTools → *Application → Manifest* for the browser's own diagnostics.

**Offline mode shows a blank page.**
The shell pre-cache may not have completed on the first visit. Open the app
once while online, then try offline. If it still fails, check
*Application → Cache Storage* in DevTools to confirm `stellarpos-shell-v1`
is populated.

**Stale products after a catalog update.**
The catalog is cached stale-while-revalidate. The updated catalog will be
served on the *next* navigation after the background revalidation completes.
To force an immediate refresh, reload the page while online.
