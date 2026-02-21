import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import { Container, Input, Button, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius, shadows, touchTargets } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { useItems, useShops, useCreateTransaction } from '@/hooks/useData';
import { useRouter } from 'expo-router';

export default function AddScreen() {
  const router = useRouter();
  const { data: items = [] } = useItems();
  const { data: shops = [] } = useShops();
  const createTxn = useCreateTransaction();

  const [itemName, setItemName] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('kg');
  const [shopName, setShopName] = useState('');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const [showShopSuggestions, setShowShopSuggestions] = useState(false);

  const filteredItems = useMemo(() => {
    if (!itemName) return [];
    return items.filter((item: any) =>
      item.name.toLowerCase().includes(itemName.toLowerCase())
    );
  }, [itemName, items]);

  const filteredShops = useMemo(() => {
    if (!shopName) return [];
    return shops.filter((shop: any) =>
      shop.name.toLowerCase().includes(shopName.toLowerCase())
    );
  }, [shopName, shops]);

  const totalCost = useMemo(() => {
    const p = parseFloat(pricePerUnit) || 0;
    const q = parseFloat(quantity) || 0;
    return (p * q).toFixed(2);
  }, [pricePerUnit, quantity]);

  const priceDiff = useMemo(() => {
    if (!selectedItem || !pricePerUnit) return null;
    const current = parseFloat(pricePerUnit);
    const last = selectedItem.lastPrice;
    if (!last) return null;
    return current - last;
  }, [selectedItem, pricePerUnit]);

  const handleSave = async () => {
    if (!itemName || !pricePerUnit || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const priceTrend = !priceDiff ? 'stable' : priceDiff > 0 ? 'increase' : 'decrease';

    try {
      await createTxn.mutateAsync({
        id: `txn_${Date.now()}`,
        date: new Date().toISOString(),
        item: selectedItem || { name: itemName },
        shop: selectedShop || { name: shopName },
        pricePerUnit: parseFloat(pricePerUnit),
        quantity: parseFloat(quantity),
        totalCost: parseFloat(totalCost),
        unit,
        priceTrend,
      });
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save transaction:', error);
      Alert.alert('Error', 'Failed to save purchase');
    }
  };

  return (
    <Container safeArea padding="lg">
      <View style={styles.header}>
        <Text style={styles.title}>New Purchase</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        keyboardShouldPersistTaps="handled" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Item Search */}
        <View style={styles.inputGroup}>
          <Input
            label="Item Name"
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
          {showItemSuggestions && filteredItems.length > 0 && (
            <Card style={styles.suggestionsCard}>
              {filteredItems.map((item: any) => (
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
                  {item.lastPrice && (
                    <Text style={styles.suggestionPrice}>Last: ₹{item.lastPrice}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          )}
        </View>

        {/* Price Context Widget */}
        {selectedItem && (
          <View style={styles.contextWidget}>
            <View style={styles.contextRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.contextTitle}>Price Context</Text>
            </View>
            <Text style={styles.contextText}>
              Last Purchase: <Text style={styles.boldText}>₹{selectedItem.lastPrice}</Text>
              {selectedItem.lastPurchasedDate && (
                <Text> (on {new Date(selectedItem.lastPurchasedDate).toLocaleDateString()})</Text>
              )}
            </Text>
          </View>
        )}

        {/* Price & Quantity */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: spacing.sm }]}>
            <Input
              label="Rate per Unit (₹)"
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
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Input
              label="Qty"
              placeholder="1"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Unit & Shop */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Input
              label="Unit"
              value={unit}
              onChangeText={setUnit}
              placeholder="kg, ltr, etc."
            />
          </View>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Input
              label="Shop Name"
              placeholder="e.g. Siva Traders"
              value={shopName}
              onChangeText={(text) => {
                setShopName(text);
                setShowShopSuggestions(true);
                setSelectedShop(null);
              }}
              onFocus={() => setShowShopSuggestions(true)}
            />
            {showShopSuggestions && filteredShops.length > 0 && (
              <Card style={styles.suggestionsCard}>
                {filteredShops.map((shop: any) => (
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
              </Card>
            )}
          </View>
        </View>

        {/* Total Display */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Purchase Value</Text>
          <Text style={styles.totalValue}>₹ {totalCost}</Text>
        </View>

        <Button 
          variant="primary" 
          size="lg" 
          onPress={handleSave} 
          style={styles.addButton}
          loading={createTxn.isPending}
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
  inputGroup: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  suggestionsCard: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionItem: {
    padding: spacing.md,
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
    marginBottom: spacing.lg,
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
    marginTop: -spacing.xs,
    marginLeft: spacing.xs,
  },
  trendText: {
    ...typography.smallBold,
    marginLeft: 2,
  },
  totalCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
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
  addButton: {
    height: 56,
    borderRadius: borderRadius.lg,
  },
});
