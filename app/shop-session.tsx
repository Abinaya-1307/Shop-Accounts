import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useShopContext } from '@/context/ShopContext';
import { formatDate, formatCurrency } from '@/utils/helpers';

export default function ShopSessionScreen() {
  /**
   * Params passed from History page:
   *   shopName  – e.g. "Murugan Stores"
   *   date      – e.g. "2026-02-15"   (ISO date only, no time)
   */
  const { shopName, date } = useLocalSearchParams<{ shopName: string; date: string }>();
  const router = useRouter();
  const { transactions } = useShopContext();

  // Filter transactions by shopName AND day
  const sessionTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txnDay = new Date(t.date).toISOString().split('T')[0]; // "2026-02-15"
      const matchShop = t.shopName === shopName;
      const matchDate = txnDay === date;
      // If shopName is blank/undefined, match transactions with no shop on that date
      if (!shopName || shopName === 'Unknown Shop') {
        return matchDate && (!t.shopName || t.shopName === 'Unknown Shop');
      }
      return matchShop && matchDate;
    });
  }, [transactions, shopName, date]);

  const grandTotal = useMemo(
    () => sessionTransactions.reduce((sum, t) => sum + t.totalCost, 0),
    [sessionTransactions]
  );

  const trendIcon = (trend: string): any => {
    if (trend === 'increase') return 'arrow-up-circle';
    if (trend === 'decrease') return 'arrow-down-circle';
    return 'remove-circle-outline';
  };

  const trendColor = (trend: string) => {
    if (trend === 'increase') return colors.error;
    if (trend === 'decrease') return colors.success;
    return colors.textTertiary;
  };

  return (
    <Container safeArea edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.shopHeader}>
          <View style={styles.shopIconBox}>
            <Ionicons name="storefront" size={28} color={colors.primary} />
          </View>
          <View style={styles.shopHeaderText}>
            <Text style={styles.shopTitle}>{shopName || 'Unknown Shop'}</Text>
            <Text style={styles.sessionDate}>{formatDate(date ?? '')}</Text>
          </View>
        </View>

        {/* ── Summary Card ── */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Items Bought</Text>
              <Text style={styles.summaryValue}>{sessionTransactions.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {formatCurrency(grandTotal)}
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Item List ── */}
        <Text style={styles.sectionTitle}>Items Purchased</Text>

        {sessionTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No items found for this session.</Text>
          </View>
        ) : (
          sessionTransactions.map((txn) => (
            <Card key={txn.id} style={styles.txnCard}>
              <View style={styles.txnHeader}>
                <Text style={styles.txnItemName}>{txn.itemName}</Text>
                <View style={styles.trendBadge}>
                  <Ionicons
                    name={trendIcon(txn.priceTrend)}
                    size={14}
                    color={trendColor(txn.priceTrend)}
                  />
                  <Text style={[styles.trendLabel, { color: trendColor(txn.priceTrend) }]}>
                    {txn.priceTrend === 'increase'
                      ? 'Higher'
                      : txn.priceTrend === 'decrease'
                      ? 'Lower'
                      : 'Same'}
                  </Text>
                </View>
              </View>

              <View style={styles.txnMathRow}>
                <Text style={styles.mathText}>
                  ₹{txn.pricePerUnit} × {txn.quantity} {txn.unit}
                </Text>
                <Text style={styles.mathEquals}>=</Text>
                <Text style={styles.mathTotal}>₹{txn.totalCost.toFixed(2)}</Text>
              </View>
            </Card>
          ))
        )}

        {/* ── Grand Total Footer ── */}
        {sessionTransactions.length > 0 && (
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
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
  backBtn: {
    marginBottom: spacing.lg,
    padding: spacing.xs,
    alignSelf: 'flex-start',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  shopIconBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  shopHeaderText: {
    flex: 1,
  },
  shopTitle: {
    ...typography.h2,
    color: colors.text,
  },
  sessionDate: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  summaryCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.text,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
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
  txnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  txnItemName: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendLabel: {
    ...typography.smallBold,
  },
  txnMathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  mathText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  mathEquals: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  mathTotal: {
    ...typography.captionBold,
    color: colors.primary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    ...typography.h4,
    color: colors.text,
  },
  grandTotalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
