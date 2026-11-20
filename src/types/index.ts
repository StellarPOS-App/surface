export type Role = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  twoFactorEnabled?: boolean;
}

/** /auth/login answer when the account has two-factor sign-in on. */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  challenge: string;
}

export interface Session {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  name: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface StoreSettings {
  name: string;
  currency: string;
  taxRateBps: number;
  stellar: {
    network: 'testnet' | 'mainnet';
    enabled: boolean;
    merchantPublicKey: string | null;
    asset: { code: string; issuer: string | null };
    assetRate: string;
    paymentTtlMinutes: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  priceCents: number;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  lowStock: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** The compact shape from GET /products/catalog, all the register needs. */
export type CatalogProduct = Pick<
  Product,
  'id' | 'name' | 'sku' | 'category' | 'priceCents' | 'stock' | 'lowStock' | 'imageUrl'
>;

export type ProductInput = Pick<Product, 'name' | 'sku' | 'category' | 'priceCents' | 'stock'> &
  Partial<Pick<Product, 'description' | 'lowStockThreshold' | 'active'>>;

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stellarAddress: string | null;
  notes: string;
  createdAt: string;
  stats?: { visits: number; lifetimeCents: number; lastVisit: string | null };
}

export type CustomerInput = Pick<Customer, 'name'> &
  Partial<Pick<Customer, 'email' | 'phone' | 'stellarAddress' | 'notes'>>;

export type TransactionStatus = 'pending' | 'completed' | 'void' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'stellar';

export interface TransactionItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Payment {
  id: string;
  transactionId: string;
  method: PaymentMethod;
  amountCents: number;
  tenderedCents: number | null;
  changeCents: number | null;
  status: 'pending' | 'completed' | 'failed';
  stellarTxHash: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  userId: string;
  cashierName: string | null;
  customerId: string | null;
  customerName: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  status: TransactionStatus;
  note: string;
  createdAt: string;
  completedAt: string | null;
  items?: TransactionItem[];
  payments?: Payment[];
}

export interface PaymentRequest {
  id: string;
  transactionId: string;
  destination: string;
  assetCode: string;
  assetIssuer: string | null;
  amount: string;
  memo: string;
  uri: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  txHash: string | null;
  payer: string | null;
  expiresAt: string;
  paidAt: string | null;
}

export interface Summary {
  days: number;
  totalSales: number;
  totalRevenueCents: number;
  taxCents: number;
  discountCents: number;
  averageTicketCents: number;
  unitsSold: number;
  byMethod: { method: PaymentMethod; count: number; amountCents: number }[];
  refunds: number;
  voids: number;
  lowStockProducts: number;
  customers: number;
}

export interface DayPoint {
  day: string;
  sales: number;
  revenueCents: number;
}

export interface HourPoint {
  hour: number;
  sales: number;
  revenueCents: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  units: number;
  revenueCents: number;
}

export interface WalletInfo {
  configured: boolean;
  publicKey?: string;
  balances: { assetCode: string; assetIssuer: string | null; balance: string }[];
}
