import React, { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { recalculateHistoryRecord, type HistoryItemDetail, type HistoryRecord } from '@laundry/domain';
import { DateRangeModal } from '@/components/DateRangeModal';
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
  ScreenHeader,
} from '@/components/ui';
import { repository } from '@/lib/repository';
import { buildRecordHtml, shareHtmlDocument } from '@/lib/print';
import { useApp } from '@/providers/AppProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';

type SortKey = 'date' | 'type' | 'total';
type SortDir = 'asc' | 'desc';

export default function DashboardScreen() {
  const { theme } = useApp();
  const { userId, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Ambos' | 'Servicos' | 'Enxoval'>('Ambos');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [editing, setEditing] = useState<HistoryRecord | null>(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<'refresh' | 'save' | 'delete' | 'clear' | 'pin' | null>(null);

  const historyQuery = useQuery({
    queryKey: ['history', startDate, endDate, typeFilter],
    queryFn: () => repository.getHistory(startDate || undefined, endDate || undefined, typeFilter === 'Servicos' ? 'Serviços' : typeFilter),
  });

  const sortedRecords = useMemo(() => {
    const records = [...(historyQuery.data ?? [])];
    records.sort((a, b) => {
      let result = 0;
      if (sortKey === 'date') result = a.date.localeCompare(b.date);
      if (sortKey === 'type') result = a.type.localeCompare(b.type);
      if (sortKey === 'total') result = a.total - b.total;
      return sortDir === 'asc' ? result : -result;
    });
    return records;
  }, [historyQuery.data, sortDir, sortKey]);

  const refresh = async () => {
    setBusyAction('refresh');
    try {
      await queryClient.invalidateQueries({ queryKey: ['history'] });
      await historyQuery.refetch();
    } finally {
      setBusyAction(null);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const updateEditingItem = (index: number, nextItem: HistoryItemDetail) => {
    if (!editing) return;
    const nextItems = editing.items.map((item, itemIndex) => itemIndex === index ? nextItem : item);
    setEditing({ ...editing, items: nextItems });
  };

  const saveEditing = async () => {
    if (!editing) return;
    try {
      setBusyAction('save');
      const nextRecord = recalculateHistoryRecord(editing);
      await repository.updateHistory(nextRecord);
      setEditing(null);
      setSelected(nextRecord);
      await refresh();
      toast('Registro atualizado.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel atualizar o registro.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      setBusyAction('delete');
      await repository.deleteHistory(recordId);
      setSelected(null);
      setEditing(null);
      await refresh();
      toast('Registro excluido.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel excluir o registro.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const clearFiltered = async () => {
    try {
      setBusyAction('clear');
      await repository.clearHistory(startDate || undefined, endDate || undefined, typeFilter === 'Servicos' ? 'Serviços' : typeFilter);
      setSelected(null);
      await refresh();
      toast('Registros filtrados removidos.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel limpar os registros filtrados.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const pinToBoard = async (record: HistoryRecord) => {
    if (!record.notes || !userId) return;
    try {
      setBusyAction('pin');
      await repository.addNote({
        id: uuidv4(),
        content: `Referente ao registro de ${record.date} (${record.type}):\n${record.notes}`,
        authorId: userId,
        authorRole: role ?? undefined,
        visibility: 'private',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        relatedRecordId: record.id,
        readBy: [],
        recipients: [],
      });
      toast('Nota criada no quadro.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Nao foi possivel fixar a nota no quadro.', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <>
      <AppScreen>
        <ScreenHeader title="Dashboard" subtitle="Historico real de registros com filtros, detalhe e edicao." />

        <GlassCard style={{ gap: 14 }}>
          <FieldLabel>Periodo</FieldLabel>
          <Button
            label={startDate ? `${startDate} ate ${endDate || startDate}` : 'Selecionar periodo'}
            onPress={() => setDateModalOpen(true)}
            variant="secondary"
            fullWidth
          />
          <FieldLabel>Tipo</FieldLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['Ambos', 'Servicos', 'Enxoval'] as const).map((item) => (
              <Chip key={item} label={item} active={typeFilter === item} onPress={() => setTypeFilter(item)} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Atualizar" onPress={() => { void refresh(); }} variant="secondary" loading={busyAction === 'refresh'} />
            <Button
              label="Limpar filtrados"
              onPress={() => Alert.alert('Limpar registros', 'Isso removera os registros do filtro atual. Continuar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: () => void clearFiltered() },
              ])}
              variant="ghost"
              disabled={busyAction === 'clear'}
            />
          </View>
        </GlassCard>

        <GlassCard style={{ gap: 10 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Ordenacao</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Chip label={`Data ${sortKey === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`} active={sortKey === 'date'} onPress={() => toggleSort('date')} />
            <Chip label={`Tipo ${sortKey === 'type' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`} active={sortKey === 'type'} onPress={() => toggleSort('type')} />
            <Chip label={`Total ${sortKey === 'total' ? (sortDir === 'asc' ? '↑' : '↓') : ''}`} active={sortKey === 'total'} onPress={() => toggleSort('total')} />
          </View>
        </GlassCard>

        {historyQuery.isLoading ? <LoadingState label="Carregando registros..." /> : null}
        {historyQuery.isError ? (
          <ErrorState
            title="Falha ao carregar registros"
            subtitle={historyQuery.error instanceof Error ? historyQuery.error.message : 'Nao foi possivel obter o historico.'}
            onRetry={() => { void historyQuery.refetch(); }}
          />
        ) : null}
        {!historyQuery.isLoading && !historyQuery.isError && sortedRecords.length === 0 ? (
          <EmptyState title="Nenhum registro encontrado" subtitle="Ajuste o periodo ou salve um novo historico na calculadora." />
        ) : null}

        {!historyQuery.isError && sortedRecords.map((record) => (
          <Pressable key={record.id} onPress={() => setSelected(record)}>
            <GlassCard style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 17, fontWeight: '800' }}>{record.date}</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>{record.type} - {record.serviceType} - {record.items.length} itens</Text>
                </View>
                <Text style={{ color: theme.colors.accent, fontSize: 18, fontWeight: '800' }}>
                  {record.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </View>
              {record.notes ? (
                <View style={{ borderLeftWidth: 4, borderLeftColor: theme.colors.accent, paddingLeft: 12 }}>
                  <Text numberOfLines={2} style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{record.notes}</Text>
                </View>
              ) : null}
            </GlassCard>
          </Pressable>
        ))}
      </AppScreen>

      <DateRangeModal
        visible={dateModalOpen}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setDateModalOpen(false)}
        onApply={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setDateModalOpen(false);
        }}
      />

      <Modal animationType="slide" visible={!!selected} onRequestClose={() => setSelected(null)}>
        <View style={{ backgroundColor: theme.colors.bgPrimary, flex: 1, padding: 16, paddingTop: 56 }}>
          {selected ? (
            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
              <ScreenHeader title={selected.date} subtitle={`${selected.type} - ${selected.serviceType}`} right={<Button label="Fechar" onPress={() => setSelected(null)} variant="ghost" />} />
              {selected.notes ? (
                <GlassCard style={{ gap: 10 }}>
                  <Text style={{ color: theme.colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Observacoes</Text>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20 }}>{selected.notes}</Text>
                  <Button label="Fixar no Quadro" onPress={() => { void pinToBoard(selected); }} variant="secondary" loading={busyAction === 'pin'} fullWidth />
                </GlassCard>
              ) : null}
              {selected.items.map((item) => (
                <GlassCard key={`${selected.id}-${item.itemId}-${item.name}`} style={{ gap: 8 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{item.name}</Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                    {item.priceLP !== undefined
                      ? `LP ${item.qtyLP ?? 0} - P ${item.qtyP ?? 0}`
                      : `Qtd ${item.qty ?? 0}`}
                  </Text>
                  <Text style={{ color: theme.colors.accent, fontSize: 16, fontWeight: '800' }}>
                    {item.lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </Text>
                </GlassCard>
              ))}
              <GlassCard style={{ gap: 8 }}>
                <Text style={{ color: theme.colors.textSecondary }}>Total</Text>
                <Text style={{ color: theme.colors.accent, fontSize: 24, fontWeight: '800' }}>
                  {selected.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Text>
              </GlassCard>
              <Button label="Compartilhar relatorio" onPress={() => shareHtmlDocument(buildRecordHtml(selected))} fullWidth />
              <Button label="Editar registro" onPress={() => setEditing({ ...selected, items: selected.items.map((item) => ({ ...item })) })} variant="secondary" fullWidth />
              <Button
                label="Excluir registro"
                onPress={() => Alert.alert('Excluir registro', 'Esse registro sera removido permanentemente.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Excluir', style: 'destructive', onPress: () => void deleteRecord(selected.id) },
                ])}
                variant="danger"
                loading={busyAction === 'delete'}
                fullWidth
              />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <Modal animationType="slide" visible={!!editing} onRequestClose={() => setEditing(null)}>
        <View style={{ backgroundColor: theme.colors.bgPrimary, flex: 1, padding: 16, paddingTop: 56 }}>
          {editing ? (
            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
              <ScreenHeader title="Editar registro" subtitle="Ajuste data, tipo de servico e quantidades." right={<Button label="Fechar" onPress={() => setEditing(null)} variant="ghost" />} />
              <View>
                <FieldLabel>Data</FieldLabel>
                <AppInput value={editing.date} onChangeText={(value) => setEditing({ ...editing, date: value })} />
              </View>
              <View>
                <FieldLabel>Tipo de servico</FieldLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {(['Normal', 'Expresso', 'Urgente'] as const).map((item) => (
                    <Chip key={item} label={item} active={editing.serviceType === item} onPress={() => setEditing({ ...editing, serviceType: item })} />
                  ))}
                </View>
              </View>
              {editing.items.map((item, index) => (
                <GlassCard key={`${editing.id}-${item.itemId}-${index}`} style={{ gap: 10 }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{item.name}</Text>
                  {item.priceLP !== undefined ? (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <FieldLabel>Qtd LP</FieldLabel>
                        <AppInput
                          keyboardType="number-pad"
                          value={String(item.qtyLP ?? 0)}
                          onChangeText={(value) => updateEditingItem(index, { ...item, qtyLP: Number(value || 0) })}
                        />
                      </View>
                      {item.priceP != null ? (
                        <View style={{ flex: 1 }}>
                          <FieldLabel>Qtd P</FieldLabel>
                          <AppInput
                            keyboardType="number-pad"
                            value={String(item.qtyP ?? 0)}
                            onChangeText={(value) => updateEditingItem(index, { ...item, qtyP: Number(value || 0) })}
                          />
                        </View>
                      ) : null}
                    </View>
                  ) : (
                    <View>
                      <FieldLabel>Quantidade</FieldLabel>
                      <AppInput
                        keyboardType="number-pad"
                        value={String(item.qty ?? 0)}
                        onChangeText={(value) => updateEditingItem(index, { ...item, qty: Number(value || 0) })}
                      />
                    </View>
                  )}
                </GlassCard>
              ))}
              <Button label="Salvar alteracoes" onPress={saveEditing} loading={busyAction === 'save'} fullWidth />
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

