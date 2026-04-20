import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  aggregateCostByCategory,
  aggregateTrendByDay,
  aggregateVolumeByCategory,
  formatCurrency,
} from '@laundry/domain';
import Svg, { Circle, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { DateRangeModal } from '@/components/DateRangeModal';
import { AppScreen, Button, Chip, EmptyState, ErrorState, GlassCard, LoadingState, ScreenHeader, ValueText } from '@/components/ui';
import { repository } from '@/lib/repository';
import { buildStatisticsHtml, shareHtmlDocument } from '@/lib/print';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/providers/ToastProvider';

type Range = '7d' | '30d' | '90d' | 'custom';

function getDateRange(range: Range, customStart: string, customEnd: string) {
  const end = new Date().toISOString().slice(0, 10);
  if (range === 'custom') {
    return { start: customStart, end: customEnd || customStart || end };
  }
  const amount = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const start = new Date();
  start.setDate(start.getDate() - amount);
  return { start: start.toISOString().slice(0, 10), end };
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y, 'L', x, y, 'Z'].join(' ');
}

export default function StatisticsScreen() {
  const { theme } = useApp();
  const { toast } = useToast();
  const [range, setRange] = useState<Range>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Ambos' | 'Servicos' | 'Enxoval'>('Ambos');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const dateRange = getDateRange(range, customStart, customEnd);
  const historyQuery = useQuery({
    queryKey: ['statistics', range, customStart, customEnd, typeFilter],
    queryFn: () => repository.getHistory(dateRange.start || undefined, dateRange.end || undefined, typeFilter === 'Servicos' ? 'Serviços' : typeFilter),
  });

  const records = historyQuery.data ?? [];
  const costByCategory = useMemo(() => aggregateCostByCategory(records), [records]);
  const volumeByCategory = useMemo(() => aggregateVolumeByCategory(records), [records]);
  const trendByDay = useMemo(() => aggregateTrendByDay(records), [records]);
  const totalValue = useMemo(() => records.reduce((sum, record) => sum + record.total, 0), [records]);

  const costData = Object.entries(costByCategory).map(([x, y]) => ({ x, y }));
  const volumeData = Object.entries(volumeByCategory).map(([x, y]) => ({ x, y }));
  const trendData = Object.entries(trendByDay).sort((a, b) => a[0].localeCompare(b[0])).map(([x, y]) => ({ x, y }));
  const pieColors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const maxVolume = Math.max(...volumeData.map((entry) => Number(entry.y)), 1);
  const maxTrend = Math.max(...trendData.map((entry) => Number(entry.y)), 1);
  const totalPie = Math.max(costData.reduce((sum, entry) => sum + Number(entry.y), 0), 1);

  return (
    <>
      <AppScreen>
        <ScreenHeader title="Estatisticas" subtitle="Mesmos calculos do web com visualizacao nativa no Android." />

        <GlassCard style={{ gap: 12 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Periodo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['7d', '30d', '90d', 'custom'] as Range[]).map((item) => (
              <Chip
                key={item}
                label={item === 'custom' ? 'Custom' : item}
                active={range === item}
                onPress={() => {
                  setRange(item);
                  if (item === 'custom') setDateModalOpen(true);
                }}
              />
            ))}
          </View>
          {range === 'custom' ? (
            <Button label={customStart ? `${customStart} ate ${customEnd || customStart}` : 'Selecionar periodo customizado'} onPress={() => setDateModalOpen(true)} variant="secondary" fullWidth />
          ) : null}
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Filtro</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {(['Ambos', 'Servicos', 'Enxoval'] as const).map((item) => (
              <Chip key={item} label={item} active={typeFilter === item} onPress={() => setTypeFilter(item)} />
            ))}
          </View>
        </GlassCard>

        <GlassCard style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>Valor total do periodo</Text>
          <ValueText>{formatCurrency(totalValue)}</ValueText>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>{records.length} registro(s)</Text>
        </GlassCard>

        {historyQuery.isLoading ? <LoadingState label="Calculando estatisticas..." /> : null}
        {historyQuery.isError ? (
          <ErrorState
            title="Falha ao carregar estatisticas"
            subtitle={historyQuery.error instanceof Error ? historyQuery.error.message : 'Nao foi possivel obter os dados graficos.'}
            onRetry={() => { void historyQuery.refetch(); }}
          />
        ) : null}
        {!historyQuery.isLoading && !historyQuery.isError && records.length === 0 ? (
          <EmptyState title="Sem dados para este periodo" subtitle="Ajuste o filtro ou salve registros na calculadora." />
        ) : null}

        {!historyQuery.isLoading && !historyQuery.isError && records.length > 0 ? (
          <>
            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Custo por categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ alignItems: 'center', flexDirection: 'row', gap: 18 }}>
                  <Svg width={220} height={220}>
                    {costData.reduce((acc, entry, index) => {
                      const angle = (Number(entry.y) / totalPie) * 360;
                      const start = acc.currentAngle;
                      const end = start + angle;
                      acc.currentAngle = end;
                      acc.paths.push(<Path key={entry.x} d={describeArc(110, 110, 88, start, end)} fill={pieColors[index % pieColors.length]} />);
                      return acc;
                    }, { currentAngle: 0, paths: [] as React.ReactNode[] }).paths}
                    <Circle cx={110} cy={110} fill={theme.colors.bgPrimary} r={48} />
                  </Svg>
                  <View style={{ gap: 10, paddingRight: 12 }}>
                    {costData.map((entry, index) => (
                      <View key={entry.x} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <View style={{ backgroundColor: pieColors[index % pieColors.length], borderRadius: 999, height: 10, width: 10 }} />
                        <Text style={{ color: theme.colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{entry.x}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </GlassCard>

            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Volume por categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Svg width={Math.max(340, volumeData.length * 72)} height={260}>
                  {volumeData.map((entry, index) => {
                    const width = 38;
                    const height = (Number(entry.y) / maxVolume) * 150;
                    const x = 32 + index * 64;
                    const y = 180 - height;
                    return (
                      <React.Fragment key={entry.x}>
                        <Rect x={x} y={y} width={width} height={height} rx={10} fill={theme.colors.accent} />
                        <SvgText x={x + width / 2} y={212} fill={theme.colors.textMuted} fontSize="10" textAnchor="middle">
                          {String(entry.x).slice(0, 10)}
                        </SvgText>
                        <SvgText x={x + width / 2} y={y - 6} fill={theme.colors.textPrimary} fontSize="10" textAnchor="middle">
                          {String(entry.y)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  <Line x1="20" y1="180" x2={Math.max(320, volumeData.length * 72)} y2="180" stroke={theme.colors.glassBorder} strokeWidth="1" />
                </Svg>
              </ScrollView>
            </GlassCard>

            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Tendencia diaria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Svg width={Math.max(340, trendData.length * 72)} height={260}>
                  <Polyline
                    fill="none"
                    points={trendData.map((entry, index) => {
                      const x = 36 + index * 64;
                      const y = 180 - (Number(entry.y) / maxTrend) * 140;
                      return `${x},${y}`;
                    }).join(' ')}
                    stroke={theme.colors.accent}
                    strokeWidth="3"
                  />
                  {trendData.map((entry, index) => {
                    const x = 36 + index * 64;
                    const y = 180 - (Number(entry.y) / maxTrend) * 140;
                    return (
                      <React.Fragment key={entry.x}>
                        <Circle cx={x} cy={y} fill={theme.colors.accent} r={4} />
                        <SvgText x={x} y={212} fill={theme.colors.textMuted} fontSize="10" textAnchor="middle">
                          {String(entry.x).slice(5)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  <Line x1="20" y1="180" x2={Math.max(320, trendData.length * 72)} y2="180" stroke={theme.colors.glassBorder} strokeWidth="1" />
                </Svg>
              </ScrollView>
            </GlassCard>

            <Button
              label="Compartilhar relatorio"
              onPress={async () => {
                try {
                  setSharing(true);
                  await shareHtmlDocument(buildStatisticsHtml({
                    start: dateRange.start,
                    end: dateRange.end,
                    typeFilter: typeFilter === 'Servicos' ? 'Serviços' : typeFilter,
                    totalValue,
                    costByCategory,
                    volumeByCategory,
                    trendByDay,
                  }));
                } catch (error) {
                  toast(error instanceof Error ? error.message : 'Nao foi possivel compartilhar o relatorio.', 'error');
                } finally {
                  setSharing(false);
                }
              }}
              loading={sharing}
              fullWidth
            />
          </>
        ) : null}
      </AppScreen>

      <DateRangeModal
        visible={dateModalOpen}
        startDate={customStart}
        endDate={customEnd}
        onClose={() => setDateModalOpen(false)}
        onApply={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
          setRange('custom');
          setDateModalOpen(false);
        }}
      />
    </>
  );
}

