import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { StatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Money from '@/components/ui/Money';
import PageHeader from '@/components/ui/PageHeader';
import {
  useCustomer,
  useCustomers,
  useDeleteCustomer,
  useSaveCustomer,
  useTransactions,
} from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@/types';
import { cn, formatDateTime, initials, relativeTime, truncateMiddle } from '@/utils/helpers';

const optional = (schema: z.ZodString) => schema.optional().or(z.literal(''));
const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(120),
  email: optional(z.string().trim().email('Invalid email')),
  phone: optional(
    z
      .string()
      .trim()
      .regex(/^[+0-9 ()-]{5,25}$/, 'Digits, spaces, + ( ) - only'),
  ),
  stellarAddress: optional(
    z
      .string()
      .trim()
      .regex(/^G[A-Z2-7]{55}$/, 'A Stellar public key starts with G and has 56 characters'),
  ),
  notes: z.string().max(1000).optional(),
});
type Form = z.infer<typeof schema>;

function CustomerForm({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const save = useSaveCustomer();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer?.name ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      stellarAddress: customer?.stellarAddress ?? '',
      notes: customer?.notes ?? '',
    },
  });
  const onSubmit = handleSubmit(async ({ email, phone, stellarAddress, ...rest }) => {
    try {
      // Empty optional fields clear the value on the server.
      await save.mutateAsync({
        id: customer?.id,
        ...rest,
        email: email || null,
        phone: phone || null,
        stellarAddress: stellarAddress || null,
      });
      toast.success(customer ? 'Customer updated' : 'Customer added');
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  });
  return (
    <Modal
      open
      onClose={onClose}
      eyebrow="Customer"
      title={customer ? `Edit ${customer.name}` : 'New customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        </div>
        <Input
          label="Stellar address"
          hint="Optional. Used to recognise this customer's wallet payments."
          className="font-mono text-xs"
          error={errors.stellarAddress?.message}
          {...register('stellarAddress')}
        />
        <Textarea
          label="Notes"
          rows={3}
          placeholder="Allergies, preferences, account terms"
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}

function CustomerDetail({
  id,
  onEdit,
  onDeleted,
}: {
  id: string;
  onEdit: (c: Customer) => void;
  onDeleted: () => void;
}) {
  const { data: c, isLoading } = useCustomer(id);
  const { data: orders } = useTransactions({ customerId: id });
  const del = useDeleteCustomer();
  if (isLoading || !c)
    return (
      <div className="grid place-items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="rounded-xl border border-ink-line bg-paper-card">
      <div className="flex items-start gap-4 border-b border-ink-line p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-bold text-paper">
          {initials(c.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold">{c.name}</h2>
          <p className="truncate text-sm text-ink-3">
            {[c.email, c.phone].filter(Boolean).join(' / ') || 'No contact details'}
          </p>
          {c.stellarAddress && (
            <p className="font-mono text-xs text-lumen">{truncateMiddle(c.stellarAddress, 8, 8)}</p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => onEdit(c)}>
          Edit
        </Button>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-ink-line border-b border-ink-line text-center">
        <div className="p-4">
          <dt className="eyebrow">Visits</dt>
          <dd className="figures text-2xl font-semibold">{c.stats?.visits ?? 0}</dd>
        </div>
        <div className="p-4">
          <dt className="eyebrow">Lifetime</dt>
          <dd>
            <Money cents={c.stats?.lifetimeCents ?? 0} className="text-2xl font-semibold" />
          </dd>
        </div>
        <div className="p-4">
          <dt className="eyebrow">Last seen</dt>
          <dd className="pt-1.5 text-sm">
            {c.stats?.lastVisit ? relativeTime(c.stats.lastVisit) : 'never'}
          </dd>
        </div>
      </dl>
      {c.notes && (
        <p className="whitespace-pre-line border-b border-ink-line p-5 text-sm text-ink-2">
          {c.notes}
        </p>
      )}
      <div className="p-5">
        <p className="eyebrow mb-3">Recent orders</p>
        {orders?.data.length === 0 && <p className="text-sm text-ink-3">No orders yet.</p>}
        <ul className="divide-y divide-ink-line">
          {orders?.data.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-mono">{t.reference}</span>
              <span className="flex-1 text-ink-3">{formatDateTime(t.createdAt)}</span>
              <StatusBadge status={t.status} />
              <Money cents={t.totalCents} />
            </li>
          ))}
        </ul>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 text-signal"
          loading={del.isPending}
          onClick={() => {
            if (window.confirm(`Delete ${c.name}? Their past orders are kept.`)) {
              del.mutate(c.id, {
                onSuccess: () => {
                  toast.success('Customer deleted');
                  onDeleted();
                },
              });
            }
          }}
        >
          Delete customer
        </Button>
      </div>
    </div>
  );
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null | 'new'>(null);
  const { data, isLoading } = useCustomers(useDebounce(search));
  const customers = data?.data ?? [];

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader eyebrow="Customers" title="Regulars and accounts">
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEditing('new')}>
          New customer
        </Button>
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div>
          <Input
            placeholder="Search name, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leading={<Search className="h-4 w-4" />}
            aria-label="Search customers"
          />
          <ul className="mt-3 divide-y divide-ink-line overflow-hidden rounded-xl border border-ink-line bg-paper-card">
            {customers.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper/70',
                    selected === c.id && 'bg-paper-2',
                  )}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-3 font-mono text-xs font-semibold">
                    {initials(c.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-ink-3">
                      {c.email ?? c.phone ?? 'no contact'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {isLoading && (
            <div className="grid place-items-center py-10">
              <LoadingSpinner />
            </div>
          )}
          {!isLoading && customers.length === 0 && <EmptyState title="No customers found" />}
        </div>
        <div>
          {selected ? (
            <CustomerDetail id={selected} onEdit={setEditing} onDeleted={() => setSelected(null)} />
          ) : (
            <EmptyState title="Pick a customer">
              See their visits, spend and order history.
            </EmptyState>
          )}
        </div>
      </div>
      {editing && (
        <CustomerForm
          customer={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
