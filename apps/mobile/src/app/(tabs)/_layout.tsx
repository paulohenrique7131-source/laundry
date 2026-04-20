import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { View } from 'react-native';
import { LoadingState } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useApp } from '@/providers/AppProvider';

const tabs = [
  { name: 'calculator', title: 'Calculadora', icon: 'calculator-outline' as const },
  { name: 'dashboard', title: 'Dashboard', icon: 'grid-outline' as const },
  { name: 'statistics', title: 'Estatísticas', icon: 'bar-chart-outline' as const },
  { name: 'notes', title: 'Notas', icon: 'document-text-outline' as const },
  { name: 'settings', title: 'Configurações', icon: 'settings-outline' as const },
];

export default function TabsLayout() {
  const { loading, userId } = useAuth();
  const { ready, theme } = useApp();

  if (loading || !ready) {
    return (
      <View style={{ backgroundColor: theme.colors.bgPrimary, flex: 1, justifyContent: 'center', padding: 24 }}>
        <LoadingState label="Preparando app..." />
      </View>
    );
  }
  if (!userId) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint={theme.name}
            style={{
              backgroundColor: theme.name === 'dark' ? 'rgba(17,17,24,0.82)' : 'rgba(255,255,255,0.9)',
              borderRadius: 28,
              bottom: 16,
              left: 12,
              overflow: 'hidden',
              position: 'absolute',
              right: 12,
              top: 8,
            }}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 84,
          paddingBottom: 14,
          paddingTop: 10,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.icon.replace('-outline', '') as never : tab.icon} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
