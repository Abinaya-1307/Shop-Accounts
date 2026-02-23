import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL as API } from '@/lib/config';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getItemIcon = (name: string): any => {
  const n = name.toLowerCase();
  if (n.includes('milk'))  return 'water';
  if (n.includes('sugar')) return 'cube';
  if (n.includes('oil'))   return 'flask';
  if (n.includes('rice'))  return 'nutrition';
  if (n.includes('dal') || n.includes('dhal')) return 'leaf';
  return 'basket';
};

// Build the last 13 months for the picker
function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ month: d.getMonth(), year: d.getFullYear() });
  }
  return options;
}

export default function DashboardScreen() {
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const prevMonth     = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevMonthYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  const prevMonthLabel     = MONTH_NAMES[prevMonth];

  const [currentMonthTotal, setCurrentMonthTotal]   = useState(0);
  const [prevMonthTotal, setPrevMonthTotal]         = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/dashboard`, {
        params: { month: selectedMonth, year: selectedYear },
      });
      setCurrentMonthTotal(data.currentMonthTotal ?? 0);
      setPrevMonthTotal(data.prevMonthTotal ?? 0);
      setRecentTransactions(data.recentTransactions ?? []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const diff = currentMonthTotal - prevMonthTotal;
  const monthOptions = buildMonthOptions();

  const renderTransaction = ({ item }: { item: any }) => (
    <Card style={styles.txnCard}>
      <View style={styles.txnRow}>
        <View style={styles.iconContainer}>
          <Ionicons name={getItemIcon(item.item_name)} size={24} color={colors.primary} />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <Text style={styles.itemDate}>
            {new Date(item.date).toLocaleDateString('en-IN')} ·{' '}
            {new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            {item.shop_name ? `  ·  ${item.shop_name}` : ''}
          </Text>
        </View>
        <View style={styles.txnAmountContainer}>
          <Text style={styles.txnAmount}>₹ {item.total_cost.toFixed(2)}</Text>
          {item.price_trend === 'increase' && (
            <Ionicons name="arrow-up" size={12} color={colors.error} />
          )}
          {item.price_trend === 'decrease' && (
            <Ionicons name="arrow-down" size={12} color={colors.success} />
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <Container safeArea edges={['top']}>
      {/* ── Month Picker Modal ── */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.monthPickerCard}>
            <Text style={styles.monthPickerTitle}>Select Month</Text>
            {monthOptions.map((opt) => {
              const isSelected = opt.month === selectedMonth && opt.year === selectedYear;
              return (
                <TouchableOpacity
                  key={`${opt.year}-${opt.month}`}
                  style={[styles.monthOption, isSelected && styles.monthOptionActive]}
                  onPress={() => {
                    setSelectedMonth(opt.month);
                    setSelectedYear(opt.year);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[styles.monthOptionText, isSelected && styles.monthOptionTextActive]}>
                    {MONTH_NAMES[opt.month]} {opt.year}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={styles.monthText}>{selectedMonthLabel}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshIcon} onPress={() => loadDashboard(true)}>
            <Ionicons name="refresh-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* ── Budget Card ── */}
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.budgetCard}
            >
              <Text style={styles.budgetLabel}>Total Spent — {selectedMonthLabel}</Text>
              <Text style={styles.budgetValue}>
                ₹ {currentMonthTotal.toLocaleString('en-IN')}
              </Text>
              <View style={styles.budgetFooter}>
                {diff <= 0 ? (
                  <View style={styles.trendBadgeSuccess}>
                    <Ionicons name="trending-down" size={16} color={colors.success} />
                    <Text style={styles.trendTextSuccess}>
                      ₹{Math.abs(diff).toLocaleString('en-IN')} less than {prevMonthLabel}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.trendBadgeError}>
                    <Ionicons name="trending-up" size={16} color="#FF9A9E" />
                    <Text style={styles.trendTextError}>
                      ₹{diff.toLocaleString('en-IN')} more than {prevMonthLabel}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* ── Quick Actions ── */}
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

            {/* ── Recent Transactions ── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Purchases</Text>
            </View>

            {recentTransactions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No purchases for this month.</Text>
              </Card>
            ) : (
              <FlatList
                data={recentTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </>
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
  refreshIcon: {
    padding: spacing.sm,
  },
  budgetCard: {
    height: 160,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
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
  /* ── Month Picker Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingHorizontal: spacing.lg,
  },
  monthPickerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: 420,
  },
  monthPickerTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  monthOptionActive: {
    backgroundColor: colors.primaryTint,
  },
  monthOptionText: {
    ...typography.body,
    color: colors.text,
  },
  monthOptionTextActive: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
