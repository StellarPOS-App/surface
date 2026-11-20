import { Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCustomers, useSaveCustomer } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import type { Customer } from '@/types';
import Button from '../ui/Button';
import { Input } from '../ui/Field';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';

export default function CustomerPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (c: Customer) => void;
}) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { data, isFetching } = useCustomers(debounced);
  const save = useSaveCustomer();

  const quickAdd = async () => {
    try {
      const customer = await save.mutateAsync({ name: search.trim() });
      toast.success(`Added ${customer.name}`);
      onPick(customer);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} eyebrow="Attach to order" title="Customer">
      <Input
        autoFocus
        placeholder="Search name, email or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leading={<Search className="h-4 w-4" />}
      />
      <ul className="mt-4 divide-y divide-ink-line">
        {isFetching && !data && (
          <li className="py-6 text-center">
            <LoadingSpinner />
          </li>
        )}
        {data?.data.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onPick(c)}
              className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left hover:bg-paper-2"
            >
              <span className="font-medium">{c.name}</span>
              <span className="truncate font-mono text-xs text-ink-3">
                {c.email ?? c.phone ?? ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {search.trim().length > 1 && (
        <Button
          variant="secondary"
          className="mt-4"
          fullWidth
          icon={<UserPlus className="h-4 w-4" />}
          loading={save.isPending}
          onClick={quickAdd}
        >
          Add "{search.trim()}" as a new customer
        </Button>
      )}
    </Modal>
  );
}
