import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { colors, radii, spacing, typography } from '../../constants/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7} disabled={loading}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, destructive && styles.confirmButtonDestructive, loading && styles.disabled]}
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Text style={[styles.confirmText, !destructive && styles.confirmTextLight]}>{confirmText}</Text>}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.s,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgButtonSub,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonDestructive: {
    backgroundColor: colors.error,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmTextLight: {
    color: '#000000',
  },
  disabled: {
    opacity: 0.7,
  },
});
