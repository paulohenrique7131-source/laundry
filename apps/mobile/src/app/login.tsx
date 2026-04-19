import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppInput, Button, FieldLabel, GlassCard } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useApp } from '@/providers/AppProvider';

export default function LoginScreen() {
  const { loading, userId: authUserId, signIn } = useAuth();
  const { theme } = useApp();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && authUserId) {
      router.replace('/(tabs)/calculator');
    }
  }, [authUserId, loading]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const nextError = await signIn(userId.trim(), password);
    setSubmitting(false);
    if (nextError) {
      setError(nextError);
    }
  };

  return (
    <LinearGradient colors={theme.name === 'dark' ? ['#0a0a0f', '#161621'] : ['#f0eff4', '#ebe9f2']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}
      >
        <GlassCard style={{ gap: 20, paddingVertical: 28 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: '800' }}>Lavanderia</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>Entre com manager ou gov para acessar o sistema.</Text>
          </View>

          <View>
            <FieldLabel>ID do usuário</FieldLabel>
            <AppInput autoCapitalize="none" autoCorrect={false} placeholder="manager ou gov" value={userId} onChangeText={setUserId} />
          </View>

          <View>
            <FieldLabel>Senha</FieldLabel>
            <AppInput secureTextEntry placeholder="••••••" value={password} onChangeText={setPassword} />
          </View>

          {error ? (
            <View style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', borderRadius: 16, borderWidth: 1, padding: 12 }}>
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>{error}</Text>
            </View>
          ) : null}

          <Button label={submitting ? 'Entrando...' : 'Entrar'} onPress={handleSubmit} disabled={submitting || !userId.trim() || !password} fullWidth />
        </GlassCard>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
