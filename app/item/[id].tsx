import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { API_URL as API } from '@/lib/config';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`${API}/items/${id}`);
        setItem(data.item);
        setTransactions(data.transactions ?? []);
      } catch (err: any) {
        if (err.response?.status === 404) setNotFound(true);
        console.error('Item detail load error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const minPrice = useMemo(
    () => (transactions.length ? Math.min(...transactions.map((t: any) => t.price_per_unit)) : 0),
    [transactions]
  );
  const maxPrice = useMemo(
    () => (transactions.length ? Math.max(...transactions.map((t: any) => t.price_per_unit)) : 0),
    [transactions]
  );
  const avgPrice = useMemo(
    () =>
      transactions.length
        ? transactions.reduce((s: number, t: any) => s + t.price_per_unit, 0) / transactions.length
        : 0,
    [transactions]
  );
  const totalSpent = useMemo(
    () => transactions.reduce((s: number, t: any) => s + t.total_cost, 0),
    [transactions]
  );

  const trendColor = (trend: string) => {
    if (trend === 'increase') return colors.error;
    if (trend === 'decrease') return colors.success;
    return colors.textTertiary;
  };
  const trendIcon = (trend: string): any => {
    if (trend === 'increase') return 'arrow-up-circle';
    if (trend === 'decrease') return 'arrow-down-circle';
    return 'remove-circle-outline';
  };
  const trendBg = (trend: string) => {
    if (trend === 'increase') return colors.errorTint;
    if (trend === 'decrease') return colors.successTint;
    return colors.backgroundSecondary;
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <Container safeArea edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Container>
    );
  }

  // ── Not Found ──
  if (notFound || !item) {
    return (
      <Container safeArea edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRowOnly}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Item not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>
              {item.category ? `${item.category}  ·  ` : ''}per {item.unit}
            </Text>
          </View>
        </View>

        {/* ── Current Price Hero ── */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <Text style={styles.heroLabel}>Current Price</Text>
          <Text style={styles.heroPrice}>
            ₹{item.last_price ?? '—'}
            <Text style={styles.heroUnit}> / {item.unit}</Text>
          </Text>
          {item.last_purchased_date && (
            <Text style={styles.heroDate}>
              Last bought on{' '}
              {new Date(item.last_purchased_date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          )}
        </LinearGradient>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.successTint }]}>
            <Ionicons name="trending-down" size={18} color={colors.success} />
            <Text style={styles.statLabel}>Min</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>₹{minPrice}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.errorTint }]}>
            <Ionicons name="trending-up" size={18} color={colors.error} />
            <Text style={styles.statLabel}>Max</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>₹{maxPrice}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="stats-chart" size={18} color="#D97706" />
            <Text style={styles.statLabel}>Avg</Text>
            <Text style={[styles.statValue, { color: '#D97706' }]}>₹{avgPrice.toFixed(0)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            <Text style={styles.statLabel}>Spent</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              ₹{totalSpent >= 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* ── Purchase History ── */}
        <Text style={styles.sectionTitle}>
          Purchase History{' '}
          <Text style={styles.sectionCount}>({transactions.length})</Text>
        </Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No purchases recorded yet.</Text>
          </View>
        ) : (
          transactions.map((txn: any, index: number) => {
            const d = new Date(txn.date);
            const dateStr = d.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const timeStr = d.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <Card key={txn.id} style={styles.txnCard}>
                {/* Date row */}
                <View style={styles.txnTopRow}>
                  <View style={styles.txnDateGroup}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <Text style={styles.txnDate}>{dateStr}</Text>
                    <Text style={styles.txnTime}>{timeStr}</Text>
                  </View>
                  <View style={[styles.trendBadge, { backgroundColor: trendBg(txn.price_trend) }]}>
                    <Ionicons
                      name={trendIcon(txn.price_trend)}
                      size={13}
                      color={trendColor(txn.price_trend)}
                    />
                    <Text style={[styles.trendText, { color: trendColor(txn.price_trend) }]}>
                      {txn.price_trend === 'increase'
                        ? 'Rose'
                        : txn.price_trend === 'decrease'
                        ? 'Fell'
                        : 'Same'}
                    </Text>
                  </View>
                </View>

                {/* Price · Qty · Total */}
                <View style={styles.txnDetailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{txn.price_per_unit}</Text>
                    <Text style={styles.detailUnit}>/{txn.unit}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Qty</Text>
                    <Text style={styles.detailValue}>{txn.quantity}</Text>
                    <Text style={styles.detailUnit}>{txn.unit}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={[styles.detailValue, styles.totalHighlight]}>
                      ₹{txn.total_cost.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Shop */}
                {txn.shop_name ? (
                  <View style={styles.shopRow}>
                    <Ionicons name="storefront-outline" size={13} color={colors.textTertiary} />
                    <Text style={styles.shopName}>{txn.shop_name}</Text>
                  </View>
                ) : null}

                {/* Timeline connector (not last) */}
                {index < transactions.length - 1 && (
                  <View style={styles.timelineConnector} />
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textTertiary,
  },
  backRowOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  backLabel: {
    ...typography.body,
    color: colors.text,
  },
  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  itemName: {
    ...typography.h2,
    color: colors.text,
  },
  itemMeta: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  // ── Hero Banner ───────────────────────────────────────────────────────────
  heroBanner: {
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  heroLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.xs,
  },
  heroPrice: {
    ...typography.display,
    color: colors.white,
    fontSize: 36,
  },
  heroUnit: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  heroDate: {
    ...typography.small,
    color: 'rgba(255,255,255,0.65)',
    marginTop: spacing.sm,
  },
  // ── Stats ─────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    ...typography.captionBold,
    fontSize: 13,
  },
  // ── Section Title ─────────────────────────────────────────────────────────
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionCount: {
    ...typography.body,
    color: colors.textTertiary,
  },
  // ── Transaction Cards ─────────────────────────────────────────────────────
  txnCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    position: 'relative',
  },
  txnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  txnDateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  txnDate: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  txnTime: {
    ...typography.small,
    color: colors.textTertiary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  trendText: {
    ...typography.smallBold,
  },
  txnDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    ...typography.tiny,
    color: colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detailValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  detailUnit: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  totalHighlight: {
    color: colors.primary,
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shopName: {
    ...typography.small,
    color: colors.textTertiary,
  },
  timelineConnector: {
    position: 'absolute',
    left: spacing.lg,
    bottom: -spacing.md,
    width: 2,
    height: spacing.md,
    backgroundColor: colors.border,
  },
  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyHistory: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
