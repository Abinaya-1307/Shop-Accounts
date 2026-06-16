import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Modal,
  RefreshControl,
} from 'react-native';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { API_URL as API } from '@/lib/config';
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const EXPENSE_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444'];
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function ReportsScreen() {
  const now = new Date();
  const [month, setMonth]       = useState(now.getMonth());
  const [year, setYear]         = useState(now.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [transactions, setTransactions]   = useState<any[]>([]);
  const [dailyTotals, setDailyTotals]     = useState<Record<number, number>>({});
  const [topExpenses, setTopExpenses]     = useState<{ name: string; total: number }[]>([]);
  const [monthTotal, setMonthTotal]       = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [isRefreshing, setIsRefreshing]   = useState(false);

  const [selectedDay, setSelectedDay]     = useState<number | null>(null);
  const [showDayModal, setShowDayModal]   = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/reports`, { params: { month, year } });
      setTransactions(data.transactions ?? []);
      setDailyTotals(data.dailyTotals ?? {});
      setTopExpenses(data.topExpenses ?? []);
      setMonthTotal(data.monthTotal ?? 0);
    } catch (err) {
      console.error('Reports load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  // ─── Calendar helpers ────────────────────────────────────────────────────
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstWeekday  = new Date(year, month, 1).getDay(); // 0=Sun

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);   // leading blanks
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // pad to multiple of 7
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstWeekday, daysInMonth]);

  const dayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return transactions.filter(
      (t: any) => new Date(t.date).getDate() === selectedDay
    );
  }, [selectedDay, transactions]);

  const totalForDay = useMemo(
    () => dayTransactions.reduce((s: number, t: any) => s + t.total_cost, 0),
    [dayTransactions]
  );

  const maxDaySpend = useMemo(
    () => Math.max(0, ...Object.values(dailyTotals).map(Number)),
    [dailyTotals]
  );

  // ─── Month nav ────────────────────────────────────────────────────────────
  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ─── WhatsApp share ───────────────────────────────────────────────────────
  const handleShare = async () => {
    if (transactions.length === 0) return;
    const lines = topExpenses.map(
      (e, i) => `${i + 1}. ${e.name} — ₹${e.total.toFixed(2)}`
    );
    const message = [
      `🛒 Shop Diary — ${MONTH_NAMES[month]} ${year}`,
      `💰 Total Spent: ₹${monthTotal.toFixed(2)}`,
      '',
      '📊 Top Expenses:',
      ...lines,
    ].join('\n');
    await Share.share({ message });
  };

  // ─── Month picker options ─────────────────────────────────────────────────
  const monthOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i < 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({ month: d.getMonth(), year: d.getFullYear() });
    }
    return opts;
  }, []);

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
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {monthOptions.map((opt) => {
                const isActive = opt.month === month && opt.year === year;
                return (
                  <TouchableOpacity
                    key={`${opt.year}-${opt.month}`}
                    style={[styles.pickerOption, isActive && styles.pickerOptionActive]}
                    onPress={() => {
                      setMonth(opt.month);
                      setYear(opt.year);
                      setSelectedDay(null);
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, isActive && styles.pickerOptionTextActive]}>
                      {MONTH_NAMES[opt.month]} {opt.year}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Day Detail Modal ── */}
      <Modal
        visible={showDayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDayModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDayModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dayModalCard}>
            {/* Header */}
            <View style={styles.dayModalHeader}>
              <View>
                <Text style={styles.dayModalTitle}>
                  {selectedDay} {MONTH_SHORT[month]} {year}
                </Text>
                <Text style={styles.dayModalTotal}>
                  Total: ₹{totalForDay.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDayModal(false)}>
                <Ionicons name="close-circle" size={26} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {dayTransactions.length === 0 ? (
                <Text style={styles.emptyText}>No purchases on this day.</Text>
              ) : (
                dayTransactions.map((t: any) => (
                  <View key={t.id} style={styles.dayTxnRow}>
                    <View style={styles.dayTxnDot} />
                    <View style={styles.dayTxnInfo}>
                      <Text style={styles.dayTxnName}>{t.item_name}</Text>
                      <Text style={styles.dayTxnMeta}>
                        ₹{t.price_per_unit} × {t.quantity} {t.unit}
                        {t.shop_name ? `  ·  ${t.shop_name}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.dayTxnTotal}>₹{t.total_cost.toFixed(2)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
      >
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.title}>Digital Diary</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={18} color={colors.primary} />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Month Navigator ─── */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.monthLabel}>
            <Text style={styles.monthLabelText}>{MONTH_NAMES[month]} {year}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* ─── Month Total Pill ─── */}
            <View style={styles.monthTotalRow}>
              <View style={styles.monthTotalPill}>
                <Ionicons name="wallet-outline" size={16} color={colors.primary} />
                <Text style={styles.monthTotalText}>
                  {transactions.length} purchases  ·  ₹{monthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* ─── Calendar ─── */}
            <Card style={styles.calendarCard}>
              {/* Day Headers */}
              <View style={styles.calRow}>
                {DAY_HEADERS.map((d) => (
                  <View key={d} style={styles.calCell}>
                    <Text style={styles.calHeader}>{d}</Text>
                  </View>
                ))}
              </View>

              {/* Day cells in rows of 7 */}
              {Array.from({ length: calendarCells.length / 7 }, (_, rowIdx) => (
                <View key={rowIdx} style={styles.calRow}>
                  {calendarCells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                    if (!day) {
                      return <View key={`empty-${rowIdx}-${colIdx}`} style={styles.calCell} />;
                    }
                    const spend = dailyTotals[day] ?? 0;
                    const isToday =
                      day === now.getDate() &&
                      month === now.getMonth() &&
                      year === now.getFullYear();
                    const isSelected = day === selectedDay;
                    const intensity = maxDaySpend > 0 ? spend / maxDaySpend : 0;

                    return (
                      <TouchableOpacity
                        key={day}
                        style={styles.calCell}
                        onPress={() => {
                          setSelectedDay(day);
                          if (spend > 0) setShowDayModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.calDayInner,
                          isSelected && styles.calDaySelected,
                          isToday && !isSelected && styles.calDayToday,
                          spend > 0 && !isSelected && {
                            backgroundColor: `rgba(99,102,241,${0.1 + intensity * 0.5})`,
                          },
                        ]}>
                          <Text style={[
                            styles.calDayText,
                            isSelected && styles.calDayTextSelected,
                            isToday && !isSelected && styles.calDayTextToday,
                            spend > 0 && !isSelected && !isToday && styles.calDayTextSpend,
                          ]}>
                            {day}
                          </Text>
                          {spend > 0 && (
                            <View style={[
                              styles.calDot,
                              isSelected && { backgroundColor: colors.white },
                            ]} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: 'rgba(99,102,241,0.15)' }]} />
                  <Text style={styles.legendText}>Low spend</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { backgroundColor: 'rgba(99,102,241,0.6)' }]} />
                  <Text style={styles.legendText}>High spend</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.calDot, { position: 'relative', top: 0, left: 0 }]} />
                  <Text style={styles.legendText}>Has entries</Text>
                </View>
              </View>
            </Card>

            {/* ─── Top Expenses ─── */}
            <Text style={styles.sectionTitle}>Top Expenses</Text>
            <Card style={styles.expenseCard}>
              {topExpenses.length === 0 ? (
                <Text style={styles.emptyText}>No purchases this month yet.</Text>
              ) : (
                topExpenses.map((exp, idx) => {
                  const pct = monthTotal > 0 ? (exp.total / monthTotal) * 100 : 0;
                  return (
                    <View key={exp.name} style={[styles.expenseRow, idx === topExpenses.length - 1 && styles.lastRow]}>
                      <View style={styles.expenseTop}>
                        <View style={styles.expenseLabelRow}>
                          <View style={[styles.dot, { backgroundColor: EXPENSE_COLORS[idx % 5] }]} />
                          <Text style={styles.expenseLabel} numberOfLines={1}>{exp.name}</Text>
                        </View>
                        <Text style={styles.expenseValue}>₹{exp.total.toFixed(2)}</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.barFill, {
                            width: `${pct}%`,
                            backgroundColor: EXPENSE_COLORS[idx % 5],
                          }]}
                        />
                      </View>
                      <Text style={styles.expensePct}>{pct.toFixed(1)}% of total</Text>
                    </View>
                  );
                })
              )}
            </Card>

            {/* ─── WhatsApp Button ─── */}
            <TouchableOpacity
              style={[styles.whatsappButton, transactions.length === 0 && { opacity: 0.5 }]}
              onPress={handleShare}
              disabled={transactions.length === 0}
            >
              <Ionicons name="logo-whatsapp" size={22} color={colors.white} />
              <Text style={styles.whatsappText}>Share Summary on WhatsApp</Text>
            </TouchableOpacity>
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
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  shareBtnText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  // ── Month Nav ─────────────────────────────────────────────────────────────
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  monthLabelText: {
    ...typography.h3,
    color: colors.text,
  },
  // ── Month Total ───────────────────────────────────────────────────────────
  monthTotalRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  monthTotalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  monthTotalText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  // ── Calendar ──────────────────────────────────────────────────────────────
  calendarCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  calRow: {
    flexDirection: 'row',
  },
  calCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calHeader: {
    ...typography.tiny,
    color: colors.textTertiary,
    fontWeight: '700',
    textAlign: 'center',
  },
  calDayInner: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calDayToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  calDaySelected: {
    backgroundColor: colors.primary,
  },
  calDayText: {
    ...typography.tiny,
    color: colors.text,
    fontWeight: '500',
  },
  calDayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  calDayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  calDayTextSpend: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  calDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  // ── Section ───────────────────────────────────────────────────────────────
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  centered: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Expenses ──────────────────────────────────────────────────────────────
  expenseCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  expenseRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  expenseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  expenseLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  expenseLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  expenseValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  expensePct: {
    ...typography.tiny,
    color: colors.textTertiary,
  },
  // ── WhatsApp ──────────────────────────────────────────────────────────────
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  whatsappText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '60%',
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  pickerOptionActive: {
    backgroundColor: colors.primaryTint,
  },
  pickerOptionText: {
    ...typography.body,
    color: colors.text,
  },
  pickerOptionTextActive: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  dayModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  dayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayModalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  dayModalTotal: {
    ...typography.captionBold,
    color: colors.primary,
    marginTop: 2,
  },
  dayTxnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  dayTxnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  dayTxnInfo: {
    flex: 1,
  },
  dayTxnName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  dayTxnMeta: {
    ...typography.small,
    color: colors.textTertiary,
  },
  dayTxnTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

