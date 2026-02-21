import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const settingsGroups = [
    {
      title: 'Management',
      items: [
        { icon: 'list', label: 'Manage Items', color: colors.primary },
        { icon: 'storefront', label: 'Manage Shops', color: '#0EA5E9' },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        { icon: 'cloud-upload', label: 'Sync to Google Drive', color: '#10B981' },
        { icon: 'shield-checkmark', label: 'Privacy Settings', color: '#8B5CF6' },
      ],
    },
    {
      title: 'App Settings',
      items: [
        { icon: 'language', label: 'Language', value: 'English / Tamil', color: '#F59E0B' },
        { icon: 'moon', label: 'Dark Mode', type: 'switch', color: '#374151' },
      ],
    },
  ];

  return (
    <Container safeArea padding="lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Amma's Account</Text>
            <Text style={styles.profileSub}>Standard User</Text>
          </View>
        </View>

        {settingsGroups.map((group, idx) => (
          <View key={idx} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <Card style={styles.groupCard}>
              {group.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.settingItem,
                    itemIdx === group.items.length - 1 && styles.lastItem,
                  ]}
                  disabled={item.type === 'switch'}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                  {item.type === 'switch' ? (
                    <Switch value={false} trackColor={{ true: colors.primary }} />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ShopTracker v1.0.0</Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.primary,
  },
  profileInfo: {
    marginLeft: spacing.md,
  },
  profileName: {
    ...typography.h3,
    color: colors.text,
  },
  profileSub: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupTitle: {
    ...typography.captionBold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  settingValue: {
    ...typography.caption,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  logoutButton: {
    marginTop: spacing.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.bodyBold,
    color: colors.error,
  },
  version: {
    ...typography.tiny,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
