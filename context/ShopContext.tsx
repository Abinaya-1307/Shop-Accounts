import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Item, Transaction, Shop, AddPurchasePayload } from '@/types';
import { generateId, getPriceTrend } from '@/utils/helpers';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  ITEMS: 'shoptracker_items',
  TRANSACTIONS: 'shoptracker_transactions',
  SHOPS: 'shoptracker_shops',
} as const;

// ─── Seed Data (shown on first launch) ────────────────────────────────────────
const SEED_ITEMS: Item[] = [
  {
    id: 'item_seed_1',
    name: 'Ponni Rice',
    unit: 'kg',
    lastPrice: 55,
    lastPurchasedDate: '2026-01-15',
    category: 'Provisions',
  },
  {
    id: 'item_seed_2',
    name: 'Toor Dal',
    unit: 'kg',
    lastPrice: 120,
    lastPurchasedDate: '2026-01-20',
    category: 'Provisions',
  },
  {
    id: 'item_seed_3',
    name: 'Milk',
    unit: 'ltr',
    lastPrice: 26,
    lastPurchasedDate: '2026-02-01',
    category: 'Dairy',
  },
  {
    id: 'item_seed_4',
    name: 'Sunflower Oil',
    unit: 'ltr',
    lastPrice: 140,
    lastPurchasedDate: '2026-01-10',
    category: 'Provisions',
  },
  {
    id: 'item_seed_5',
    name: 'Sugar',
    unit: 'kg',
    lastPrice: 42,
    lastPurchasedDate: '2026-01-25',
    category: 'Provisions',
  },
];

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_seed_1',
    itemId: 'item_seed_1',
    itemName: 'Ponni Rice',
    pricePerUnit: 55,
    quantity: 5,
    totalCost: 275,
    unit: 'kg',
    date: '2026-01-15T10:00:00.000Z',
    priceTrend: 'stable',
  },
  {
    id: 'txn_seed_2',
    itemId: 'item_seed_3',
    itemName: 'Milk',
    pricePerUnit: 26,
    quantity: 10,
    totalCost: 260,
    unit: 'ltr',
    date: '2026-01-20T09:00:00.000Z',
    priceTrend: 'stable',
  },
  {
    id: 'txn_seed_3',
    itemId: 'item_seed_2',
    itemName: 'Toor Dal',
    pricePerUnit: 120,
    quantity: 2,
    totalCost: 240,
    unit: 'kg',
    date: '2026-01-20T10:30:00.000Z',
    priceTrend: 'stable',
  },
  {
    id: 'txn_seed_4',
    itemId: 'item_seed_5',
    itemName: 'Sugar',
    pricePerUnit: 42,
    quantity: 2,
    totalCost: 84,
    unit: 'kg',
    date: '2026-01-25T11:00:00.000Z',
    priceTrend: 'stable',
  },
  {
    id: 'txn_seed_5',
    itemId: 'item_seed_4',
    itemName: 'Sunflower Oil',
    pricePerUnit: 140,
    quantity: 1,
    totalCost: 140,
    unit: 'ltr',
    date: '2026-02-05T10:00:00.000Z',
    priceTrend: 'stable',
  },
  {
    id: 'txn_seed_6',
    itemId: 'item_seed_3',
    itemName: 'Milk',
    pricePerUnit: 28,
    quantity: 10,
    totalCost: 280,
    unit: 'ltr',
    date: '2026-02-10T09:00:00.000Z',
    priceTrend: 'increase',
  },
  {
    id: 'txn_seed_7',
    itemId: 'item_seed_1',
    itemName: 'Ponni Rice',
    pricePerUnit: 58,
    quantity: 5,
    totalCost: 290,
    unit: 'kg',
    date: '2026-02-15T10:00:00.000Z',
    priceTrend: 'increase',
  },
];

const SEED_SHOPS: Shop[] = [
  { id: 'shop_seed_1', name: 'Murugan Stores' },
  { id: 'shop_seed_2', name: 'Big Bazaar' },
];

// ─── Context Shape ─────────────────────────────────────────────────────────────
type ShopContextType = {
  items: Item[];
  transactions: Transaction[];
  shops: Shop[];
  isLoading: boolean;

  // Mutations
  addPurchase: (payload: AddPurchasePayload) => Promise<void>;
  addBatchPurchases: (payloads: AddPurchasePayload[]) => Promise<void>;
  updatePurchase: (id: string, payload: any) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;

  // Read helpers
  getMonthlyTotal: (month: number, year: number) => number;
  getItemHistory: (itemId: string) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
};

