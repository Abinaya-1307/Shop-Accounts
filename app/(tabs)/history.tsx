import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Container, Card, Input } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useItems, useTransactions } from '@/hooks/useData';
import { useShopContext } from '@/context/ShopContext';
import { formatDate } from '@/utils/helpers';

type ActiveTab = 'items' | 'byshop';

export default function HistoryScreen() {
  const router = useRouter();
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { transactions } = useShopContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('items');

  // ─── Items Tab ────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const getItemTrend = (itemId: string) => {
    const itemTxns = transactions
      .filter((t) => t.itemId === itemId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return itemTxns.length > 0 ? itemTxns[0].priceTrend : 'stable';
  };

  // ─── By Shop Tab ──────────────────────────────────────────────────────────
  /**
   * Groups transactions like:
   * {
   *   "Murugan Stores": {
   *     "2026-02-15": [ txn, txn ],
   *     "2026-01-10": [ txn ]
   *   },
   *   "Big Bazaar": { ... }
   * }
   */
  const shopDateGroups = useMemo(() => {
    const groups: Record<string, Record<string, typeof transactions>> = {};

    transactions.forEach((t) => {
      const shop = t.shopName || 'Unknown Shop';
      const day = new Date(t.date).toISOString().split('T')[0]; // "2026-02-15"

      if (!groups[shop]) groups[shop] = {};
      if (!groups[shop][day]) groups[shop][day] = [];
      groups[shop][day].push(t);
    });

    // Convert to sorted array: newest date first per shop, shops sorted by latest date
    return Object.entries(groups)
      .map(([shopName, dateBuckets]) => ({
        shopName,
        dates: Object.entries(dateBuckets)
          .map(([date, txns]) => ({
            date,
            txns,
            total: txns.reduce((s, t) => s + t.totalCost, 0),
          }))
          .sort((a, b) => b.date.localeCompare(a.date)), // newest first
      }))
      .sort((a, b) =>
        b.dates[0].date.localeCompare(a.dates[0].date)
      );
  }, [transactions]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Container safeArea padding="lg">
      <Text style={styles.title}>History</Text>

      {/* ── Tab Switcher ── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.tabActive]}
          onPress={() => setActiveTab('items')}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={activeTab === 'items' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
            By Item
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'byshop' && styles.tabActive]}
          onPress={() => setActiveTab('byshop')}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={activeTab === 'byshop' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'byshop' && styles.tabTextActive]}>
            By Shop
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ITEMS TAB ── */}
      {activeTab === 'items' && (
        <>
          <View style={styles.searchSection}>
            <Input
              placeholder="Find item..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Ionicons name="search" size={20} color={colors.textTertiary} />}
            />
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="archive-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No items yet</Text>
              <Text style={styles.emptySubtitle}>
                Start adding purchases to see price trends here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const trend = getItemTrend(item.id);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({ pathname: '/item/[id]', params: { id: item.id } })
                    }
                  >
                    <Card style={styles.itemCard}>
                      <View style={styles.itemRow}>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>
                            Last: ₹{item.lastPrice} / {item.unit}
                          </Text>
                        </View>
                        <View style={styles.trendContainer}>
                          <Ionicons
                            name={
                              trend === 'increase'
                                ? 'trending-up'
                                : trend === 'decrease'
                                ? 'trending-down'
                                : 'remove'
                            }
                            size={24}
                            color={
                              trend === 'increase'
                                ? colors.error
                                : trend === 'decrease'
                                ? colors.success
                                : colors.textTertiary
                            }
                          />
                          <Text
                            style={[
                              styles.trendText,
                              {
                                color:
                                  trend === 'increase'
                                    ? colors.error
                                    : trend === 'decrease'
                                    ? colors.success
                                    : colors.textTertiary,
                              },
                            ]}
                          >
                            {trend === 'increase'
                              ? 'Rising'
                              : trend === 'decrease'
                              ? 'Falling'
                              : 'Stable'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}

      {/* ── BY SHOP TAB ── */}
      {activeTab === 'byshop' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {shopDateGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No shop data yet</Text>
              <Text style={styles.emptySubtitle}>
                Add a shop name when recording purchases.
              </Text>
            </View>
          ) : (
            shopDateGroups.map((shopGroup) => (
              <View key={shopGroup.shopName} style={styles.shopSection}>
                {/* Shop Name Header */}
                <View style={styles.shopLabelRow}>
                  <Ionicons name="storefront" size={18} color={colors.primary} />
                  <Text style={styles.shopLabel}>{shopGroup.shopName}</Text>
                </View>

                {/* Date Rows under that shop */}
                {shopGroup.dates.map((dateGroup) => (
                  <TouchableOpacity
                    key={dateGroup.date}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/shop-session',
                        params: {
                          shopName: shopGroup.shopName,
                          date: dateGroup.date,
                        },
                      })
                    }
                  >
                    <Card style={styles.dateCard}>
                      <View style={styles.dateCardRow}>
                        <View style={styles.dateLeft}>
                          <View style={styles.dateDot} />
                          <View>
                            <Text style={styles.dateText}>
                              {formatDate(dateGroup.date)}
                            </Text>
                            <Text style={styles.dateItemCount}>
                              {dateGroup.txns.length} item
                              {dateGroup.txns.length !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.dateRight}>
                          <Text style={styles.dateTotal}>
                            ₹{dateGroup.total.toFixed(2)}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={colors.textTertiary}
                          />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  // ─── Tab Switcher ──────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
  },
  // ─── Items Tab ─────────────────────────────────────────────────────────
  searchSection: {
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  itemCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  itemMeta: {
    ...typography.small,
    color: colors.textTertiary,
  },
  trendContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  trendText: {
    ...typography.tiny,
    fontWeight: '700',
    marginTop: 2,
  },
  // ─── By Shop Tab ───────────────────────────────────────────────────────
  shopSection: {
    marginBottom: spacing.xl,
  },
  shopLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  shopLabel: {
    ...typography.h4,
    color: colors.text,
  },
  dateCard: {
    marginBottom: spacing.xs,
    padding: spacing.md,
  },
  dateCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dateText: {
    ...typography.captionBold,
    color: colors.text,
  },
  dateItemCount: {
    ...typography.small,
    color: colors.textTertiary,
  },
  dateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  // ─── Empty State ───────────────────────────────────────────────────────
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
