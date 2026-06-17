import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Container, Input, Button } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useShopContext } from '@/context/ShopContext';
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useData';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL as API } from '@/lib/config';
import { DeleteConfirmationModal } from '@/components/DeleteConfirmationModal';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, isLoading: isContextLoading } = useShopContext();
  const updateTxn = useUpdateTransaction();
  const deleteTxn = useDeleteTransaction();

  const [txn, setTxn] = useState<any>(null);
  const [isTxnLoading, setIsTxnLoading] = useState(true);

  // Load original transaction
  useEffect(() => {
    if (!id) return;
    
    // Check if it's already in the local context
    const foundTxn = transactions.find((t) => t.id === id);
    if (foundTxn) {
      setTxn(foundTxn);
      setIsTxnLoading(false);
    } else {
      // Fetch from backend API
      setIsTxnLoading(true);
      axios.get(`${API}/transactions/${id}`)
        .then((res) => {
          setTxn(res.data);
        })
        .catch((err) => {
          console.error('[edit-transaction] Failed to fetch txn:', err);
          Alert.alert('Error', 'Failed to load transaction details.');
        })
        .finally(() => {
          setIsTxnLoading(false);
        });
    }
  }, [id, transactions]);

  const [itemName, setItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  const [pricePerUnit, setPricePerUnit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('kg');

  const [shopName, setShopName] = useState('');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);

  const [date, setDate] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [allItems, setAllItems] = useState<any[]>([]);
  const [allShops, setAllShops] = useState<any[]>([]);

  // ── Preload full item + shop lists on mount ───────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/items/all`).catch(() => ({ data: [] })),
      axios.get(`${API}/shops/all`).catch(() => ({ data: [] })),
    ]).then(([itemsRes, shopsRes]) => {
      setAllItems(itemsRes.data ?? []);
      setAllShops(shopsRes.data ?? []);
    });
  }, []);

  // Prepopulate form values once transaction is loaded
  useEffect(() => {
    if (txn) {
      setItemName(txn.itemName);
      setPricePerUnit(String(txn.pricePerUnit));
      setQuantity(String(txn.quantity));
      setUnit(txn.unit);
      setShopName(txn.shopName || '');
      setDate(txn.date.split('T')[0]);

      // Attempt to resolve selectedItem in suggestions list
      if (allItems.length > 0) {
        const matchingItem = allItems.find((i) => i.id === txn.itemId);
        if (matchingItem) {
          setSelectedItem(matchingItem);
        }
      }
      if (allShops.length > 0 && txn.shopId) {
        const matchingShop = allShops.find((s) => s.id === txn.shopId);
        if (matchingShop) {
          setSelectedShop(matchingShop);
        }
      }
    }
  }, [txn, allItems, allShops]);

  // ── Instant in-memory filtering (no debounce, no network) ─────────────────
  const itemSuggestions = useMemo(() => {
    if (!itemName || itemName.length < 1) return [];
    const q = itemName.toLowerCase();
    const prefix   = allItems.filter(i => i.name.toLowerCase().startsWith(q));
    const contains = allItems.filter(i => !i.name.toLowerCase().startsWith(q) && i.name.toLowerCase().includes(q));
    return [...prefix, ...contains].slice(0, 10);
  }, [itemName, allItems]);

  const shopSuggestions = useMemo(() => {
    if (!shopName || shopName.length < 1) return [];
    const q = shopName.toLowerCase();
    const prefix   = allShops.filter(s => s.name.toLowerCase().startsWith(q));
    const contains = allShops.filter(s => !s.name.toLowerCase().startsWith(q) && s.name.toLowerCase().includes(q));
    return [...prefix, ...contains].slice(0, 10);
  }, [shopName, allShops]);

  const totalCost = useMemo(() => {
    const p = parseFloat(pricePerUnit) || 0;
    const q = parseFloat(quantity) || 0;
    return (p * q).toFixed(2);
  }, [pricePerUnit, quantity]);

  const priceDiff = useMemo(() => {
    if (!selectedItem || !pricePerUnit) return null;
    const current = parseFloat(pricePerUnit);
    const last = selectedItem.last_price;
    if (!last || last === current) return null;
    return current - last;
  }, [selectedItem, pricePerUnit]);

  const handleSave = async () => {
    if (!itemName || !pricePerUnit || !quantity || !date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const parsedDate = date.includes('T') ? date : `${date}T12:00:00.000Z`;

    const payload = {
      date: parsedDate,
      itemName,
      shopName: shopName || null,
      pricePerUnit: parseFloat(pricePerUnit),
      quantity: parseFloat(quantity),
      totalCost: parseFloat(totalCost),
      unit,
    };

    setIsSaving(true);
    try {
      // 1. Update backend
      await axios.put(`${API}/transactions/${id}`, payload);

      // 2. Update local state context
      await updateTxn.mutateAsync(id!, {
        ...payload,
        item: selectedItem
          ? { id: selectedItem.id, name: selectedItem.name }
          : { name: itemName },
        shop: selectedShop
          ? { id: selectedShop.id, name: selectedShop.name }
          : shopName ? { name: shopName } : undefined,
      });

      router.back();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      Alert.alert('Error', 'Failed to update transaction. Is the server running?');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    try {
      // 1. Delete on backend
      await axios.delete(`${API}/transactions/${id}`);

      // 2. Delete locally
      await deleteTxn.mutateAsync(id!);

      router.back();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction.');
    } finally {
      setIsDeleting(false);
    }
  };

  const UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'nos'];

  if (isContextLoading || isTxnLoading || !txn) {
    return (
      <Container safeArea padding="lg" style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </Container>
    );
  }

  return (
    <Container safeArea padding="lg">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Purchase</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving || isDeleting}>
          <Text style={[styles.saveText, (isSaving || isDeleting) && { opacity: 0.4 }]}>Save</Text>
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

        {/* ── Shop Name ── */}
        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Shop Name</Text>
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
                }}
              >
                <Text style={styles.suggestionText}>{shop.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Date Input ── */}
        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Purchase Date (YYYY-MM-DD)</Text>
        <Input
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.textTertiary} />}
        />

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
          disabled={isSaving || isDeleting}
        >
          Save Changes
        </Button>

        {/* ── Delete Button ── */}
        <TouchableOpacity
          onPress={() => setShowDeleteModal(true)}
          style={styles.deleteButton}
          disabled={isSaving || isDeleting}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete Purchase</Text>
        </TouchableOpacity>
      </ScrollView>

      <DeleteConfirmationModal
        visible={showDeleteModal}
        title="Delete Purchase"
        message="Are you sure you want to remove this purchase record? This will update chronological trends and item statistics."
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    padding: spacing.xs,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
  },
  deleteButtonText: {
    ...typography.bodyBold,
    color: colors.error,
  },
});
