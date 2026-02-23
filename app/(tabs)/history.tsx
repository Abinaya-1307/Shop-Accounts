import React, { useMemo, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Container, Card, Input } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { API_URL as API } from '@/lib/config';

type ActiveTab = 'items' | 'byshop';

export default function HistoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('items');

  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all items + transactions once on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [itemsRes, txnRes] = await Promise.all([
          axios.get(`${API}/items`),
          axios.get(`${API}/transactions`),
        ]);
        setItems(itemsRes.data ?? []);
        setTransactions(txnRes.data ?? []);
      } catch (err) {
        console.error('History load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Items Tab ────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Use the most recent transaction's price_trend for a given item_id
  const getItemTrend = (itemId: string) => {
    const itemTxns = transactions
      .filter((t: any) => t.item_id === itemId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return itemTxns.length > 0 ? itemTxns[0].price_trend : 'stable';
  };

  // ─── By Shop Tab ──────────────────────────────────────────────────────────
  const shareSession = useCallback(
    async (shopName: string, date: string, txns: any[], total: number) => {
      const lines = txns.map((t: any) =>
        `• ${t.item_name}  ₹${t.price_per_unit} × ${t.quantity} ${t.unit ?? ''} = ₹${t.total_cost.toFixed(2)}`
      );
      const d = new Date(date);
      const dateLabel = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const message = [
        `🛒 ${shopName}`,
        `📅 ${dateLabel}`,
        '',
        ...lines,
        '',
        `💰 Total: ₹${total.toFixed(2)}`,
      ].join('\n');
      await Share.share({ message });
    },
    []
  );

  const shopDateGroups = useMemo(() => {
    const groups: Record<string, Record<string, any[]>> = {};

    transactions.forEach((t: any) => {
      const shop = t.shop_name || 'Unknown Shop';
      const day = new Date(t.date).toISOString().split('T')[0];

      if (!groups[shop]) groups[shop] = {};
      if (!groups[shop][day]) groups[shop][day] = [];
      groups[shop][day].push(t);
    });

    return Object.entries(groups)
      .map(([shopName, dateBuckets]) => ({
        shopName,
        dates: Object.entries(dateBuckets)
          .map(([date, txns]) => ({
            date,
            txns,
            total: txns.reduce((s: number, t: any) => s + t.total_cost, 0),
          }))
          .sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => b.dates[0].date.localeCompare(a.dates[0].date));
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

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
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
                                Last: ₹{item.last_price} / {item.unit}
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
                    {shopGroup.dates.map((dateGroup) => {
                      const d = new Date(dateGroup.date);
                      const dayNum = d.getDate();
                      const mon = d.toLocaleDateString('en-IN', { month: 'short' });
                      const yr = d.getFullYear();
                      return (
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
                              {/* Calendar chip */}
                              <View style={styles.calChip}>
                                <Text style={styles.calDay}>{dayNum}</Text>
                                <Text style={styles.calMon}>{mon}</Text>
                                <Text style={styles.calYr}>{yr}</Text>
                              </View>
                              <View style={styles.dateMiddle}>
                                <Text style={styles.dateItemCount} numberOfLines={1}>
                                  {dateGroup.txns.length} item{dateGroup.txns.length !== 1 ? 's' : ''}
                                </Text>
                                <Text style={styles.dateTotal}>
                                  ₹{dateGroup.total.toFixed(2)}
                                </Text>
                              </View>
                              <View style={styles.dateActions}>
                                <TouchableOpacity
                                  style={styles.shareBtn}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    shareSession(
                                      shopGroup.shopName,
                                      dateGroup.date,
                                      dateGroup.txns,
                                      dateGroup.total
                                    );
                                  }}
                                >
                                  <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                                </TouchableOpacity>
                                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                              </View>
                            </View>
                          </Card>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </>
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
  // ─── Loading ───────────────────────────────────────────────────────────
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
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
    gap: spacing.sm,
  },
  calChip: {
    width: 46,
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.md,
    paddingVertical: 4,
  },
  calDay: {
    ...typography.h3,
    color: colors.primary,
    lineHeight: 24,
  },
  calMon: {
    ...typography.smallBold,
    color: colors.primary,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  calYr: {
    ...typography.tiny,
    color: colors.textTertiary,
    lineHeight: 12,
  },
  dateMiddle: {
    flex: 1,
  },
  dateItemCount: {
    ...typography.small,
    color: colors.textTertiary,
  },
  dateTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  dateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareBtn: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryTint,
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