// ─── Context Default ───────────────────────────────────────────────────────────
const ShopContext = createContext<ShopContextType>({
  items: [],
  transactions: [],
  shops: [],
  isLoading: true,
  addPurchase: async () => {},
  addBatchPurchases: async () => {},
  updatePurchase: async () => {},
  deletePurchase: async () => {},
  getMonthlyTotal: () => 0,
  getItemHistory: () => [],
  getRecentTransactions: () => [],
});

// Helper to recalculate local transaction trends and item stats chronologically
function recalculateLocalItemStats(
  itemId: string,
  allTxns: Transaction[],
  allItems: Item[]
): { updatedTxns: Transaction[]; updatedItems: Item[] } {
  // 1. Find all transactions for this item
  const itemTxns = allTxns
    .filter((t) => t.itemId === itemId)
    // sort chronological ASC (oldest first)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Compute trends
  const updatedTxns = allTxns.map((t) => {
    if (t.itemId !== itemId) return t;
    const idx = itemTxns.findIndex((it) => it.id === t.id);
    if (idx <= 0) {
      return { ...t, priceTrend: 'stable' as const };
    }
    const currentPrice = t.pricePerUnit;
    const prevPrice = itemTxns[idx - 1].pricePerUnit;
    const trend =
      currentPrice > prevPrice
        ? ('increase' as const)
        : currentPrice < prevPrice
        ? ('decrease' as const)
        : ('stable' as const);
    return { ...t, priceTrend: trend };
  });

  // 3. Update Item lastPrice and lastPurchasedDate
  const updatedItems = allItems.map((item) => {
    if (item.id !== itemId) return item;
    if (itemTxns.length === 0) {
      return { ...item, lastPrice: 0, lastPurchasedDate: '' };
    }
    const latestTxn = itemTxns[itemTxns.length - 1];
    return {
      ...item,
      lastPrice: latestTxn.pricePerUnit,
      lastPurchasedDate: latestTxn.date.split('T')[0],
    };
  });

  return { updatedTxns, updatedItems };
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // ── Load data from AsyncStorage on mount ──
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const [rawItems, rawTxns, rawShops] = await Promise.all([
          AsyncStorage.getItem(KEYS.ITEMS),
          AsyncStorage.getItem(KEYS.TRANSACTIONS),
          AsyncStorage.getItem(KEYS.SHOPS),
        ]);

        const loadedItems: Item[] = rawItems ? JSON.parse(rawItems) : SEED_ITEMS;
        const loadedTxns: Transaction[] = rawTxns ? JSON.parse(rawTxns) : SEED_TRANSACTIONS;
        const loadedShops: Shop[] = rawShops ? JSON.parse(rawShops) : SEED_SHOPS;

        // Seed if empty
        if (!rawItems) await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(SEED_ITEMS));
        if (!rawTxns) await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(SEED_TRANSACTIONS));
        if (!rawShops) await AsyncStorage.setItem(KEYS.SHOPS, JSON.stringify(SEED_SHOPS));

        setItems(loadedItems);
        setTransactions(loadedTxns);
        setShops(loadedShops);
      } catch (err) {
        console.error('[ShopContext] Failed to load data:', err);
        // Fallback to seed data so app is usable
        setItems(SEED_ITEMS);
        setTransactions(SEED_TRANSACTIONS);
        setShops(SEED_SHOPS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persistItems = useCallback(async (updated: Item[]) => {
    setItems(updated);
    await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(updated));
  }, []);

  const persistTransactions = useCallback(async (updated: Transaction[]) => {
    setTransactions(updated);
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
  }, []);

  const persistShops = useCallback(async (updated: Shop[]) => {
    setShops(updated);
    await AsyncStorage.setItem(KEYS.SHOPS, JSON.stringify(updated));
  }, []);

  // ── addPurchase ────────────────────────────────────────────────────────────
  /**
   * Core mutation:
   * 1. Resolve or create the Item record.
   * 2. Resolve or create the Shop record (if provided).
   * 3. Compute the price trend.
   * 4. Create the Transaction and update Item.lastPrice.
   */
  const addPurchase = useCallback(
    async (payload: AddPurchasePayload) => {
      const { item, shop, pricePerUnit, quantity, totalCost, unit, date, id } = payload;

      let currentItems = [...items];
      let currentShops = [...shops];

      // 1. Resolve Item
      let resolvedItem: Item | undefined = item.id
        ? currentItems.find((i) => i.id === item.id)
        : currentItems.find((i) => i.name.toLowerCase() === item.name.toLowerCase());

      if (!resolvedItem) {
        // New item – create it
        resolvedItem = {
          id: item.id || generateId('item'),
          name: item.name,
          unit: unit,
          lastPrice: pricePerUnit,
          lastPurchasedDate: date,
          category: item.category || 'General',
        };
        currentItems = [...currentItems, resolvedItem];
      }

      // 2. Resolve Shop
      let shopId: string | undefined;
      let shopName: string | undefined;
      if (shop?.name) {
        let resolvedShop = shop.id
          ? currentShops.find((s) => s.id === shop.id)
          : currentShops.find((s) => s.name.toLowerCase() === shop.name!.toLowerCase());

        if (!resolvedShop) {
          resolvedShop = { id: shop.id || generateId('shop'), name: shop.name };
          currentShops = [...currentShops, resolvedShop];
          await persistShops(currentShops);
        } else {
          // Shops haven't changed, no need to persist
        }
        shopId = resolvedShop.id;
        shopName = resolvedShop.name;
      }

      // 3. Build Transaction
      const newTransaction: Transaction = {
        id: id || generateId('txn'),
        itemId: resolvedItem.id,
        itemName: resolvedItem.name,
        pricePerUnit,
        quantity,
        totalCost,
        unit,
        date,
        priceTrend: 'stable', // Recalculated below
        shopId,
        shopName,
      };

      // 4. Recalculate trends and item stats chronologically
      const tempTxns = [newTransaction, ...transactions];
      const { updatedTxns, updatedItems } = recalculateLocalItemStats(resolvedItem.id, tempTxns, currentItems);

      // Sort newest-first (descending date)
      const sortedTxns = [...updatedTxns].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      await Promise.all([
        persistItems(updatedItems),
        persistTransactions(sortedTxns),
      ]);
    },
    [items, transactions, shops, persistItems, persistTransactions, persistShops]
  );

  const addBatchPurchases = useCallback(
    async (payloads: AddPurchasePayload[]) => {
      let currentItems = [...items];
      let currentShops = [...shops];
      let newTransactions = [];
      let shopsChanged = false;
      const touchedItemIds = new Set<string>();

      for (const payload of payloads) {
        const { item, shop, pricePerUnit, quantity, totalCost, unit, date, id } = payload;

        // 1. Resolve Item
        let resolvedItem: Item | undefined = item.id
          ? currentItems.find((i) => i.id === item.id)
          : currentItems.find((i) => i.name.toLowerCase() === item.name.toLowerCase());

        if (!resolvedItem) {
          resolvedItem = {
            id: item.id || generateId('item'),
            name: item.name,
            unit: unit,
            lastPrice: pricePerUnit,
            lastPurchasedDate: date,
            category: item.category || 'General',
          };
          currentItems.push(resolvedItem);
        }
        
        touchedItemIds.add(resolvedItem.id);

        // 2. Resolve Shop
        let shopId: string | undefined;
        let shopName: string | undefined;
        if (shop?.name) {
          let resolvedShop = shop.id
            ? currentShops.find((s) => s.id === shop.id)
            : currentShops.find((s) => s.name.toLowerCase() === shop.name!.toLowerCase());

          if (!resolvedShop) {
            resolvedShop = { id: shop.id || generateId('shop'), name: shop.name };
            currentShops.push(resolvedShop);
            shopsChanged = true;
          }
          shopId = resolvedShop.id;
          shopName = resolvedShop.name;
        }

        // 3. Build Transaction
        newTransactions.push({
          id: id || generateId('txn'),
          itemId: resolvedItem.id,
          itemName: resolvedItem.name,
          pricePerUnit,
          quantity,
          totalCost,
          unit,
          date,
          priceTrend: 'stable' as const, // Recalculated below
          shopId,
          shopName,
        });
      }

      // 4. Combine all transactions
      let updatedTxns = [...newTransactions, ...transactions];

      // 5. Recalculate stats/trends for all touched item IDs
      for (const itemId of touchedItemIds) {
        const res = recalculateLocalItemStats(itemId, updatedTxns, currentItems);
        updatedTxns = res.updatedTxns;
        currentItems = res.updatedItems;
      }

      // Sort chronological descending (newest first)
      const sortedTxns = [...updatedTxns].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      await Promise.all([
        persistItems(currentItems),
        persistTransactions(sortedTxns),
        shopsChanged ? persistShops(currentShops) : Promise.resolve(),
      ]);
    },
    [items, transactions, shops, persistItems, persistTransactions, persistShops]
  );

  const updatePurchase = useCallback(
    async (txnId: string, payload: {
      date: string;
      item: { id?: string; name: string };
      shop?: { id?: string; name?: string };
      pricePerUnit: number;
      quantity: number;
      totalCost: number;
      unit: string;
    }) => {
      // Find original transaction
      const originalTxn = transactions.find(t => t.id === txnId);
      if (!originalTxn) return;

      const oldItemId = originalTxn.itemId;

      let currentItems = [...items];
      let currentShops = [...shops];

      // Resolve or create item
      let resolvedItem = payload.item.id
        ? currentItems.find((i) => i.id === payload.item.id)
        : currentItems.find((i) => i.name.toLowerCase() === payload.item.name.toLowerCase());

      if (!resolvedItem) {
        resolvedItem = {
          id: payload.item.id || generateId('item'),
          name: payload.item.name,
          unit: payload.unit,
          lastPrice: payload.pricePerUnit,
          lastPurchasedDate: payload.date,
          category: 'General',
        };
        currentItems = [...currentItems, resolvedItem];
      }

      // Resolve or create shop
      let shopId: string | undefined;
      let shopName: string | undefined;
      if (payload.shop && typeof payload.shop.name === 'string') {
        const shopIdInput = payload.shop.id;
        const shopNameInput = payload.shop.name;
        let resolvedShop = shopIdInput
          ? currentShops.find((s) => s.id === shopIdInput)
          : currentShops.find((s) => s.name.toLowerCase() === shopNameInput.toLowerCase());

        if (!resolvedShop) {
          const newShop = { id: shopIdInput || generateId('shop'), name: shopNameInput };
          currentShops = [...currentShops, newShop];
          await persistShops(currentShops);
          resolvedShop = newShop;
        }
        shopId = resolvedShop.id;
        shopName = resolvedShop.name;
      }

      // Update the transaction in array
      let updatedTxns = transactions.map((t) =>
        t.id === txnId
          ? {
              ...t,
              itemId: resolvedItem!.id,
              itemName: resolvedItem!.name,
              pricePerUnit: payload.pricePerUnit,
              quantity: payload.quantity,
              totalCost: payload.totalCost,
              unit: payload.unit,
              date: payload.date,
              shopId,
              shopName,
            }
          : t
      );

      // Recalculate stats for new item
      const res1 = recalculateLocalItemStats(resolvedItem.id, updatedTxns, currentItems);
      updatedTxns = res1.updatedTxns;
      currentItems = res1.updatedItems;

      // Recalculate stats for old item if changed
      if (oldItemId !== resolvedItem.id) {
        const res2 = recalculateLocalItemStats(oldItemId, updatedTxns, currentItems);
        updatedTxns = res2.updatedTxns;
        currentItems = res2.updatedItems;
      }

      // Sort transactions descending by date
      updatedTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      await Promise.all([
        persistItems(currentItems),
        persistTransactions(updatedTxns),
      ]);
    },
    [items, transactions, shops, persistItems, persistTransactions, persistShops]
  );

  const deletePurchase = useCallback(
    async (txnId: string) => {
      const originalTxn = transactions.find(t => t.id === txnId);
      if (!originalTxn) return;

      const itemId = originalTxn.itemId;

      let currentItems = [...items];
      let updatedTxns = transactions.filter(t => t.id !== txnId);

      const res = recalculateLocalItemStats(itemId, updatedTxns, currentItems);
      updatedTxns = res.updatedTxns;
      currentItems = res.updatedItems;

      // Sort transactions descending by date
      updatedTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      await Promise.all([
        persistItems(currentItems),
        persistTransactions(updatedTxns),
      ]);
    },
    [items, transactions, persistItems, persistTransactions]
  );

  // ── Read Helpers ──────────────────────────────────────────────────────────
  const getMonthlyTotal = useCallback(
    (month: number, year: number): number => {
      return transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((sum, t) => sum + t.totalCost, 0);
    },
    [transactions]
  );

  const getItemHistory = useCallback(
    (itemId: string): Transaction[] => {
      return transactions
        .filter((t) => t.itemId === itemId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [transactions]
  );

  const getRecentTransactions = useCallback(
    (limit = 5): Transaction[] => {
      return [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
    [transactions]
  );

  return (
    <ShopContext.Provider
      value={{
        items,
        transactions,
        shops,
        isLoading,
        addPurchase,
        addBatchPurchases,
        updatePurchase,
        deletePurchase,
        getMonthlyTotal,
        getItemHistory,
        getRecentTransactions,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

// ─── Consumer Hook ─────────────────────────────────────────────────────────────
export function useShopContext(): ShopContextType {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error('useShopContext must be used inside <ShopProvider>');
  }
  return ctx;
}

export default ShopContext;
