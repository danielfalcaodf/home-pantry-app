import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { rotuloDaUnidade, Unidade } from '../../domain/shared/unidade';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { EvitaTeclado } from './evita-teclado';
import { IconeSvg } from './icone-svg';
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
  // Duas casas sempre — é o formato que a máscara de dinheiro espera pra
  // reconhecer o valor semeado (CampoTexto extrai dígitos do que está aqui).
  const [preco, setPreco] = useState(precoInicial !== null ? precoInicial.toFixed(2).replace('.', ',') : '');
  const [erroQuantidade, setErroQuantidade] = useState<string | undefined>(undefined);

  function fechar() {
    setErroQuantidade(undefined);
    onFechar();
  }

  function salvar() {
    const quantidadeNumerica = Number(quantidade.replace(',', '.'));
    if (!(quantidadeNumerica > 0)) {
      setErroQuantidade('Diga quanto foi comprado');
      return;
    }
    // O campo de preço usa tipo="dinheiro" (máscara "de caixa registradora"):
    // só dígitos viram centavos, então nunca chega aqui um valor inválido —
    // ou está vazio (sem preço) ou é um número válido.
    const precoNumerico = preco.trim() === '' ? null : Number(preco.replace(',', '.'));
    onSalvar({
      quantidade: quantidadeNumerica,
      preco: precoNumerico,
    });
    fechar();
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <Pressable onPress={fechar} accessibilityLabel="Fechar" style={{ flex: 1, justifyContent: 'flex-end' }}>
        <EvitaTeclado style={{ flex: undefined }} testID="evita-teclado-ajuste-compra">
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Texto papel="body.lg">{nome}</Texto>
            <Pressable
              onPress={fechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={{
                minWidth: ALVO_TOQUE_MINIMO,
                minHeight: ALVO_TOQUE_MINIMO,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconeSvg path={icones.fechar} cor={tema.text.secondary} tamanho={20} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: espaco.md }}>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo={`Quantidade (${rotuloDaUnidade(unidade, true)})`}
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="decimal-pad"
                erro={erroQuantidade}
                tipo="quantidade"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo="Preço pago (opcional)"
                value={preco}
                onChangeText={setPreco}
                keyboardType="decimal-pad"
                tipo="dinheiro"
              />
            </View>
          </View>
          <Botao titulo="Salvar" onPress={salvar} />
        </Pressable>
        </EvitaTeclado>
      </Pressable>
    </Modal>
  );
}
