import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Container, Card, Avatar } from '@/components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions, useItems } from '@/hooks/useData';
import { LinearGradient } from 'expo-linear-gradient';
import { useShopContext } from '@/context/ShopContext';

export default function DashboardScreen() {
  const { data: transactions = [], isLoading: txnsLoading } = useTransactions(10);
  const { data: items = [] } = useItems();
  const { getMonthlyTotal, getRecentTransactions } = useShopContext();

  // ── Dynamic date values ─────────────────────────────────────────────────
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthLabel = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }); // "Feb 2026"
  const prevMonthLabel = new Date(prevMonthYear, prevMonth, 1).toLocaleDateString('en-IN', { month: 'short' }); // "Jan"

  const currentMonthTotal = useMemo(
    () => getMonthlyTotal(currentMonth, currentYear),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getMonthlyTotal, transactions]
  );

  const lastMonthTotal = useMemo(
    () => getMonthlyTotal(prevMonth, prevMonthYear),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getMonthlyTotal, transactions]
  );

  const diff = currentMonthTotal - lastMonthTotal;

  const getItemIcon = (itemId: string) => {
    const item = items.find((i: any) => i.id === itemId);
    // Placeholder logic for icons
    if (item?.name.toLowerCase().includes('milk')) return 'water';
    if (item?.name.toLowerCase().includes('sugar')) return 'cube';
    if (item?.name.toLowerCase().includes('oil')) return 'flask';
    return 'basket';
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const itemObj = items.find((i: any) => i.id === item.itemId);
    return (
      <Card style={styles.txnCard}>
        <View style={styles.txnRow}>
          <View style={styles.iconContainer}>
            <Ionicons name={getItemIcon(item.itemId) as any} size={24} color={colors.primary} />
          </View>
          <View style={styles.txnInfo}>
            <Text style={styles.itemName}>{itemObj?.name || 'Item'}</Text>
            <Text style={styles.itemDate}>
              {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.txnAmountContainer}>
            <Text style={styles.txnAmount}>₹ {item.totalCost.toFixed(2)}</Text>
            {item.priceTrend === 'increase' && (
              <Ionicons name="arrow-up" size={12} color={colors.error} />
            )}
            {item.priceTrend === 'decrease' && (
              <Ionicons name="arrow-down" size={12} color={colors.success} />
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <Container safeArea edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.monthSelector}>
            <Text style={styles.monthText}>{currentMonthLabel}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Budget Card */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.budgetCard}
        >
          <Text style={styles.budgetLabel}>Total Spent this Month</Text>
          <Text style={styles.budgetValue}>₹ {currentMonthTotal.toLocaleString()}</Text>
          <View style={styles.budgetFooter}>
            {diff <= 0 ? (
              <View style={styles.trendBadgeSuccess}>
                <Ionicons name="trending-down" size={16} color={colors.success} />
                <Text style={styles.trendTextSuccess}>
                  ₹ {Math.abs(diff).toLocaleString()} less than {prevMonthLabel}
                </Text>
              </View>
            ) : (
              <View style={styles.trendBadgeError}>
                <Ionicons name="trending-up" size={16} color="#FF9A9E" />
                <Text style={styles.trendTextError}>
                  ₹ {diff.toLocaleString()} more than {prevMonthLabel}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="camera" size={24} color="#0EA5E9" />
            </View>
            <Text style={styles.actionLabel}>Scan Bill</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="mic" size={24} color="#10B981" />
            </View>
            <Text style={styles.actionLabel}>Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="calculator" size={24} color="#EF4444" />
            </View>
            <Text style={styles.actionLabel}>Calculator</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Purchases</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No purchases yet. Tap (+) to add one!</Text>
          </Card>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthText: {
    ...typography.bodyBold,
    marginRight: spacing.xs,
  },
  settingsIcon: {
    padding: spacing.sm,
  },
  budgetCard: {
    height: 160,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  budgetLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  budgetValue: {
    ...typography.display,
    color: colors.white,
    fontSize: 36,
  },
  budgetFooter: {
    marginTop: spacing.sm,
  },
  trendBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  trendTextSuccess: {
    ...typography.smallBold,
    color: colors.successTint,
    marginLeft: 4,
  },
  trendBadgeError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  trendTextError: {
    ...typography.smallBold,
    color: '#FFD1D3',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  seeAllText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  txnCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  txnInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  itemDate: {
    ...typography.small,
    color: colors.textTertiary,
  },
  txnAmountContainer: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    ...typography.bodyBold,
    color: colors.text,
  },
  emptyCard: {
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
