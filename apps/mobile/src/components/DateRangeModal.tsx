import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { Button, GlassCard, ModalBackdrop, modalSurfaceStyle } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';

interface Props {
  visible: boolean;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onApply: (startDate: string, endDate: string) => void;
}

export function DateRangeModal({ visible, startDate, endDate, onClose, onApply }: Props) {
  const { theme, settings } = useApp();
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const [step, setStep] = useState<'start' | 'end'>(draftStart ? 'end' : 'start');

  const markedDates = useMemo(() => {
    const marks: Record<string, { selected?: boolean; startingDay?: boolean; endingDay?: boolean; color?: string; textColor?: string }> = {};
    if (draftStart) {
      marks[draftStart] = { selected: true, startingDay: true, color: theme.colors.accent, textColor: '#000' };
    }
    if (draftEnd) {
      marks[draftEnd] = { selected: true, endingDay: true, color: theme.colors.accent, textColor: '#000' };
    }
    return marks;
  }, [draftEnd, draftStart, theme.colors.accent]);

  const handlePressDay = (day: DateData) => {
    if (step === 'start') {
      setDraftStart(day.dateString);
      setDraftEnd('');
      setStep('end');
      return;
    }

    if (draftStart && day.dateString < draftStart) {
      setDraftEnd(draftStart);
      setDraftStart(day.dateString);
    } else {
      setDraftEnd(day.dateString);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <ModalBackdrop justifyContent="center">
        <GlassCard style={[{ gap: 16, width: '100%' }, modalSurfaceStyle(theme, settings, 'primary')]}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Periodo</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
            {step === 'start' ? 'Escolha a data inicial.' : 'Escolha a data final.'}
          </Text>
          <Calendar
            onDayPress={handlePressDay}
            markedDates={markedDates}
            theme={{
              calendarBackground: 'transparent',
              dayTextColor: theme.colors.textPrimary,
              monthTextColor: theme.colors.textPrimary,
              textDisabledColor: theme.colors.textMuted,
              arrowColor: theme.colors.accent,
              selectedDayBackgroundColor: theme.colors.accent,
              selectedDayTextColor: '#000',
              todayTextColor: theme.colors.accent,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancelar" onPress={onClose} variant="secondary" />
            <Button
              label="Aplicar"
              onPress={() => onApply(draftStart, draftEnd || draftStart)}
              disabled={!draftStart}
            />
          </View>
          <Pressable onPress={() => { setDraftStart(''); setDraftEnd(''); setStep('start'); }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center' }}>Limpar periodo</Text>
          </Pressable>
        </GlassCard>
      </ModalBackdrop>
    </Modal>
  );
}
