import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('English');

  const handleManageItems = () => router.push('/manage-items');
  const handleManageShops = () => router.push('/manage-shops');

  const handleLanguage = () => {
    Alert.alert('Language', 'Choose your preferred language.', [
      {
        text: 'English',
        onPress: () => setLanguage('English'),
      },
      {
        text: 'Tamil',
        onPress: () => setLanguage('Tamil'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleGoogleDrive = () => {
    Alert.alert('Sync to Google Drive', 'This feature is coming soon!', [
      { text: 'OK' },
    ]);
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Settings',
      'Your data is stored locally and synced to your own Supabase project. No third-party services have access to your purchase history.',
      [{ text: 'Got it' }]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => {} },
    ]);
  };

  type SettingItem = {
    icon: string;
    label: string;
    color: string;
    value?: string;
    type?: 'switch' | 'chevron';
    onPress?: () => void;
    switchValue?: boolean;
    onSwitch?: (v: boolean) => void;
  };

  type SettingGroup = {
    title: string;
    items: SettingItem[];
  };

  const settingsGroups: SettingGroup[] = [
    {
      title: 'Management',
      items: [
        {
          icon: 'list',
          label: 'Manage Items',
          color: colors.primary,
          onPress: handleManageItems,
        },
        {
          icon: 'storefront',
          label: 'Manage Shops',
          color: '#0EA5E9',
          onPress: handleManageShops,
        },
      ],
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          icon: 'cloud-upload',
          label: 'Sync to Google Drive',
          color: '#10B981',
          onPress: handleGoogleDrive,
        },
        {
          icon: 'shield-checkmark',
          label: 'Privacy Settings',
          color: '#8B5CF6',
          onPress: handlePrivacy,
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'language',
          label: 'Language',
          value: language,
          color: '#F59E0B',
          onPress: handleLanguage,
        },
        {
          icon: 'moon',
          label: 'Dark Mode',
          type: 'switch',
          color: '#374151',
          switchValue: darkMode,
          onSwitch: (v) => {
            setDarkMode(v);
            if (v) {
              Alert.alert('Dark Mode', 'Dark mode support is coming in a future update.');
              setDarkMode(false);
            }
          },
        },
      ],
    },
  ];

  return (
    <Container safeArea padding="lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
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
                  onPress={item.type !== 'switch' ? item.onPress : undefined}
                  activeOpacity={item.type === 'switch' ? 1 : 0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.value && (
                    <Text style={styles.settingValue}>{item.value}</Text>
                  )}
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.switchValue ?? false}
                      onValueChange={item.onSwitch}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.white}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
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

