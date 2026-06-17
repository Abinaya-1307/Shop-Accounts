import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { useTheme } from '@/context/ThemeContext';

interface DeleteConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function DeleteConfirmationModal({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
}: DeleteConfirmationModalProps) {
  const { isDark } = useTheme();
  
  // Animated value for scaling up the modal card
  const scaleValue = useRef(new Animated.Value(0.3)).current;
  // Animated value for backdrop fade-in
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in parallel
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out parallel
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleValue, fadeValue]);

  // Color tokens based on dark/light mode
  const bg = isDark ? '#1E293B' : colors.white;
  const textColor = isDark ? '#F1F5F9' : colors.text;
  const subTextColor = isDark ? '#94A3B8' : colors.textSecondary;
  const cancelBg = isDark ? '#334155' : '#F1F5F9';
  const cancelText = isDark ? '#CBD5E1' : colors.textSecondary;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            opacity: fadeValue,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(0, 0, 0, 0.4)' 
          }
        ]}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onCancel} />
        
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: bg,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Circular Alert Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={28} color={colors.error} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.message, { color: subTextColor }]}>{message}</Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: cancelBg }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: cancelText }]}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, styles.confirmBtnText]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = Math.min(width * 0.85, 340);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: cardWidth,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    // shadow for premium depth
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 0,
  },
  confirmBtn: {
    backgroundColor: colors.error,
  },
  btnText: {
    ...typography.bodyBold,
  },
  confirmBtnText: {
    color: colors.white,
  },
});
