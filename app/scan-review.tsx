import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Container, Button, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { API_URL as API } from '@/lib/config';
import { useCreateBatchTransaction } from '@/hooks/useData';

export default function ScanReviewScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const createBatchTxn = useCreateBatchTransaction();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [shopName, setShopName] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (imageUri) {
      processReceipt();
    } else {
      setErrorMsg('No image provided.');
      setIsLoading(false);
    }
  }, [imageUri]);

  const processReceipt = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // 1. Resize the image slightly to save upload time and get base64
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }], // Resize down to max 1200px width
        { compress: 0.7, base64: true }
      );

      // 2. Send to backend Gemini route
      const { data } = await axios.post(`${API}/scan-receipt`, {
        imageBase64: manipResult.base64,
        mimeType: 'image/jpeg',
      });

      if (data.success && data.data) {
        setShopName(data.data.shopName || '');
        if (data.data.receiptDate) {
          setReceiptDate(data.data.receiptDate);
        }
        setItems(data.data.items || []);
      } else {
        setErrorMsg('Failed to extract items from receipt.');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setErrorMsg('Error connecting to the AI scanner. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    // Auto calculate totals if quantity or pricePerUnit changes
    if (field === 'quantity') {
      item.quantity = parseFloat(value) || 0;
      item.totalCost = item.quantity * item.pricePerUnit;
    } else if (field === 'pricePerUnit') {
      item.pricePerUnit = parseFloat(value) || 0;
      item.totalCost = item.quantity * item.pricePerUnit;
    } else if (field === 'totalCost') {
      item.totalCost = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSaveAll = async () => {
    if (items.length === 0) {
      Alert.alert('Empty', 'No items to save.');
      return;
    }

    setIsSaving(true);
    try {
      // Ensure the date string is a valid ISO datetime by appending time if needed
      const dateStr = receiptDate.includes('T') ? receiptDate : `${receiptDate}T12:00:00.000Z`;
      
      const payloads = items.map((item) => ({
        id: `txn_${Date.now()}_${Math.floor(Math.random()*1000)}`,
        date: dateStr,
        item: { name: item.itemName },
        shop: shopName ? { name: shopName } : undefined,
        pricePerUnit: item.pricePerUnit,
        quantity: item.quantity,
        totalCost: item.totalCost,
        unit: item.unit,
        priceTrend: 'stable' as const,
      }));

      // 1. Send to Backend
      await axios.post(`${API}/new-batch`, {
        shopName,
        date: dateStr,
        items: items,
      });

      // 2. Save locally
      await createBatchTxn.mutateAsync(payloads);

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Batch save error:', err);
      Alert.alert('Error', 'Failed to save all items.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container safeArea padding="lg" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.lg }} />
        <Text style={styles.loadingTitle}>Analyzing Receipt...</Text>
        <Text style={styles.loadingSubtitle}>
          Extracting and translating items automatically.
        </Text>
      </Container>
    );
  }

  if (errorMsg) {
    return (
      <Container safeArea padding="lg" style={styles.loadingContainer}>
        <Ionicons name="warning" size={48} color={colors.error} style={{ marginBottom: spacing.md }} />
        <Text style={[styles.loadingTitle, { color: colors.error }]}>Failed</Text>
        <Text style={styles.loadingSubtitle}>{errorMsg}</Text>
        <View style={{ marginTop: spacing.xl }}>
          <Button variant="outline" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </Container>
    );
  }

  const grandTotal = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  return (
    <Container safeArea padding="none">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Review Receipt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.receiptImage} contentFit="cover" />
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                style={styles.inputLarge}
                value={shopName}
                onChangeText={setShopName}
                placeholder="e.g. Siva Stores"
              />
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Receipt Date</Text>
              <TextInput
                style={[styles.inputLarge, { color: '#4F46E5' }]}
                value={receiptDate}
                onChangeText={setReceiptDate}
                placeholder="YYYY-MM-DD"
              />
              <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                From scan · edit if wrong
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Found {items.length} Items</Text>

        {items.map((item, index) => (
          <Card key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <TextInput
                style={styles.itemNameInput}
                value={item.itemName}
                onChangeText={(val) => handleUpdateItem(index, 'itemName', val)}
                placeholder="Item Name"
              />
              <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.itemDetailsRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.miniLabel}>Qty</Text>
                <TextInput
                  style={styles.miniInput}
                  value={String(item.quantity)}
                  onChangeText={(val) => handleUpdateItem(index, 'quantity', val)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.miniLabel}>Unit</Text>
                <TextInput
                  style={styles.miniInput}
                  value={item.unit}
                  onChangeText={(val) => handleUpdateItem(index, 'unit', val)}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.miniLabel}>Rate (₹)</Text>
                <TextInput
                  style={styles.miniInput}
                  value={String(item.pricePerUnit)}
                  onChangeText={(val) => handleUpdateItem(index, 'pricePerUnit', val)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroupTotal}>
                <Text style={styles.miniLabel}>Total</Text>
                <TextInput
                  style={[styles.miniInput, { color: colors.primary, fontWeight: 'bold' }]}
                  value={String(item.totalCost)}
                  onChangeText={(val) => handleUpdateItem(index, 'totalCost', val)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Scanned Value</Text>
          <Text style={styles.summaryValue}>₹ {grandTotal.toFixed(2)}</Text>
        </View>

        <View style={{ marginBottom: spacing.xxl }}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSaveAll}
            loading={isSaving}
          >
            Save All to Diary
          </Button>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  receiptImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  inputLarge: {
    ...typography.h4,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.xs,
  },
  itemNameInput: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  inputGroupTotal: {
    flex: 1.2,
  },
  miniLabel: {
    ...typography.tiny,
    color: colors.textTertiary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  miniInput: {
    ...typography.body,
    color: colors.textSecondary,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.primaryTint,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.display,
    color: colors.primary,
    fontSize: 32,
  },
});
