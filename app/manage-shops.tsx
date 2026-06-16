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

export default function ManageShopsScreen() {
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadShops = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/shops`);
      setShops(data ?? []);
    } catch (err) {
      console.error('Load shops error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadShops(); }, [loadShops]);

  const handleDelete = (shop: any) => {
    Alert.alert(
      'Delete Shop',
      `Remove "${shop.name}"? This will not delete existing purchase records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API}/shops/${shop.id}`);
              setShops((prev) => prev.filter((s) => s.id !== shop.id));
            } catch {
              Alert.alert('Error', 'Could not delete shop. Try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Container safeArea edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Shops</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : shops.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={64} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No shops recorded yet.</Text>
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
            <Card style={styles.shopCard}>
              <View style={styles.shopRow}>
                <View style={styles.iconBadge}>
                  <Ionicons name="storefront-outline" size={22} color="#0EA5E9" />
                </View>
                <Text style={styles.shopName}>{shop.name}</Text>
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
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textTertiary,
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  shopName: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
});
