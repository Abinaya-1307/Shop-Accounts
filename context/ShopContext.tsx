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
  getMonthlyTotal: () => 0,
  getItemHistory: () => [],
  getRecentTransactions: () => [],
});

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

      const trend = getPriceTrend(pricePerUnit, resolvedItem?.lastPrice);

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
      } else {
        // Existing item – update last price
        currentItems = currentItems.map((i) =>
          i.id === resolvedItem!.id
            ? { ...i, lastPrice: pricePerUnit, lastPurchasedDate: date }
            : i
        );
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
        priceTrend: trend,
        shopId,
        shopName,
      };

      // 4. Persist everything
      const updatedTransactions = [newTransaction, ...transactions]; // newest first
      await Promise.all([
        persistItems(currentItems),
        persistTransactions(updatedTransactions),
      ]);
    },
    [items, transactions, shops, persistItems, persistTransactions, persistShops]
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
