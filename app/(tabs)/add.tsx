import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Container, Input, Button } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useCreateTransaction } from '@/hooks/useData';
import { useRouter } from 'expo-router';
import { API_URL as API } from '@/lib/config';

export default function AddScreen() {
  const router = useRouter();
  const createTxn = useCreateTransaction();

  const [itemName, setItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  const [pricePerUnit, setPricePerUnit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('kg');

  const [shopName, setShopName] = useState('');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [shopSuggestions, setShopSuggestions] = useState<any[]>([]);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Debounced item search
  const itemDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!itemName || itemName.length < 1) {
      setItemSuggestions([]);
      return;
    }
    if (itemDebounce.current) clearTimeout(itemDebounce.current);
    itemDebounce.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/items/search`, { params: { q: itemName } });
        setItemSuggestions(data);
      } catch {
        setItemSuggestions([]);
      }
    }, 300);
    return () => { if (itemDebounce.current) clearTimeout(itemDebounce.current); };
  }, [itemName]);

  // Debounced shop search
  const shopDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!shopName || shopName.length < 1) {
      setShopSuggestions([]);
      return;
    }
    if (shopDebounce.current) clearTimeout(shopDebounce.current);
    shopDebounce.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/shops/search`, { params: { q: shopName } });
        setShopSuggestions(data);
      } catch {
        setShopSuggestions([]);
      }
    }, 300);
    return () => { if (shopDebounce.current) clearTimeout(shopDebounce.current); };
  }, [shopName]);

  const totalCost = useMemo(() => {
    const p = parseFloat(pricePerUnit) || 0;
    const q = parseFloat(quantity) || 0;
    return (p * q).toFixed(2);
  }, [pricePerUnit, quantity]);

  const priceDiff = useMemo(() => {
    if (!selectedItem || !pricePerUnit) return null;
    const current = parseFloat(pricePerUnit);
    const last = selectedItem.last_price;
    if (!last) return null;
    return current - last;
  }, [selectedItem, pricePerUnit]);

  const handleSave = async () => {
    if (!itemName || !pricePerUnit || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const priceTrend: 'stable' | 'increase' | 'decrease' = !priceDiff ? 'stable' : priceDiff > 0 ? 'increase' : 'decrease';
    const payload = {
      id: `txn_${Date.now()}`,
      date: new Date().toISOString(),
      item: selectedItem
        ? { id: selectedItem.id, name: selectedItem.name }
        : { name: itemName },
      shop: selectedShop
        ? { id: selectedShop.id, name: selectedShop.name }
        : shopName ? { name: shopName } : null,
      pricePerUnit: parseFloat(pricePerUnit),
      quantity: parseFloat(quantity),
      totalCost: parseFloat(totalCost),
      unit,
      priceTrend,
    };

    setIsSaving(true);
    try {
      await axios.post(`${API}/new`, payload);

      // Keep local context in sync so History/Reports tabs stay updated
      await createTxn.mutateAsync({
        ...payload,
        item: payload.item,
        shop: payload.shop ?? undefined,
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Error', 'Failed to save purchase. Is the server running?');
    } finally {
      setIsSaving(false);
    }
  };

  const UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'nos'];

  return (
    <Container safeArea padding="lg">
      <View style={styles.header}>
        <Text style={styles.title}>New Purchase</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveText, isSaving && { opacity: 0.4 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Item Search ── */}
        <Text style={styles.fieldLabel}>Item Name</Text>
        <Input
          placeholder="Search for an item (e.g. Sugar)"
          value={itemName}
          onChangeText={(text) => {
            setItemName(text);
            setShowItemSuggestions(true);
            setSelectedItem(null);
          }}
          onFocus={() => setShowItemSuggestions(true)}
          leftIcon={<Ionicons name="search-outline" size={20} color={colors.textTertiary} />}
        />
        {showItemSuggestions && itemSuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {itemSuggestions.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setSelectedItem(item);
                  setItemName(item.name);
                  setUnit(item.unit || 'kg');
                  setShowItemSuggestions(false);
                  setItemSuggestions([]);
                }}
              >
                <Text style={styles.suggestionText}>{item.name}</Text>
                {item.last_price && (
                  <Text style={styles.suggestionPrice}>Last: ₹{item.last_price}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Price Context Widget ── */}
        {selectedItem && (
          <View style={styles.contextWidget}>
            <View style={styles.contextRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.contextTitle}>Price Context</Text>
            </View>
            <Text style={styles.contextText}>
              Last Purchase: <Text style={styles.boldText}>₹{selectedItem.last_price}</Text>
              {selectedItem.last_purchased_date && (
                <Text> (on {new Date(selectedItem.last_purchased_date).toLocaleDateString()})</Text>
              )}
            </Text>
          </View>
        )}

        {/* ── Rate & Quantity in a row ── */}
        <View style={styles.row}>
          <View style={{ flex: 2, marginRight: spacing.sm }}>
            <Text style={styles.fieldLabel}>Rate per Unit (₹)</Text>
            <Input
              placeholder="0.00"
              value={pricePerUnit}
              onChangeText={setPricePerUnit}
              keyboardType="decimal-pad"
            />
            {priceDiff !== null && priceDiff !== 0 && (
              <View style={styles.trendIndicator}>
                <Ionicons
                  name={priceDiff > 0 ? 'arrow-up' : 'arrow-down'}
                  size={14}
                  color={priceDiff > 0 ? colors.error : colors.success}
                />
                <Text style={[styles.trendText, { color: priceDiff > 0 ? colors.error : colors.success }]}>
                  {priceDiff > 0 ? '+' : ''}₹{Math.abs(priceDiff).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Qty</Text>
            <Input
              placeholder="1"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* ── Unit Pills ── */}
        <Text style={styles.fieldLabel}>Unit</Text>
        <View style={styles.unitRow}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u}
              style={[styles.unitPill, unit === u && styles.unitPillActive]}
              onPress={() => setUnit(u)}
            >
              <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Shop Name (full width, below other fields) ── */}
        <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Shop Name</Text>
        <Input
          placeholder="e.g. Siva Traders"
          value={shopName}
          onChangeText={(text) => {
            setShopName(text);
            setShowShopSuggestions(true);
            setSelectedShop(null);
          }}
          onFocus={() => setShowShopSuggestions(true)}
          leftIcon={<Ionicons name="storefront-outline" size={20} color={colors.textTertiary} />}
        />
        {showShopSuggestions && shopSuggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {shopSuggestions.map((shop: any) => (
              <TouchableOpacity
                key={shop.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setSelectedShop(shop);
                  setShopName(shop.name);
                  setShowShopSuggestions(false);
                  setShopSuggestions([]);
                }}
              >
                <Text style={styles.suggestionText}>{shop.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Total Display ── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Purchase Value</Text>
          <Text style={styles.totalValue}>₹ {totalCost}</Text>
        </View>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSave}
          loading={isSaving}
        >
          Add Item to Diary
        </Button>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
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
  saveText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  suggestionsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
  },
  suggestionPrice: {
    ...typography.small,
    color: colors.textTertiary,
  },
  contextWidget: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  contextTitle: {
    ...typography.captionBold,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  contextText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  boldText: {
    ...typography.bodyBold,
    color: colors.text,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginLeft: spacing.xs,
  },
  trendText: {
    ...typography.smallBold,
    marginLeft: 2,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: 4,
  },
  unitPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  unitPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  unitPillText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  unitPillTextActive: {
    color: colors.primary,
  },
  totalCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  totalValue: {
    ...typography.display,
    color: colors.primary,
    fontSize: 32,
  },
});
