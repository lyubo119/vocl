import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '../../constants/theme';
import Icon from '../ui/Icon';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setToast(null);
    });
  }, [translateY, opacity]);

  const showToast = useCallback((title: string, message?: string, type: ToastType = 'info') => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({ id: Date.now().toString(), title, message, type });
    
    // Reset values
    translateY.setValue(-50);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();

    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, 3500);
  }, [translateY, opacity, hideToast]);

  const getIconName = (type: ToastType) => {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'x';
      case 'info': return 'info';
    }
  };

  const getAccentColor = (type: ToastType) => {
    switch (type) {
      case 'success': return colors.success;
      case 'error': return colors.error;
      case 'info': return '#7ca8d7';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Platform.OS === 'ios' ? (insets.top || spacing.l) + spacing.s : spacing.l + spacing.s,
              transform: [{ translateY }],
              opacity,
            }
          ]}
        >
          <View style={[styles.toastContent, { borderColor: `${getAccentColor(toast.type)}50` }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${getAccentColor(toast.type)}20` }]}>
              <Icon name={getIconName(toast.type) as any} size={18} color={getAccentColor(toast.type)} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: spacing.m,
    right: spacing.m,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: radii.xl,
    paddingVertical: spacing.s + 2,
    paddingHorizontal: spacing.m,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
});
