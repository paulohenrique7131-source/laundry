import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { v4 as uuidv4 } from 'uuid';
import { type CatalogDefinition } from '@laundry/domain';
import { CatalogEditorModal } from '@/components/CatalogEditorModal';
import { AppInput, AppScreen, Button, Chip, FieldLabel, GlassCard, ScreenHeader } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

type Section = 'appearance' | 'tables' | 'account';

export default function SettingsScreen() {
  const { settings, theme, updateSettings, saveSettings, toggleTheme } = useApp();
  const { role, signOut, updatePassword } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>('appearance');
  const [editorCatalog, setEditorCatalog] = useState<string | null>(null);
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogType, setNewCatalogType] = useState<'service' | 'product'>('product');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [themeBusy, setThemeBusy] = useState(false);

  const customCatalogs = settings.customCatalogs ?? [];
  const headerSubtitle = useMemo(() => {
    if (section === 'appearance') return 'Tema, blur e opacidade dos cards.';
    if (section === 'tables') return 'Catalogos padrao e personalizados.';
    return 'Sessao, senha e perfil de acesso.';
  }, [section]);

  const persistLocalSetting = async (partial: Partial<typeof settings>) => {
    try {
      await saveSettings(partial);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel salvar a configuracao no aparelho.', 'error');
    }
  };

  const addCatalog = async () => {
    if (!newCatalogName.trim()) {
      toast('Informe o nome do catalogo.', 'error');
      return;
    }

    const nextCatalogs: CatalogDefinition[] = [
      ...customCatalogs,
      {
        id: uuidv4(),
        name: newCatalogName.trim(),
        type: newCatalogType,
        columns: newCatalogType === 'service' ? ['lp', 'p'] : ['single'],
      },
    ];

    try {
      setSavingCatalog(true);
      updateSettings({ customCatalogs: nextCatalogs });
      await saveSettings({ customCatalogs: nextCatalogs });
      setNewCatalogName('');
      setNewCatalogType('product');
      toast('Catalogo personalizado criado.');
    } catch (error) {
      updateSettings({ customCatalogs });
      toast(error instanceof Error ? error.message : 'Nao foi possivel criar o catalogo.', 'error');
    } finally {
      setSavingCatalog(false);
    }
  };

  const removeCatalog = async (catalogId: string) => {
    const nextCatalogs = customCatalogs.filter((catalog) => catalog.id !== catalogId);
    try {
      setSavingCatalog(true);
      updateSettings({ customCatalogs: nextCatalogs });
      await saveSettings({ customCatalogs: nextCatalogs });
      toast('Catalogo removido.');
    } catch (error) {
      updateSettings({ customCatalogs });
      toast(error instanceof Error ? error.message : 'Nao foi possivel remover o catalogo.', 'error');
    } finally {
      setSavingCatalog(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword) {
      toast('Informe a nova senha.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('A senha precisa ter ao menos 6 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('As senhas nao conferem.', 'error');
      return;
    }

    try {
      setChangingPassword(true);
      const error = await updatePassword(newPassword);
      if (error) {
        toast(error, 'error');
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      toast('Senha atualizada com sucesso.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast('Sessao encerrada.', 'info');
  };

  return (
    <>
      <AppScreen>
        <ScreenHeader title="Configuracoes" subtitle={headerSubtitle} />

        <GlassCard style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Chip label="Aparencia" active={section === 'appearance'} onPress={() => setSection('appearance')} />
            <Chip label="Tabelas" active={section === 'tables'} onPress={() => setSection('tables')} />
            <Chip label="Conta" active={section === 'account'} onPress={() => setSection('account')} />
          </View>
        </GlassCard>

        {section === 'appearance' ? (
          <ScrollView scrollEnabled={false} contentContainerStyle={{ gap: 16 }}>
            <GlassCard style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Tema</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Alterna entre claro e escuro.</Text>
                </View>
                <Switch
                  value={settings.theme === 'dark'}
                  onValueChange={async () => {
                    try {
                      setThemeBusy(true);
                      await toggleTheme();
                    } catch (error) {
                      toast(error instanceof Error ? error.message : 'Nao foi possivel alterar o tema.', 'error');
                    } finally {
                      setThemeBusy(false);
                    }
                  }}
                  disabled={themeBusy}
                  thumbColor={theme.colors.accent}
                />
              </View>
            </GlassCard>

            <GlassCard style={{ gap: 14 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Intensidade de blur</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{settings.blurIntensity ?? 16}px</Text>
              <Slider
                minimumValue={0}
                maximumValue={32}
                minimumTrackTintColor={theme.colors.accent}
                maximumTrackTintColor={theme.colors.glassBorder}
                thumbTintColor={theme.colors.accent}
                value={settings.blurIntensity ?? 16}
                onValueChange={(value) => updateSettings({ blurIntensity: Math.round(value) })}
                onSlidingComplete={(value) => { void persistLocalSetting({ blurIntensity: Math.round(Number(value)) }); }}
              />
            </GlassCard>

            <GlassCard style={{ gap: 14 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Opacidade dos cards</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{Math.round((settings.cardOpacity ?? 0.15) * 100)}%</Text>
              <Slider
                minimumValue={0.05}
                maximumValue={0.75}
                step={0.01}
                minimumTrackTintColor={theme.colors.accent}
                maximumTrackTintColor={theme.colors.glassBorder}
                thumbTintColor={theme.colors.accent}
                value={settings.cardOpacity ?? 0.15}
                onValueChange={(value) => updateSettings({ cardOpacity: Number(value.toFixed(2)) })}
                onSlidingComplete={(value) => { void persistLocalSetting({ cardOpacity: Number(Number(value).toFixed(2)) }); }}
              />
            </GlassCard>

            <GlassCard style={{ gap: 14 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Opacidade dos modais</Text>
              {([
                ['modalOpacityMiddle', 'Centro', settings.modalOpacityMiddle ?? 0.9],
                ['modalOpacityAverage', 'Media', settings.modalOpacityAverage ?? 0.6],
                ['modalOpacityEdges', 'Bordas', settings.modalOpacityEdges ?? 0.2],
              ] as const).map(([key, label, value]) => (
                <View key={key} style={{ gap: 8 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                    {label} • {Math.round(value * 100)}%
                  </Text>
                  <Slider
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                    minimumTrackTintColor={theme.colors.accent}
                    maximumTrackTintColor={theme.colors.glassBorder}
                    thumbTintColor={theme.colors.accent}
                    value={value}
                    onValueChange={(nextValue) => updateSettings({ [key]: Number(nextValue.toFixed(2)) })}
                    onSlidingComplete={(nextValue) => { void persistLocalSetting({ [key]: Number(Number(nextValue).toFixed(2)) }); }}
                  />
                </View>
              ))}
            </GlassCard>
          </ScrollView>
        ) : null}

        {section === 'tables' ? (
          <ScrollView scrollEnabled={false} contentContainerStyle={{ gap: 16 }}>
            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Catalogos padrao</Text>
              <Button label="Editar Servicos" onPress={() => setEditorCatalog('services')} variant="secondary" fullWidth />
              <Button label="Editar Enxoval" onPress={() => setEditorCatalog('trousseau')} variant="secondary" fullWidth />
            </GlassCard>

            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Catalogos personalizados</Text>
              {customCatalogs.length === 0 ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Nenhum catalogo personalizado criado.</Text>
              ) : null}
              {customCatalogs.map((catalog) => (
                <GlassCard key={catalog.id} style={{ gap: 10 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{catalog.name}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                    {catalog.type === 'service' ? 'Servico com LP e P' : 'Produto com preco unico'}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button label="Editar itens" onPress={() => setEditorCatalog(catalog.id)} variant="secondary" />
                    <Button
                      label="Remover"
                      onPress={() => Alert.alert('Remover catalogo', `Excluir ${catalog.name}?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Excluir', style: 'destructive', onPress: () => void removeCatalog(catalog.id) },
                      ])}
                      variant="danger"
                      loading={savingCatalog}
                    />
                  </View>
                </GlassCard>
              ))}

              <GlassCard style={{ gap: 12 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Novo catalogo</Text>
                <View>
                  <FieldLabel>Nome</FieldLabel>
                  <AppInput value={newCatalogName} onChangeText={setNewCatalogName} placeholder="Ex.: Restaurante" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <Chip label="Produto" active={newCatalogType === 'product'} onPress={() => setNewCatalogType('product')} />
                  <Chip label="Servico" active={newCatalogType === 'service'} onPress={() => setNewCatalogType('service')} />
                </View>
                <Button label="Criar catalogo" onPress={addCatalog} loading={savingCatalog} fullWidth />
              </GlassCard>
            </GlassCard>
          </ScrollView>
        ) : null}

        {section === 'account' ? (
          <ScrollView scrollEnabled={false} contentContainerStyle={{ gap: 16 }}>
            <GlassCard style={{ gap: 10 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Conta atual</Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                Perfil: {role === 'manager' ? 'Gerencia' : role === 'gov' ? 'Governanca' : 'Sistema'}
              </Text>
            </GlassCard>

            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Alterar senha</Text>
              <View>
                <FieldLabel>Nova senha</FieldLabel>
                <AppInput secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Minimo de 6 caracteres" />
              </View>
              <View>
                <FieldLabel>Confirmar senha</FieldLabel>
                <AppInput secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a nova senha" />
              </View>
              <Button label="Atualizar senha" onPress={changePassword} loading={changingPassword} fullWidth />
            </GlassCard>

            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Sessao</Text>
              <Button label="Sair da conta" onPress={handleLogout} variant="danger" fullWidth />
            </GlassCard>
          </ScrollView>
        ) : null}
      </AppScreen>

      <CatalogEditorModal
        visible={!!editorCatalog}
        catalogType={editorCatalog ?? 'services'}
        customCatalogs={customCatalogs}
        onClose={() => setEditorCatalog(null)}
        onSaved={() => toast('Catalogo atualizado.')}
      />
    </>
  );
}
