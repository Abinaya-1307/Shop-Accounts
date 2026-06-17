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
import { useTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;

  const { isDark, toggleDark, theme } = useTheme();
  const [language, setLanguage] = useState('English');

  const handleManageItems = () => router.push('/manage-items');
  const handleManageShops = () => router.push('/manage-shops');


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
          icon: 'moon',
          label: 'Dark Mode',
          type: 'switch',
          color: '#374151',
          switchValue: isDark,
          onSwitch: () => toggleDark(),
        },
      ],
    },
  ];

  const bg = isDark ? '#0F172A' : colors.background;
  const cardBg = isDark ? '#1E293B' : colors.white;
  const textColor = isDark ? '#F1F5F9' : colors.text;
  const subColor = isDark ? '#94A3B8' : colors.textTertiary;
  const borderColor = isDark ? '#334155' : colors.border;

  return (
    <Container safeArea edges={['top', 'left', 'right']} padding="lg" style={{ backgroundColor: bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarHeight + spacing.lg }}>
        <Text style={[styles.title, { color: textColor }]}>Settings</Text>

        {/* Profile */}
        <View style={styles.profileSection}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: textColor }]}>Amma's Account</Text>
            <Text style={[styles.profileSub, { color: subColor }]}>Standard User</Text>
          </View>
        </View>

        {settingsGroups.map((group, idx) => (
          <View key={idx} style={styles.group}>
            <Text style={[styles.groupTitle, { color: subColor }]}>{group.title}</Text>
            <Card style={[styles.groupCard, { backgroundColor: cardBg, borderColor }]}>
              {group.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={[
                    styles.settingItem,
                    { borderBottomColor: borderColor },
                    itemIdx === group.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.type !== 'switch' ? item.onPress : undefined}
                  activeOpacity={item.type === 'switch' ? 1 : 0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.settingLabel, { color: textColor }]}>{item.label}</Text>
                  {item.value && (
                    <Text style={[styles.settingValue, { color: subColor }]}>{item.value}</Text>
                  )}
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.switchValue ?? false}
                      onValueChange={item.onSwitch}
                      trackColor={{ false: borderColor, true: colors.primary }}
                      thumbColor={colors.white}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={subColor} />
                  )}
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <Text style={[styles.version, { color: subColor }]}>ShopTracker v1.1.0</Text>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h2,
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
  },
  profileSub: {
    ...typography.caption,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupTitle: {
    ...typography.captionBold,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupCard: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
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
    flex: 1,
  },
  settingValue: {
    ...typography.caption,
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
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
