import React, { useState } from 'react';
import { Modal, Switch, Text, View } from 'react-native';
import { AppInput, Button, FieldLabel, GlassCard, ModalBackdrop, modalInputStyle, modalSurfaceStyle } from '@/components/ui';
import { useApp } from '@/providers/AppProvider';

interface ExtraItemValues {
  name: string;
  priceLP?: number;
  priceP?: number | null;
  price?: number;
  makePermanent: boolean;
}

interface Props {
  visible: boolean;
  serviceMode: boolean;
  onClose: () => void;
  onConfirm: (values: ExtraItemValues) => void;
  confirmLoading?: boolean;
}

export function ExtraItemModal({ visible, serviceMode, onClose, onConfirm, confirmLoading = false }: Props) {
  const { theme, settings } = useApp();
  const [name, setName] = useState('');
  const [priceLP, setPriceLP] = useState('');
  const [priceP, setPriceP] = useState('');
  const [price, setPrice] = useState('');
  const [makePermanent, setMakePermanent] = useState(false);

  const reset = () => {
    setName('');
    setPriceLP('');
    setPriceP('');
    setPrice('');
    setMakePermanent(false);
  };

  const handleConfirm = () => {
    onConfirm({
      name,
      priceLP: Number(priceLP || 0),
      priceP: priceP === '' ? null : Number(priceP || 0),
      price: Number(price || 0),
      makePermanent,
    });
    reset();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <ModalBackdrop>
        <GlassCard style={[{ gap: 14, marginBottom: 24 }, modalSurfaceStyle(theme, settings, 'primary')]}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Adicionar item extra</Text>
          <View>
            <FieldLabel>Nome</FieldLabel>
            <AppInput value={name} onChangeText={setName} placeholder="Nome do item" style={modalInputStyle(theme)} />
          </View>
          {serviceMode ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Preco LP</FieldLabel>
                <AppInput value={priceLP} onChangeText={setPriceLP} keyboardType="decimal-pad" style={modalInputStyle(theme)} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Preco P</FieldLabel>
                <AppInput value={priceP} onChangeText={setPriceP} keyboardType="decimal-pad" style={modalInputStyle(theme)} />
              </View>
            </View>
          ) : (
            <View>
              <FieldLabel>Preco</FieldLabel>
              <AppInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" style={modalInputStyle(theme)} />
            </View>
          )}
          <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' }}>Salvar no catalogo</Text>
            <Switch value={makePermanent} onValueChange={setMakePermanent} thumbColor={theme.colors.accent} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button label="Cancelar" onPress={() => { reset(); onClose(); }} variant="secondary" disabled={confirmLoading} />
            <Button label="Adicionar" onPress={handleConfirm} loading={confirmLoading} />
          </View>
        </GlassCard>
      </ModalBackdrop>
    </Modal>
  );
}
