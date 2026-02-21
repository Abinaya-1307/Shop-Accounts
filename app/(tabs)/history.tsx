import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Container, Card, Input } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useItems, useTransactions } from '@/hooks/useData';

export default function HistoryScreen() {
  const { data: items = [], isLoading: itemsLoading } = useItems();
  const { data: transactions = [] } = useTransactions(100);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Grocery', 'Vegetables', 'Dairy'];

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      // For now, filtering logic is simple. In a real app, items would have categories.
      return matchesSearch;
    });
  }, [items, search]);

  const renderItem = ({ item }: { item: any }) => {
    const itemTransactions = transactions.filter((t: any) => t.itemId === item.id);
    const trend = itemTransactions.length > 1 ? itemTransactions[0].priceTrend : 'stable';

    return (
      <Card style={styles.itemCard} onPress={() => {}}>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemMeta}>Last: ₹{item.lastPrice} / {item.unit}</Text>
          </View>
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend === 'increase' ? 'trending-up' : trend === 'decrease' ? 'trending-down' : 'remove'}
              size={24}
              color={trend === 'increase' ? colors.error : trend === 'decrease' ? colors.success : colors.textTertiary}
            />
            <Text style={[
              styles.trendText,
              { color: trend === 'increase' ? colors.error : trend === 'decrease' ? colors.success : colors.textTertiary }
            ]}>
              {trend === 'increase' ? 'Rising' : trend === 'decrease' ? 'Falling' : 'Stable'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
    );
  };

  return (
    <Container safeArea padding="lg">
      <Text style={styles.title}>Item History</Text>
      
      {/* Search & Filter */}
      <View style={styles.searchSection}>
        <Input
          placeholder="Find item..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Ionicons name="search" size={20} color={colors.textTertiary} />}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filter === cat && styles.filterChipActive]}
              onPress={() => setFilter(cat)}
            >
              <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>Start adding items to see their price trends over time.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  searchSection: {
    marginBottom: spacing.lg,
  },
  filterScroll: {
    marginTop: spacing.sm,
  },
  filterContainer: {
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
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
