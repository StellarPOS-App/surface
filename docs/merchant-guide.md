# Merchant Dashboard User Guide

This guide covers every section of the StellarPOS merchant dashboard:
analytics, transaction management, inventory setup, and settings.

---

## Contents

1. [Getting to the dashboard](#1-getting-to-the-dashboard)
2. [Dashboard — analytics overview](#2-dashboard--analytics-overview)
3. [Transactions — history and management](#3-transactions--history-and-management)
4. [Inventory — products and stock](#4-inventory--products-and-stock)
5. [Settings](#5-settings)
6. [Roles and permissions](#6-roles-and-permissions)

---

## 1. Getting to the dashboard

After logging in you land on the **POS register**. Switch to any back-office
section using the sidebar navigation on the left:

| Icon | Section |
|---|---|
| Grid | Dashboard |
| Receipt | Transactions |
| Box | Inventory |
| Gear | Settings |

The dashboard and all back-office sections require a **manager** role or
higher. Cashiers are taken directly to the register and cannot access them.

---

## 2. Dashboard — analytics overview

The dashboard shows sales performance for today, the last 7 days, or a custom
window. Use the **1 day / 7 days / 30 days** selector at the top right to
switch periods.

### Revenue chart

A bar chart of revenue by day for the selected window. Each bar represents
gross sales (before refunds). Hover a bar to see the exact amount and date.

### Hourly heat strip

A 24-column strip below the revenue chart shows how sales are distributed
across the day, converted to your local timezone. Darker squares = more sales.
Use it to identify peak hours for staffing decisions.

### Top products

The six best-selling products by unit count over the selected period (minimum
7 days, so the list is stable on 1-day view). Each row shows product name,
units sold, and revenue contribution.

### Z-Report / daily summary

The Z-Report at the bottom of the dashboard summarises the current trading
day: total revenue, number of transactions, and a breakdown by payment method
(Stellar QR, card, cash, etc.). Print or export it as a PDF using the
**Print Z-Report** button.

> **Tip:** The Z-Report resets at midnight UTC. If your store spans two UTC
> days, run it before midnight to capture the full session.

---

## 3. Transactions — history and management

The Transactions page lists every completed sale. It is the primary tool for
handling refunds, voids, and financial exports.

### Filtering and searching

| Control | What it does |
|---|---|
| **Search box** | Full-text search across receipt number, customer name, and product names within the sale |
| **Date range** | Filter to a specific date range (defaults to today) |
| **Payment method** | Filter by Stellar QR, card, cash, or other |
| **Status** | All / Completed / Refunded / Voided |

Filters combine — for example, "card payments last week that were refunded."

### Viewing a transaction

Click any row to open the transaction detail panel on the right. It shows:

- Receipt number and timestamp
- Line items with quantity and price
- Payment method and reference (Stellar transaction ID for QR payments)
- Current status (completed, refunded, voided)
- Any refund or void events, with the reason and the manager who actioned it

### Issuing a refund

1. Open the transaction detail panel.
2. Click **Refund**.
3. Enter a reason (required for the audit trail).
4. Tick **Restock items** if the goods are being returned to inventory.
5. Click **Confirm refund**.

Refunds are partial or full depending on what was sold. A refunded
transaction stays in the list with status **Refunded**.

> **Note:** Refunds require the **manager** role.

### Voiding a transaction

A void cancels a sale entirely (typically used for same-session mistakes
before the customer leaves). The process is the same as a refund but uses the
**Void** button. Voided transactions are marked **Voided** and are excluded
from revenue totals.

> **Note:** Voids require the **manager** role.

### Exporting to CSV

Click **Export CSV** to download all transactions matching the current
filters. For large date ranges the export pages through the data in the
background — a progress indicator shows how many rows have been fetched.
Navigating away from the Transactions page cancels the export.

The CSV contains: receipt number, timestamp, line items (one row per item),
quantity, unit price, total, payment method, status, and Stellar transaction
ID where applicable.

---

## 4. Inventory — products and stock

The Inventory page is where you create and edit products, adjust stock levels,
and manage categories.

### Browsing the catalog

| Control | What it does |
|---|---|
| **Search box** | Filter by product name or SKU |
| **Category** | Show only products in one category |
| **Low stock** | Show only products at or below their reorder threshold |
| **Show archived** | Include discontinued products (hidden from the register by default) |

### Creating a product

1. Click **New product** (top right, manager only).
2. Fill in the form:
   - **Name** — displayed on the register and receipts
   - **Price** — in your store's default currency
   - **Category** — select an existing one or type to create a new one
   - **SKU** — optional; used for export and barcode scanning
   - **Stock quantity** — starting inventory count
   - **Reorder threshold** — when stock falls to this number the product
     appears in the Low stock filter
   - **Image** — optional product photo shown on the register tile
3. Click **Save**.

The product appears on the register immediately.

### Editing a product

Click the **pencil icon** on any product row to open the edit form. All
fields are editable. Saving takes effect on the register in real time.

### Adjusting stock

Click the **+** or **−** buttons on any inventory row to increment or
decrement stock by 1. For larger adjustments, open the edit form and update
the **Stock quantity** field directly.

> **Tip:** When you issue a refund with **Restock items** ticked, the
> inventory is automatically incremented — no manual adjustment needed.

### Archiving a product

Open the edit form and tick **Archive**. Archived products are hidden from the
register but their historical sales data is preserved. Unarchive at any time
using the **Show archived** filter.

### Categories

Categories group products on the register for faster lookup. Create a new
category by typing its name in the Category field when creating or editing a
product. To rename a category, edit any product in it — the category name
updates everywhere.

---

## 5. Settings

The Settings page (manager only) controls store-wide configuration.

| Setting | Description |
|---|---|
| **Store name** | Appears on receipts and the browser tab |
| **Currency** | ISO 4217 code (e.g. `USD`, `EUR`, `GBP`) — affects how amounts are displayed |
| **Tax rate** | Applied to every sale; shown as a line on receipts |
| **Receipt footer** | Free-text message printed at the bottom of every receipt |
| **Stellar address** | The store's Stellar account for QR checkout payments |
| **Timezone** | Used for Z-Reports and the hourly heat strip |

Changes take effect immediately for all logged-in sessions.

---

## 6. Roles and permissions

StellarPOS has two roles:

| Role | Register | Transactions | Inventory | Settings | Refund / Void |
|---|---|---|---|---|---|
| **Cashier** | ✓ | — | — | — | — |
| **Manager** | ✓ | ✓ | ✓ | ✓ | ✓ |

Managers are assigned in the user management section of Settings. A store must
have at least one manager at all times.

---

## Need help?

- Check the [PWA setup guide](pwa.md) if you are having trouble with offline
  mode or installing the app to your device.
- Report bugs via the issue tracker linked in the store's admin footer.
