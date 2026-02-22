import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Container, Card, Button } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/hooks/useData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReportsScreen() {
  const { data: transactions = [] } = useTransactions(100);

  const daysInMonth = Array.from({ length: 28 }, (_, i) => i + 1); // Feb 2026 simplified

  const dailyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    transactions.forEach((t: any) => {
      const day = new Date(t.date).getDate();
      totals[day] = (totals[day] || 0) + t.totalCost;
    });
    return totals;
  }, [transactions]);

  const topExpenses = useMemo(() => {
    // Group by item name using the denormalized itemName field
    const itemTotals: Record<string, number> = {};
    transactions.forEach((t: any) => {
      const label = t.itemName || t.itemId;
      itemTotals[label] = (itemTotals[label] || 0) + t.totalCost;
    });
    return Object.entries(itemTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [transactions]);

  return (
    <Container safeArea padding="lg">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Digital Diary</Text>
          <Button variant="outline" size="sm" leftIcon={<Ionicons name="share-social" size={18} />}>
            Export
          </Button>
        </View>

        {/* Calendar Widget Simplified */}
        <Card style={styles.calendarCard}>
          <Text style={styles.calendarMonth}>February 2026</Text>
          <View style={styles.calendarGrid}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={styles.calendarDayHeader}>{d}</Text>
            ))}
            {/* Simplified 1-28 grid */}
            {daysInMonth.map((day) => (
              <TouchableOpacity key={day} style={styles.calendarDay}>
                <Text style={styles.dayText}>{day}</Text>
                {dailyTotals[day] && <View style={styles.dot} />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Monthly Breakdown */}
        <Text style={styles.sectionTitle}>Top Expenses</Text>
        <Card style={styles.expenseCard}>
          {topExpenses.length === 0 ? (
            <Text style={styles.emptyText}>No data for this month yet.</Text>
          ) : (
            topExpenses.map(([id, total], index) => (
              <View key={id} style={[styles.expenseRow, index === topExpenses.length - 1 && styles.lastRow]}>
                <View style={styles.expenseLabelContainer}>
                  <View style={[styles.colorIndicator, { backgroundColor: colors.primary }]} />
                  <Text style={styles.expenseLabel}>{id}</Text>
                </View>
                <Text style={styles.expenseValue}>₹ {total.toFixed(2)}</Text>
              </View>
            ))
          )}
        </Card>

        <TouchableOpacity style={styles.whatsappButton}>
          <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
          <Text style={styles.whatsappText}>Share Summary on WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
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
  calendarCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  calendarMonth: {
    ...typography.bodyBold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDayHeader: {
    width: (SCREEN_WIDTH - spacing.lg * 4) / 7,
    textAlign: 'center',
    ...typography.tiny,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  calendarDay: {
    width: (SCREEN_WIDTH - spacing.lg * 4) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    ...typography.caption,
    color: colors.text,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  expenseCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  expenseLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  expenseLabel: {
    ...typography.body,
    color: colors.text,
  },
  expenseValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  whatsappText: {
    ...typography.bodyBold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
