import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  buildProductHistoryItems,
  buildServiceHistoryItems,
  createHistoryRecord,
  formatCurrency,
  getCatalogStorageKey,
  getCatalogTitle,
  isServiceCatalog,
  MULTIPLIERS,
  type CalcLineService,
  type CalcLineTrousseau,
  type ServiceItem,
  type ServiceType,
  type TrousseauItem,
} from '@laundry/domain';
import { CatalogEditorModal } from '@/components/CatalogEditorModal';
import { ExtraItemModal } from '@/components/ExtraItemModal';
import {
  AppInput,
  AppScreen,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  FieldLabel,
  GlassCard,
  LoadingState,
  ModalBackdrop,
  modalInputStyle,
  modalSurfaceStyle,
  QuantityStepper,
  ScreenHeader,
  ValueText,
} from '@/components/ui';
import { repository } from '@/lib/repository';
import { buildComandaHtml, shareHtmlDocument } from '@/lib/print';
import { useApp } from '@/providers/AppProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

type ServiceLineMap = Record<string, { qtyLP: number; qtyP: number }>;
type ProductLineMap = Record<string, number>;

export default function CalculatorScreen() {
  const { settings, updateSettings, saveSettings, theme } = useApp();
  const { role, userId } = useAuth();
  const { toast } = useToast();

  const [catalog, setCatalog] = useState<string>(settings.lastCatalog || 'services');
  const [serviceType, setServiceType] = useState<ServiceType>(settings.lastServiceType || 'Normal');
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [trousseauItems, setTrousseauItems] = useState<TrousseauItem[]>([]);
  const [serviceLines, setServiceLines] = useState<ServiceLineMap>({});
  const [productLines, setProductLines] = useState<ProductLineMap>({});
  const [extraServiceItems, setExtraServiceItems] = useState<CalcLineService[]>([]);
  const [extraProductItems, setExtraProductItems] = useState<CalcLineTrousseau[]>([]);
  const [notes, setNotes] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [savingHistory, setSavingHistory] = useState(false);
  const [sharingComanda, setSharingComanda] = useState(false);
  const [savingExtraItem, setSavingExtraItem] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveDate, setSaveDate] = useState(new Date().toISOString().slice(0, 10));

  const customCatalogs = settings.customCatalogs ?? [];
  const serviceMode = useMemo(() => isServiceCatalog(catalog, customCatalogs), [catalog, customCatalogs]);
  const catalogTitle = useMemo(() => getCatalogTitle(catalog, customCatalogs), [catalog, customCatalogs]);
  const multiplier = serviceMode ? (MULTIPLIERS[serviceType] ?? 1) : 1;

  const loadItems = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const data = await repository.getConfig(getCatalogStorageKey(catalog));
      if (serviceMode) {
        setServiceItems((data as ServiceItem[]) ?? []);
        setTrousseauItems([]);
      } else {
        setTrousseauItems((data as TrousseauItem[]) ?? []);
        setServiceItems([]);
      }
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Nao foi possivel carregar o catalogo.');
      setServiceItems([]);
      setTrousseauItems([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, [catalog, serviceMode]);

  useEffect(() => {
    updateSettings({ lastCatalog: catalog, lastServiceType: serviceType });
    void saveSettings({ lastCatalog: catalog, lastServiceType: serviceType }).catch(() => undefined);
  }, [catalog, serviceType, saveSettings, updateSettings]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const historyItems = useMemo(() => (
    serviceMode
      ? buildServiceHistoryItems(serviceItems, serviceLines, extraServiceItems)
      : buildProductHistoryItems(trousseauItems, productLines, extraProductItems)
  ), [extraProductItems, extraServiceItems, productLines, serviceItems, serviceLines, serviceMode, trousseauItems]);

  const subtotal = useMemo(() => historyItems.reduce((sum, item) => sum + item.lineTotal, 0), [historyItems]);
  const total = subtotal * multiplier;
  const hasItems = historyItems.length > 0;

  const resetSheet = () => {
    setServiceLines({});
    setProductLines({});
    setExtraServiceItems([]);
    setExtraProductItems([]);
    setNotes('');
    setServiceType('Normal');
    toast('Planilha limpa.', 'info');
  };

  const updateServiceQty = (itemId: string, field: 'qtyLP' | 'qtyP', value: number) => {
    setServiceLines((current) => ({
      ...current,
      [itemId]: {
        qtyLP: current[itemId]?.qtyLP ?? 0,
        qtyP: current[itemId]?.qtyP ?? 0,
        [field]: value,
      },
    }));
  };

  const updateProductQty = (itemId: string, value: number) => {
    setProductLines((current) => ({ ...current, [itemId]: value }));
  };

  const handleAddExtra = async (values: { name: string; priceLP?: number; priceP?: number | null; price?: number; makePermanent: boolean }) => {
    if (!values.name.trim()) {
      toast('Informe o nome do item.', 'error');
      return;
    }

    try {
      setSavingExtraItem(true);
      if (serviceMode) {
        const item: CalcLineService = {
          itemId: `extra_${Date.now()}`,
          name: values.name.trim(),
          priceLP: values.priceLP ?? 0,
          priceP: values.priceP ?? null,
          qtyLP: 1,
          qtyP: 0,
          isExtra: true,
        };
        setExtraServiceItems((current) => [...current, item]);
        if (values.makePermanent) {
          const nextItems = [...serviceItems, { id: item.itemId, name: item.name, priceLP: item.priceLP, priceP: item.priceP }];
          await repository.setConfig(getCatalogStorageKey(catalog), nextItems);
          setServiceItems(nextItems);
        }
      } else {
        const item: CalcLineTrousseau = {
          itemId: `extra_${Date.now()}`,
          name: values.name.trim(),
          price: values.price ?? 0,
          qty: 1,
          isExtra: true,
        };
        setExtraProductItems((current) => [...current, item]);
        if (values.makePermanent) {
          const nextItems = [...trousseauItems, { id: item.itemId, name: item.name, price: item.price }];
          await repository.setConfig(getCatalogStorageKey(catalog), nextItems);
          setTrousseauItems(nextItems);
        }
      }

      setExtraModalOpen(false);
      toast(values.makePermanent ? 'Item extra salvo no catalogo.' : 'Item extra adicionado.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel adicionar o item extra.', 'error');
    } finally {
      setSavingExtraItem(false);
    }
  };

  const handleSave = async () => {
    if (!hasItems) {
      toast('Adicione itens antes de salvar.', 'error');
      return;
    }

    try {
      setSavingHistory(true);
      const record = createHistoryRecord({
        id: uuidv4(),
        date: saveDate,
        type: catalogTitle,
        serviceType: serviceMode ? serviceType : 'Normal',
        items: historyItems,
        notes,
        role,
        authorId: userId,
        useMultiplier: serviceMode,
      });

      await repository.addHistory(record);
      setSaveModalOpen(false);
      resetSheet();
      toast('Registro salvo no historico.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel salvar o historico.', 'error');
    } finally {
      setSavingHistory(false);
    }
  };

  const handleShareComanda = async () => {
    if (!hasItems) {
      toast('Adicione itens antes de gerar a comanda.', 'error');
      return;
    }

    try {
      setSharingComanda(true);
      const rows = historyItems.flatMap((item) => {
        if (item.priceLP !== undefined) {
          const serviceRows: Array<{ name: string; qty: string; unitPrice: string; total: string }> = [];
          if ((item.qtyLP ?? 0) > 0) {
            serviceRows.push({
              name: `${item.name} (LP)`,
              qty: String(item.qtyLP ?? 0),
              unitPrice: formatCurrency(item.priceLP || 0),
              total: formatCurrency((item.priceLP || 0) * (item.qtyLP || 0)),
            });
          }
          if (item.priceP != null && (item.qtyP ?? 0) > 0) {
            serviceRows.push({
              name: `${item.name} (P)`,
              qty: String(item.qtyP ?? 0),
              unitPrice: formatCurrency(item.priceP || 0),
              total: formatCurrency((item.priceP || 0) * (item.qtyP || 0)),
            });
          }
          return serviceRows;
        }

        return [{
          name: item.name,
          qty: String(item.qty ?? 0),
          unitPrice: formatCurrency(item.price || 0),
          total: formatCurrency(item.lineTotal),
        }];
      });

      await shareHtmlDocument(buildComandaHtml({
        title: `Comanda - ${catalogTitle}`,
        serviceType: serviceMode ? serviceType : 'Preco unico',
        subtotal,
        total,
        items: rows,
      }));
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel gerar a comanda.', 'error');
    } finally {
      setSharingComanda(false);
    }
  };

  return (
    <>
      <AppScreen>
        <ScreenHeader title="Calculadora" subtitle="Mesma regra do web, adaptada para fluxo mobile." />

        <GlassCard style={{ gap: 14 }}>
          <FieldLabel>Catalogo</FieldLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Chip label="Servicos" active={catalog === 'services'} onPress={() => setCatalog('services')} />
            <Chip label="Enxoval" active={catalog === 'trousseau'} onPress={() => setCatalog('trousseau')} />
            {customCatalogs.map((item) => (
              <Chip key={item.id} label={item.name} active={catalog === item.id} onPress={() => setCatalog(item.id)} />
            ))}
          </View>

          {serviceMode ? (
            <>
              <FieldLabel>Tipo de servico</FieldLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {(['Normal', 'Expresso', 'Urgente'] as ServiceType[]).map((item) => (
                  <Chip key={item} label={item} active={serviceType === item} onPress={() => setServiceType(item)} />
                ))}
              </View>
            </>
          ) : null}
        </GlassCard>

        {loadingCatalog ? <LoadingState label="Carregando catalogo..." /> : null}
        {!loadingCatalog && catalogError ? (
          <ErrorState
            title="Falha ao carregar catalogo"
            subtitle={catalogError}
            onRetry={() => { void loadItems(); }}
          />
        ) : null}

        {!loadingCatalog && !catalogError && !serviceItems.length && !trousseauItems.length && !extraServiceItems.length && !extraProductItems.length ? (
          <EmptyState title="Catalogo vazio" subtitle="Abra Modificar Itens para cadastrar os valores deste catalogo." />
        ) : null}

        {!loadingCatalog && !catalogError && serviceMode ? serviceItems.map((item) => (
          <GlassCard key={item.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                  LP {formatCurrency(item.priceLP)}{item.priceP != null ? ` - P ${formatCurrency(item.priceP)}` : ''}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>LP</Text>
                <QuantityStepper value={serviceLines[item.id]?.qtyLP ?? 0} onChange={(value) => updateServiceQty(item.id, 'qtyLP', value)} />
              </View>
              {item.priceP != null ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>P</Text>
                  <QuantityStepper value={serviceLines[item.id]?.qtyP ?? 0} onChange={(value) => updateServiceQty(item.id, 'qtyP', value)} />
                </View>
              ) : null}
            </View>
          </GlassCard>
        )) : null}

        {!loadingCatalog && !catalogError && !serviceMode ? trousseauItems.map((item) => (
          <GlassCard key={item.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{formatCurrency(item.price)}</Text>
              </View>
              <QuantityStepper value={productLines[item.id] ?? 0} onChange={(value) => updateProductQty(item.id, value)} />
            </View>
          </GlassCard>
        )) : null}

        {serviceMode ? extraServiceItems.map((item) => (
          <GlassCard key={item.itemId} style={{ gap: 12 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{item.name} - Extra</Text>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>LP</Text>
                <QuantityStepper
                  value={item.qtyLP}
                  onChange={(value) => setExtraServiceItems((current) => current.map((entry) => entry.itemId === item.itemId ? { ...entry, qtyLP: value } : entry))}
                />
              </View>
              {item.priceP != null ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>P</Text>
                  <QuantityStepper
                    value={item.qtyP}
                    onChange={(value) => setExtraServiceItems((current) => current.map((entry) => entry.itemId === item.itemId ? { ...entry, qtyP: value } : entry))}
                  />
                </View>
              ) : null}
            </View>
          </GlassCard>
        )) : extraProductItems.map((item) => (
          <GlassCard key={item.itemId} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{item.name} - Extra</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{formatCurrency(item.price)}</Text>
              </View>
              <QuantityStepper
                value={item.qty}
                onChange={(value) => setExtraProductItems((current) => current.map((entry) => entry.itemId === item.itemId ? { ...entry, qty: value } : entry))}
              />
            </View>
          </GlassCard>
        ))}

        <GlassCard style={{ gap: 12, marginBottom: 24 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }}>Resumo</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.textSecondary }}>Catalogo</Text>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{catalogTitle}</Text>
          </View>
          {serviceMode ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.textSecondary }}>Servico</Text>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{serviceType} - x{multiplier}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.textSecondary }}>Subtotal</Text>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 16, fontWeight: '700' }}>Total</Text>
            <ValueText>{formatCurrency(total)}</ValueText>
          </View>
          <Button label="Salvar no Historico" onPress={() => { setSaveDate(new Date().toISOString().slice(0, 10)); setSaveModalOpen(true); }} disabled={!hasItems} fullWidth />
          <Button label="Gerar Comanda (PDF)" onPress={handleShareComanda} variant="secondary" loading={sharingComanda} disabled={!hasItems} fullWidth />
          <Button label="Adicionar Item Extra" onPress={() => setExtraModalOpen(true)} variant="secondary" fullWidth />
          <Button label="Modificar Itens" onPress={() => setEditorOpen(true)} variant="secondary" fullWidth />
          <Button label="Limpar Planilha" onPress={resetSheet} variant="ghost" fullWidth />
        </GlassCard>
      </AppScreen>

      <CatalogEditorModal
        visible={editorOpen}
        catalogType={catalog}
        customCatalogs={customCatalogs}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          toast('Catalogo atualizado.');
          void loadItems();
        }}
      />
      <ExtraItemModal
        visible={extraModalOpen}
        serviceMode={serviceMode}
        onClose={() => setExtraModalOpen(false)}
        onConfirm={handleAddExtra}
        confirmLoading={savingExtraItem}
      />

      <Modal animationType="slide" transparent visible={saveModalOpen} onRequestClose={() => setSaveModalOpen(false)}>
        <ModalBackdrop>
          <GlassCard style={[{ gap: 14, marginBottom: 24 }, modalSurfaceStyle(theme, settings, 'primary')]}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Salvar no historico</Text>
            <View>
              <FieldLabel>Data</FieldLabel>
              <AppInput
                value={saveDate}
                onChangeText={setSaveDate}
                placeholder="YYYY-MM-DD"
                style={modalInputStyle(theme)}
              />
            </View>
            <View>
              <FieldLabel>Observacoes</FieldLabel>
              <AppInput
                multiline
                numberOfLines={4}
                style={[{ minHeight: 110, textAlignVertical: 'top' }, modalInputStyle(theme)]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Adicione observacoes do registro"
              />
            </View>
            <GlassCard style={[{ gap: 8 }, modalSurfaceStyle(theme, settings, 'secondary')]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary }}>Catalogo</Text>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{catalogTitle}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary }}>Total</Text>
                <Text style={{ color: theme.colors.accent, fontSize: 18, fontWeight: '800' }}>{formatCurrency(total)}</Text>
              </View>
            </GlassCard>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Cancelar" onPress={() => setSaveModalOpen(false)} variant="secondary" disabled={savingHistory} />
              <Button label="Confirmar e salvar" onPress={handleSave} loading={savingHistory} />
            </View>
          </GlassCard>
        </ModalBackdrop>
      </Modal>
    </>
  );
}
