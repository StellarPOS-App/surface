import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { setCategoryOrder } from '@/lib/pos';
import type {
  CatalogProduct,
  Customer,
  CustomerInput,
  DayPoint,
  HourPoint,
  Paginated,
  Payment,
  PaymentRequest,
  Product,
  ProductInput,
  Role,
  StoreSettings,
  Summary,
  TopProduct,
  Transaction,
  TransactionStatus,
  User,
  WalletInfo,
} from '@/types';

export const keys = {
  store: ['store'] as const,
  wallet: ['store', 'wallet'] as const,
  products: (q?: object) => ['products', q ?? {}] as const,
  categories: ['products', 'categories'] as const,
  customers: (q?: object) => ['customers', q ?? {}] as const,
  customer: (id: string) => ['customers', 'detail', id] as const,
  transactions: (q?: object) => ['transactions', q ?? {}] as const,
  transaction: (id: string) => ['transactions', 'detail', id] as const,
  request: (id: string) => ['payment-requests', id] as const,
  analytics: ['analytics'] as const,
  staff: ['users'] as const,
};

// ---------------------------------------------------------------- store

export const useStoreSettings = () =>
  useQuery({
    queryKey: keys.store,
    queryFn: () => api.get<StoreSettings>('/store'),
    staleTime: 5 * 60_000,
  });

export const useWallet = (enabled = true) =>
  useQuery({ queryKey: keys.wallet, queryFn: () => api.get<WalletInfo>('/store/wallet'), enabled });

// ---------------------------------------------------------------- products

export interface ProductQuery {
  search?: string;
  category?: string;
  lowStock?: boolean;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export const useProducts = (q: ProductQuery = {}) =>
  useQuery({
    queryKey: keys.products(q),
    queryFn: () => api.getPage<Paginated<Product>>('/products', { limit: 200, ...q }),
    placeholderData: keepPreviousData,
  });

/** Every active product in one compact, ETag-cached request (for the register). */
export const useCatalog = () =>
  useQuery({
    queryKey: ['products', 'catalog'],
    queryFn: () => api.get<CatalogProduct[]>('/products/catalog'),
  });

export const useCategories = () =>
  useQuery({
    queryKey: keys.categories,
    queryFn: async () => {
      const categories = await api.get<string[]>('/products/categories');
      setCategoryOrder(categories);
      return categories;
    },
  });

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<ProductInput> & { id?: string }) =>
      id ? api.put<Product>(`/products/${id}`, input) : api.post<Product>('/products', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      api.post<Product>(`/products/${id}/stock`, { delta }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ outcome: 'deleted' | 'archived' }>(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// ---------------------------------------------------------------- customers

export const useCustomers = (search = '', page = 1) =>
  useQuery({
    queryKey: keys.customers({ search, page }),
    queryFn: () => api.getPage<Paginated<Customer>>('/customers', { search, page, limit: 50 }),
    placeholderData: keepPreviousData,
  });

export const useCustomer = (id: string | null) =>
  useQuery({
    queryKey: keys.customer(id ?? ''),
    queryFn: () => api.get<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  });

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CustomerInput & { id?: string }) =>
      id ? api.put<Customer>(`/customers/${id}`, input) : api.post<Customer>('/customers', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

// ---------------------------------------------------------------- sales

export interface TransactionQuery {
  status?: TransactionStatus;
  search?: string;
  from?: string;
  to?: string;
  customerId?: string;
  page?: number;
}

export const useTransactions = (q: TransactionQuery = {}) =>
  useQuery({
    queryKey: keys.transactions(q),
    queryFn: () => api.getPage<Paginated<Transaction>>('/transactions', { limit: 30, ...q }),
    placeholderData: keepPreviousData,
  });

export const useTransaction = (id: string | null) =>
  useQuery({
    queryKey: keys.transaction(id ?? ''),
    queryFn: () => api.get<Transaction>(`/transactions/${id}`),
    enabled: Boolean(id),
  });

/** Invalidates everything a sale can affect: sales, stock, reports, customer stats. */
function useInvalidateSales() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      ['transactions', 'products', 'analytics', 'customers'].map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
}

export function useCreateSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: (body: {
      items: { productId: string; quantity: number }[];
      customerId?: string | null;
      discountCents?: number;
      note?: string;
    }) => api.post<Transaction>('/transactions', body),
    onSuccess: invalidate,
  });
}

export function useVoidSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: (id: string) => api.post<Transaction>(`/transactions/${id}/void`),
    onSuccess: invalidate,
  });
}

export function useRefundSale() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; restock: boolean; reason?: string }) =>
      api.post<Transaction>(`/transactions/${id}/refund`, body),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------- payments

export function useRecordPayment() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: (body: {
      transactionId: string;
      method: 'cash' | 'card' | 'stellar';
      amountCents?: number;
      tenderedCents?: number;
      stellarTxHash?: string;
    }) => api.post<{ payment: Payment; transaction: Transaction }>('/payments', body),
    onSuccess: invalidate,
  });
}

export const useCreatePaymentRequest = () =>
  useMutation({
    mutationFn: (transactionId: string) =>
      api.post<PaymentRequest>('/payments/requests', { transactionId }),
  });

/** Polls as a fallback in case the socket is down; the socket usually wins. */
export const usePaymentRequest = (id: string | null) =>
  useQuery({
    queryKey: keys.request(id ?? ''),
    queryFn: () => api.get<PaymentRequest>(`/payments/requests/${id}`),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4_000 : false),
  });

export function useVerifyPaymentRequest() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: ({ id, txHash }: { id: string; txHash: string }) =>
      api.post<{ request: PaymentRequest; transaction: Transaction }>(
        `/payments/requests/${id}/verify`,
        { txHash },
      ),
    onSuccess: invalidate,
  });
}

export const useCancelPaymentRequest = () =>
  useMutation({
    mutationFn: (id: string) => api.post<PaymentRequest>(`/payments/requests/${id}/cancel`),
  });

// ---------------------------------------------------------------- analytics

export const useSummary = (days = 1) =>
  useQuery({
    queryKey: [...keys.analytics, 'summary', days],
    queryFn: () => api.get<Summary>('/analytics/summary', { days }),
  });

export const useRevenueByDay = (days = 14) =>
  useQuery({
    queryKey: [...keys.analytics, 'revenue', days],
    queryFn: () => api.get<DayPoint[]>('/analytics/revenue-by-day', { days }),
  });

export const useHourly = (days = 30) =>
  useQuery({
    queryKey: [...keys.analytics, 'hourly', days],
    queryFn: () => api.get<HourPoint[]>('/analytics/hourly', { days }),
  });

export const useTopProducts = (limit = 6, days = 30) =>
  useQuery({
    queryKey: [...keys.analytics, 'top', limit, days],
    queryFn: () => api.get<TopProduct[]>('/analytics/top-products', { limit, days }),
  });

// ---------------------------------------------------------------- staff & profile

export const useStaff = (enabled = true) =>
  useQuery({ queryKey: keys.staff, queryFn: () => api.get<User[]>('/users'), enabled });

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string; role: Role }) =>
      api.post<User>('/users', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.staff }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch<User>(`/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.staff }),
  });
}

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: (body: { name?: string; currentPassword?: string; newPassword?: string }) =>
      api.patch<User>('/auth/me', body),
  });
