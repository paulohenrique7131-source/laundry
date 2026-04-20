import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  DEFAULT_SERVICE_ITEMS,
  getCatalogStorageKey,
  getCatalogTitle,
  isServiceCatalog,
  type CatalogDefinition,
  type ServiceItem,
  type TrousseauItem,
} from '@laundry/domain';
import { repository } from '@/lib/repository';
import { AppInput, Button, ErrorState, FieldLabel, GlassCard, LoadingState } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider';
import { useApp } from '@/providers/AppProvider';

type EditableItem = {
  id: string;
  name: string;
  price: number;
  priceP?: number | null;
};

interface Props {
  visible: boolean;
  catalogType: string;
  customCatalogs?: CatalogDefinition[];
  onClose: () => void;
  onSaved: () => void;
}

export function CatalogEditorModal({ visible, catalogType, customCatalogs = [], onClose, onSaved }: Props) {
  const { theme } = useApp();
  const { toast } = useToast();
  const [items, setItems] = useState<EditableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  const config = useMemo(() => ({
    key: getCatalogStorageKey(catalogType),
    title: getCatalogTitle(catalogType, customCatalogs),
    serviceMode: isServiceCatalog(catalogType, customCatalogs),
  }), [catalogType, customCatalogs]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await repository.getConfig(config.key);
        if (cancelled) return;
        setItems((((data as unknown) as Array<Record<string, unknown>>) ?? []).map((item) => ({
          id: item.id as string,
          name: item.name as string,
          price: Number(item.priceLP ?? item.price ?? 0),
          priceP: (item.priceP as number | null | undefined) ?? null,
        })));
      } catch (error) {
        if (cancelled) return;
        setItems([]);
        setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o catalogo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [config.key, reloadSeed, visible]);

  const save = async () => {
    if (items.some((item) => !item.name.trim())) {
      toast('Todos os itens precisam de nome.', 'error');
      return;
    }

    try {
      setSaving(true);
      if (config.serviceMode) {
        const payload: ServiceItem[] = items.map((item) => ({
          id: item.id,
          name: item.name.trim(),
          priceLP: item.price,
          priceP: item.priceP ?? null,
        }));
        await repository.setConfig(config.key, payload);
      } else {
        const payload: TrousseauItem[] = items.map((item) => ({
          id: item.id,
          name: item.name.trim(),
          price: item.price,
        }));
        await repository.setConfig(config.key, payload);
      }

      toast('Itens salvos com sucesso.');
      onSaved();
      onClose();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel salvar o catalogo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = async () => {
    if (config.key !== 'c1_items') {
      toast('Somente o catalogo de servicos pode ser restaurado.', 'warning');
      return;
    }
    try {
      await repository.setConfig('c1_items', DEFAULT_SERVICE_ITEMS);
      setItems(DEFAULT_SERVICE_ITEMS.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.priceLP,
        priceP: item.priceP,
      })));
      toast('Servicos restaurados ao padrao.', 'info');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel restaurar o catalogo.', 'error');
    }
  };

  const exportJson = async () => {
    try {
      const payload = config.serviceMode
        ? items.map((item) => ({ id: item.id, name: item.name, priceLP: item.price, priceP: item.priceP ?? null }))
        : items.map((item) => ({ id: item.id, name: item.name, price: item.price }));
      const uri = `${FileSystem.cacheDirectory}${config.title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel exportar o JSON.', 'error');
    }
  };

  const importJson = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json'] });
      if (result.canceled) return;
      const asset = result.assets[0];
      const raw = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        toast('Arquivo invalido.', 'error');
        return;
      }
      setItems(parsed.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? `import_${Date.now()}`),
        name: String(item.name ?? ''),
        price: Number(item.priceLP ?? item.price ?? 0),
        priceP: item.priceP == null ? null : Number(item.priceP),
      })));
      toast('Dados importados. Salve para confirmar.', 'info');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel importar o JSON.', 'error');
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={{ backgroundColor: theme.colors.bgPrimary, flex: 1, padding: 16, paddingTop: 56 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <View>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: '800' }}>{config.title}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Edite nomes e precos do catalogo.</Text>
          </View>
          <Pressable onPress={onClose}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: '700' }}>Fechar</Text>
          </Pressable>
        </View>

        {loading ? <LoadingState /> : errorMessage ? (
          <ErrorState
            title="Falha ao carregar catalogo"
            subtitle={errorMessage}
            onRetry={() => {
              setErrorMessage(null);
              setReloadSeed((current) => current + 1);
            }}
          />
        ) : (
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => (
              <GlassCard key={item.id} style={{ gap: 10 }}>
                <View>
                  <FieldLabel>Nome</FieldLabel>
                  <AppInput value={item.name} onChangeText={(value) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: value } : entry))} />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <FieldLabel>{config.serviceMode ? 'Preco LP' : 'Preco'}</FieldLabel>
                    <AppInput keyboardType="decimal-pad" value={String(item.price)} onChangeText={(value) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, price: Number(value || 0) } : entry))} />
                  </View>
                  {config.serviceMode ? (
                    <View style={{ flex: 1 }}>
                      <FieldLabel>Preco P</FieldLabel>
                      <AppInput keyboardType="decimal-pad" value={item.priceP == null ? '' : String(item.priceP)} onChangeText={(value) => setItems((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, priceP: value === '' ? null : Number(value || 0) } : entry))} />
                    </View>
                  ) : null}
                </View>
                <Button label="Remover item" onPress={() => setItems((current) => current.filter((_, entryIndex) => entryIndex !== index))} variant="ghost" />
              </GlassCard>
            ))}

            <Button
              label="Adicionar item"
              onPress={() => setItems((current) => [...current, {
                id: `item_${Date.now()}_${current.length}`,
                name: '',
                price: 0,
                priceP: config.serviceMode ? null : undefined,
              }])}
              variant="secondary"
              fullWidth
            />
            <Button label="Exportar JSON" onPress={exportJson} variant="secondary" fullWidth />
            <Button label="Importar JSON" onPress={importJson} variant="secondary" fullWidth />
            {config.key === 'c1_items' ? <Button label="Restaurar padrao" onPress={restoreDefaults} variant="secondary" fullWidth /> : null}
            <Button label="Salvar alteracoes" onPress={save} loading={saving} fullWidth />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
