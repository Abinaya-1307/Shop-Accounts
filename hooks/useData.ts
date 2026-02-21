import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data } = await blink.db.items.list();
      return data || [];
    },
  });
}

export function useShops() {
  return useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      const { data } = await blink.db.shops.list();
      return data || [];
    },
  });
}

export function useTransactions(limit = 10) {
  return useQuery({
    queryKey: ['transactions', limit],
    queryFn: async () => {
      const { data } = await blink.db.transactions.list({
        limit,
        sort: { date: 'desc' },
      });
      return data || [];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: any) => {
      const { item, shop, ...txnData } = transaction;
      
      // 1. Ensure item exists or create it
      let itemId = item.id;
      if (!itemId) {
        itemId = `item_${Date.now()}`;
        await blink.db.items.create({
          id: itemId,
          name: item.name,
          unit: txnData.unit || 'kg',
          lastPrice: txnData.pricePerUnit,
          lastPurchasedDate: txnData.date,
        });
      } else {
        // Update item's last price
        await blink.db.items.update(itemId, {
          lastPrice: txnData.pricePerUnit,
          lastPurchasedDate: txnData.date,
        });
      }

      // 2. Ensure shop exists or create it
      let shopId = shop?.id;
      if (shop?.name && !shopId) {
        shopId = `shop_${Date.now()}`;
        await blink.db.shops.create({
          id: shopId,
          name: shop.name,
        });
      }

      // 3. Create transaction
      return await blink.db.transactions.create({
        ...txnData,
        itemId,
        shopId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
  });
}
