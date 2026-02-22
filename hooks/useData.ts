import { useMemo, useCallback, useState } from 'react';
import { useShopContext } from '@/context/ShopContext';
import type { AddPurchasePayload } from '@/types';

/**
 * Returns all items from the local ShopContext store.
 * Matches the { data, isLoading } shape used by the UI components.
 */
export function useItems() {
  const { items, isLoading } = useShopContext();
  return { data: items, isLoading };
}

/**
 * Returns all shops from the local ShopContext store.
 */
export function useShops() {
  const { shops, isLoading } = useShopContext();
  return { data: shops, isLoading };
}

/**
 * Returns the most recent `limit` transactions, sorted newest-first.
 * Matches the { data, isLoading } shape used by the UI components.
 */
export function useTransactions(limit = 10) {
  const { transactions, isLoading } = useShopContext();

  const data = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [transactions, limit]);

  return { data, isLoading };
}

/**
 * Returns a mutation-like object whose mutateAsync calls addPurchase on the context.
 * Matches the interface used by add.tsx: `await createTxn.mutateAsync(payload)`
 */
export function useCreateTransaction() {
  const { addPurchase } = useShopContext();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(
    async (payload: AddPurchasePayload) => {
      setIsPending(true);
      try {
        await addPurchase(payload);
      } finally {
        setIsPending(false);
      }
    },
    [addPurchase]
  );

  return { mutateAsync, isPending };
}
