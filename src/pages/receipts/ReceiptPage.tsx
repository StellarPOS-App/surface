import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReceiptView from '@/components/pos/ReceiptView';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { loadReceipt, receiptAccessMessage } from '@/lib/receiptAccess';
import type { Transaction } from '@/types';

/** `/receipts/:id` is authenticated by App.tsx and loads only via the scoped API. */
export default function ReceiptPage() {
  const { id = '' } = useParams();
  const [sale, setSale] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setSale(null);
    setError(null);
    loadReceipt(id).then(
      (loaded) => {
        if (live) setSale(loaded);
      },
      (err: unknown) => {
        if (live) setError(receiptAccessMessage(err));
      },
    );
    return () => {
      live = false;
    };
  }, [id]);

  if (error)
    return (
      <p role="alert" className="mx-auto mt-8 max-w-md rounded-lg bg-signal-soft px-4 py-3 text-sm text-signal">
        {error}
      </p>
    );
  if (!sale) return <LoadingSpinner label="Loading receipt" />;
  return (
    <div className="mx-auto max-w-xl py-8">
      <ReceiptView sale={sale} />
    </div>
  );
}
