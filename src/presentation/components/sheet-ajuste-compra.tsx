import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { rotuloDaUnidade, Unidade } from '../../domain/shared/unidade';
import { espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { Texto } from './texto';

export type SheetAjusteCompraProps = {
  visivel: boolean;
  nome: string;
  unidade: Unidade;
  /** Valores atuais em decimal, já convertidos pela camada de apresentação. */
  quantidadeInicial: number;
  precoInicial: number | null;
  onFechar: () => void;
  onSalvar: (dados: { quantidade: number; preco: number | null }) => void;
};

/**
 * Painel sobreposto, sem trocar de rota (task 3.2) — diferente da pergunta
 * de preço (D4), aqui um sheet é aceitável: é uma ação deliberada de ajuste,
 * não uma interrupção a cada item marcado.
 */
export function SheetAjusteCompra({
  visivel,
  nome,
  unidade,
  quantidadeInicial,
  precoInicial,
  onFechar,
  onSalvar,
}: SheetAjusteCompraProps) {
  const tema = useTheme();
  const [quantidade, setQuantidade] = useState(String(quantidadeInicial).replace('.', ','));
  const [preco, setPreco] = useState(precoInicial !== null ? String(precoInicial).replace('.', ',') : '');

  function salvar() {
    const quantidadeNumerica = Number(quantidade.replace(',', '.'));
    const precoNumerico = preco.trim() === '' ? null : Number(preco.replace(',', '.'));
    onSalvar({
      quantidade: quantidadeNumerica > 0 ? quantidadeNumerica : quantidadeInicial,
      preco: precoNumerico !== null && precoNumerico >= 0 ? precoNumerico : null,
    });
    onFechar();
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable onPress={onFechar} accessibilityLabel="Fechar" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: tema.bg.raised,
            borderTopLeftRadius: raio.sheet,
            borderTopRightRadius: raio.sheet,
            padding: espaco.xl,
            gap: espaco.lg,
          }}
        >
          <Texto papel="body.lg">{nome}</Texto>
          <View style={{ flexDirection: 'row', gap: espaco.md }}>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo={`Quantidade (${rotuloDaUnidade(unidade, true)})`}
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo="Preço pago (opcional)"
                value={preco}
                onChangeText={setPreco}
                keyboardType="decimal-pad"
                placeholder="0,00"
              />
            </View>
          </View>
          <Botao titulo="Salvar" onPress={salvar} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
