'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from './AppProvider';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { theme } = useApp();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => dismiss(id), 3200);
  }, [dismiss]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={[styles.container, { top: insets.top + 12 }]}>
        {toasts.map((item) => (
          <Animated.View
            key={item.id}
            style={[
              styles.toast,
              {
                backgroundColor: theme.colors.bgSecondary,
                borderColor: colorForType(item.type),
              },
            ]}
          >
            <Pressable onPress={() => dismiss(item.id)}>
              <Text style={[styles.message, { color: theme.colors.textPrimary }]}>{item.message}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function colorForType(type: ToastType) {
  if (type === 'error') return '#ef4444';
  if (type === 'warning') return '#f59e0b';
  if (type === 'info') return '#3b82f6';
  return '#10b981';
}

const styles = StyleSheet.create({
  container: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 999,
  },
  toast: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export function useToast() {
  return useContext(ToastContext);
}
