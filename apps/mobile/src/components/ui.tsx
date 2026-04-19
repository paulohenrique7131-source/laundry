import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/providers/AppProvider';
import type { AppSettings } from '@laundry/domain';
import type { LaundryTheme } from '@laundry/theme';

export function AppScreen({
  children,
  scroll = true,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useApp();
  const content = (
    <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 120 }, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <LinearGradient colors={theme.name === 'dark' ? ['#0a0a0f', '#111118'] : ['#f0eff4', '#e8e7ee']} style={styles.fill}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </LinearGradient>
  );
}

export function GlassCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme, settings } = useApp();
  const overlayOpacity = settings.cardOpacity ?? theme.cardOpacity;

  return (
    <BlurView
      intensity={settings.blurIntensity ?? theme.blur}
      tint={theme.name}
      style={[
        styles.glass,
        {
          backgroundColor: `rgba(255,255,255,${overlayOpacity})`,
          borderColor: theme.colors.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { theme } = useApp();

  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  fullWidth,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}) {
  const { theme } = useApp();
  const stylesByVariant: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    secondary: {
      backgroundColor: theme.colors.glassBg,
      borderColor: theme.colors.glassBorder,
    },
    danger: {
      backgroundColor: '#7f1d1d',
      borderColor: '#ef4444',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };
  const textColor = variant === 'primary' ? '#000' : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        stylesByVariant[variant],
        fullWidth ? { alignSelf: 'stretch' } : null,
        disabled || loading ? { opacity: 0.45 } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.buttonLabel, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { theme } = useApp();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.accent : theme.colors.glassBg,
          borderColor: active ? theme.colors.accent : theme.colors.glassBorder,
        },
      ]}
    >
      <Text style={[styles.chipLabel, { color: active ? '#000' : theme.colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useApp();
  return <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{children}</Text>;
}

export function AppInput(props: React.ComponentProps<typeof TextInput>) {
  const { theme } = useApp();
  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      {...props}
      style={[
        styles.input,
        {
          backgroundColor: theme.colors.glassBg,
          borderColor: theme.colors.glassBorder,
          color: theme.colors.textPrimary,
        },
        props.style,
      ]}
    />
  );
}

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { theme } = useApp();
  return (
    <View style={[styles.stepper, { borderColor: theme.colors.glassBorder }]}>
      <Pressable style={styles.stepperButton} onPress={() => onChange(Math.max(0, value - 1))}>
        <Text style={[styles.stepperLabel, { color: theme.colors.textPrimary }]}>-</Text>
      </Pressable>
      <Text style={[styles.stepperValue, { color: theme.colors.textPrimary }]}>{value}</Text>
      <Pressable style={styles.stepperButton} onPress={() => onChange(value + 1)}>
        <Text style={[styles.stepperLabel, { color: theme.colors.textPrimary }]}>+</Text>
      </Pressable>
    </View>
  );
}

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  const { theme } = useApp();
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
      <Text style={[styles.subtitle, { color: theme.colors.textMuted, marginTop: 12 }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  const { theme } = useApp();
  return (
    <GlassCard style={styles.emptyCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text> : null}
    </GlassCard>
  );
}

export function ErrorState({
  title,
  subtitle,
  onRetry,
  actionLabel = 'Tentar novamente',
}: {
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  actionLabel?: string;
}) {
  const { theme } = useApp();
  return (
    <GlassCard style={styles.emptyCard}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textMuted, marginTop: 8, textAlign: 'center' }]}>{subtitle}</Text> : null}
      {onRetry ? <View style={{ marginTop: 16, minWidth: 180 }}><Button label={actionLabel} onPress={onRetry} fullWidth /></View> : null}
    </GlassCard>
  );
}

export function ModalBackdrop({
  children,
  justifyContent = 'flex-end',
  padding = 16,
}: {
  children: React.ReactNode;
  justifyContent?: ViewStyle['justifyContent'];
  padding?: number;
}) {
  const { settings, theme } = useApp();

  return (
    <View style={{ flex: 1, justifyContent, padding }}>
      <BlurView
        pointerEvents="none"
        intensity={Math.max(18, (settings.blurIntensity ?? theme.blur) * 1.6)}
        tint={theme.name}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[
          `rgba(0,0,0,${Math.max(0.18, settings.modalOpacityEdges ?? 0.2)})`,
          `rgba(0,0,0,${Math.max(0.42, settings.modalOpacityAverage ?? 0.6)})`,
          `rgba(0,0,0,${Math.max(0.72, settings.modalOpacityMiddle ?? 0.9)})`,
          `rgba(0,0,0,${Math.max(0.42, settings.modalOpacityAverage ?? 0.6)})`,
          `rgba(0,0,0,${Math.max(0.18, settings.modalOpacityEdges ?? 0.2)})`,
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  );
}

export function modalSurfaceStyle(
  theme: LaundryTheme,
  settings: AppSettings,
  level: 'primary' | 'secondary' = 'primary',
): ViewStyle {
  const dark = theme.name === 'dark';
  const alpha = level === 'primary'
    ? Math.max(0.96, settings.modalOpacityMiddle ?? 0.9)
    : Math.max(0.88, settings.modalOpacityAverage ?? 0.6);

  return {
    backgroundColor: dark
      ? `rgba(18,18,24,${alpha})`
      : `rgba(250,250,252,${Math.max(0.94, alpha)})`,
    borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: dark ? 0.28 : 0.12,
    shadowRadius: 26,
    elevation: 18,
  };
}

export function modalInputStyle(theme: LaundryTheme): TextStyle {
  return {
    backgroundColor: theme.name === 'dark' ? 'rgba(31,31,40,0.96)' : 'rgba(255,255,255,0.98)',
    borderColor: theme.name === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(26,26,46,0.08)',
  };
}

export function ValueText({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const { theme } = useApp();
  return <Text style={[styles.valueText, { color: theme.colors.accent }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    gap: 16,
    paddingHorizontal: 16,
  },
  glass: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stepper: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stepperButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 42,
  },
  stepperLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '800',
  },
});
