import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useShopContext } from '@/context/ShopContext';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, getItemHistory } = useShopContext();

  // Find the item from the inventory
  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);

  // All purchases of this item, sorted newest first
  const history = useMemo(() => getItemHistory(id ?? ''), [getItemHistory, id]);

  const minPrice = useMemo(
    () => (history.length ? Math.min(...history.map((t) => t.pricePerUnit)) : 0),
    [history]
  );
  const maxPrice = useMemo(
    () => (history.length ? Math.max(...history.map((t) => t.pricePerUnit)) : 0),
    [history]
  );
  const totalSpent = useMemo(
    () => history.reduce((sum, t) => sum + t.totalCost, 0),
    [history]
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

  if (!item) {
    return (
      <Container safeArea padding="lg">
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Item not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.category} · per {item.unit}</Text>
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.successTint }]}>
            <Text style={styles.statLabel}>Min Price</Text>
            <Text style={[styles.statValue, { color: colors.successDark }]}>
              ₹{minPrice}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.errorTint }]}>
            <Text style={styles.statLabel}>Max Price</Text>
            <Text style={[styles.statValue, { color: colors.errorDark }]}>
              ₹{maxPrice}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primaryTint }]}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={[styles.statValue, { color: colors.primaryDark }]}>
              ₹{totalSpent.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* ── Current Price Banner ── */}
        <Card style={styles.currentPriceBanner}>
          <View style={styles.bannerRow}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={styles.bannerLabel}>Current Known Price</Text>
          </View>
          <Text style={styles.bannerPrice}>
            {formatCurrency(item.lastPrice)}{' '}
            <Text style={styles.bannerUnit}>/ {item.unit}</Text>
          </Text>
          <Text style={styles.bannerDate}>
            Last bought on {formatDate(item.lastPurchasedDate)}
          </Text>
        </Card>

        {/* ── Purchase History ── */}
        <Text style={styles.sectionTitle}>Purchase History ({history.length})</Text>

        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No purchases recorded yet.</Text>
          </View>
        ) : (
          history.map((txn, index) => (
            <Card key={txn.id} style={styles.txnCard}>
              {/* Date & Trend */}
              <View style={styles.txnTopRow}>
                <Text style={styles.txnDate}>{formatDate(txn.date)}</Text>
                <View style={styles.trendBadge}>
                  <Ionicons
                    name={trendIcon(txn.priceTrend)}
                    size={14}
                    color={trendColor(txn.priceTrend)}
                  />
                  <Text style={[styles.trendText, { color: trendColor(txn.priceTrend) }]}>
                    {txn.priceTrend === 'increase'
                      ? 'Price Rose'
                      : txn.priceTrend === 'decrease'
                      ? 'Price Fell'
                      : 'Same Price'}
                  </Text>
                </View>
              </View>

              {/* Price · Qty · Total */}
              <View style={styles.txnDetailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Rate</Text>
                  <Text style={styles.detailValue}>₹{txn.pricePerUnit}/{txn.unit}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Qty</Text>
                  <Text style={styles.detailValue}>
                    {txn.quantity} {txn.unit}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total</Text>
                  <Text style={[styles.detailValue, styles.totalBold]}>
                    ₹{txn.totalCost.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Shop */}
              {txn.shopName ? (
                <View style={styles.shopRow}>
                  <Ionicons name="storefront-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.shopName}>{txn.shopName}</Text>
                </View>
              ) : null}
            </Card>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  backRow: {
    marginBottom: spacing.lg,
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    ...typography.h4,
  },
  currentPriceBanner: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bannerLabel: {
    ...typography.captionBold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  bannerPrice: {
    ...typography.h2,
    color: colors.text,
  },
  bannerUnit: {
    ...typography.body,
    color: colors.textTertiary,
  },
  bannerDate: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 4,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  txnCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  txnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  txnDate: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    ...typography.smallBold,
  },
  txnDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    marginBottom: 2,
  },
  detailValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  totalBold: {
    color: colors.primary,
    fontSize: 14,
  },
  divider: {
    width: 1,
    height: 32,
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
  emptyHistory: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textTertiary,
  },
});
