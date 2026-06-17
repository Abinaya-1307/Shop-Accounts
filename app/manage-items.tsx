import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { API_URL as API } from '@/lib/config';
import { useTheme } from '@/context/ThemeContext';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';

export default function ManageItemsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/items`);
      setItems(data ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Load items error:', msg);
      Alert.alert('Error', `Could not load items: ${msg}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleDelete = (item: any) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    setItemToDelete(null);
    try {
      await axios.delete(`${API}/items/${target.id}`);
      setItems((prev) => prev.filter((i) => i.id !== target.id));
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Delete item error:', msg);
      Alert.alert('Delete Failed', `Could not delete item.\n\nReason: ${msg}`);
    }
  };

  const bg = isDark ? '#0F172A' : colors.background;
  const cardBg = isDark ? '#1E293B' : colors.white;
  const textColor = isDark ? '#F1F5F9' : colors.text;
  const subColor = isDark ? '#94A3B8' : colors.textTertiary;
  const borderColor = isDark ? '#334155' : colors.border;

  return (
    <Container safeArea edges={['top', 'bottom', 'left', 'right']} style={{ backgroundColor: bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1E293B' : colors.backgroundSecondary }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>Manage Items</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="basket-outline" size={64} color={subColor} />
          <Text style={[styles.emptyText, { color: subColor }]}>No items tracked yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadItems(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <Card style={[styles.itemCard, { backgroundColor: cardBg }]}>
              <View style={styles.itemRow}>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? '#312E81' : colors.primaryTint }]}>
                  <Ionicons name="cube-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
                  <Text style={[styles.itemMeta, { color: subColor }]}>
                    {item.unit}
                    {item.last_price ? `  ·  Last ₹${item.last_price}` : ''}
                    {item.category ? `  ·  ${item.category}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      <DeleteConfirmationModal
        visible={itemToDelete !== null}
        title="Delete Item"
        message={`Remove "${itemToDelete?.name}" and all its history? This cannot be undone.`}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
  },
  list: {
    padding: spacing.lg,
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
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyBold,
  },
  itemMeta: {
    ...typography.small,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
