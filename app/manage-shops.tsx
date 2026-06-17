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

export default function ManageShopsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<any | null>(null);

  const loadShops = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/shops`);
      setShops(data ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Load shops error:', msg);
      Alert.alert('Error', `Could not load shops: ${msg}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);

  const handleDelete = (shop: any) => {
    setShopToDelete(shop);
  };

  const handleConfirmDelete = async () => {
    if (!shopToDelete) return;
    const target = shopToDelete;
    setShopToDelete(null);
    try {
      await axios.delete(`${API}/shops/${target.id}`);
      setShops((prev) => prev.filter((s) => s.id !== target.id));
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Delete shop error:', msg);
      Alert.alert('Delete Failed', `Could not delete shop.\n\nReason: ${msg}`);
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
        <Text style={[styles.title, { color: textColor }]}>Manage Shops</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : shops.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={64} color={subColor} />
          <Text style={[styles.emptyText, { color: subColor }]}>No shops recorded yet.</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(shop) => shop.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadShops(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item: shop }) => (
            <Card style={[styles.shopCard, { backgroundColor: cardBg }]}>
              <View style={styles.shopRow}>
                <View style={[styles.iconBadge, { backgroundColor: isDark ? '#0C4A6E' : '#EFF6FF' }]}>
                  <Ionicons name="storefront-outline" size={22} color="#0EA5E9" />
                </View>
                <Text style={[styles.shopName, { color: textColor }]}>{shop.name}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(shop)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      <DeleteConfirmationModal
        visible={shopToDelete !== null}
        title="Delete Shop"
        message={`Remove "${shopToDelete?.name}"? This will delete existing purchase records.`}
        onCancel={() => setShopToDelete(null)}
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
  shopCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  shopRow: {
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
  shopName: {
    ...typography.bodyBold,
    flex: 1,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
