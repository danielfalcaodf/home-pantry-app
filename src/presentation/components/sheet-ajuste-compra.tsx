import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { rotuloDaUnidade, Unidade } from '../../domain/shared/unidade';
import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { IconeSvg } from './icone-svg';
import { PainelInferior } from './painel-inferior';
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
  /**
   * Presente (não nulo) quando o produto tem fator de conversão cadastrado
   * (change conversao-unidade-de-compra) — troca os campos de
   * quantidade/preço por unidade pelos de pacotes: quantos pacotes, quantas
   * unidades tem o pacote encontrado no mercado (pré-preenchido com este
   * valor, mas editável) e quanto foi pago no total.
   */
  fatorConversaoEmbalagem?: number | null;
  onSalvarPacotes?: (dados: { pacotes: number; tamanhoPacote: number; valorTotal: number }) => void;
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
  fatorConversaoEmbalagem = null,
  onSalvarPacotes,
}: SheetAjusteCompraProps) {
  const tema = useTheme();
  const campoQuantidadeRef = useRef<TextInput>(null);
  const campoPacotesRef = useRef<TextInput>(null);
  const [quantidade, setQuantidade] = useState(String(quantidadeInicial).replace('.', ','));
  // Duas casas sempre — é o formato que a máscara de dinheiro espera pra
  // reconhecer o valor semeado (CampoTexto extrai dígitos do que está aqui).
  const [preco, setPreco] = useState(precoInicial !== null ? precoInicial.toFixed(2).replace('.', ',') : '');
  const [pacotes, setPacotes] = useState('1');
  const [tamanhoPacote, setTamanhoPacote] = useState(String(fatorConversaoEmbalagem ?? ''));
  const [valorTotal, setValorTotal] = useState('');
  const [erroQuantidade, setErroQuantidade] = useState<string | undefined>(undefined);
  const [erroPacotes, setErroPacotes] = useState<string | undefined>(undefined);
  const [erroTamanhoPacote, setErroTamanhoPacote] = useState<string | undefined>(undefined);

  const temEmbalagem = fatorConversaoEmbalagem !== null;

  function fechar() {
    setErroQuantidade(undefined);
    setErroPacotes(undefined);
    setErroTamanhoPacote(undefined);
    onFechar();
  }

  function salvar() {
    if (temEmbalagem) {
      salvarPacotes();
      return;
    }
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

  function salvarPacotes() {
    const pacotesNumerico = Number(pacotes.replace(',', '.'));
    if (!Number.isInteger(pacotesNumerico) || pacotesNumerico <= 0) {
      setErroPacotes('Diga quantos pacotes você comprou');
      return;
    }
    const tamanhoNumerico = Number(tamanhoPacote.replace(',', '.'));
    if (!Number.isInteger(tamanhoNumerico) || tamanhoNumerico <= 0) {
      setErroTamanhoPacote('Diga quantas unidades tem o pacote');
      return;
    }
    const valorTotalNumerico = valorTotal.trim() === '' ? 0 : Number(valorTotal.replace(',', '.'));
    onSalvarPacotes?.({
      pacotes: pacotesNumerico,
      tamanhoPacote: tamanhoNumerico,
      valorTotal: valorTotalNumerico,
    });
    fechar();
  }

  return (
    <PainelInferior
      visivel={visivel}
      onFechar={fechar}
      onAberto={() =>
        (temEmbalagem ? campoPacotesRef : campoQuantidadeRef).current?.focus()
      }
      testID="evita-teclado-ajuste-compra"
      style={{ padding: espaco.xl, gap: espaco.lg }}
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
      {temEmbalagem ? (
        <>
          <View style={{ flexDirection: 'row', gap: espaco.md }}>
            <View style={{ flex: 1 }}>
              <CampoTexto
                ref={campoPacotesRef}
                rotulo="Quantos pacotes"
                value={pacotes}
                onChangeText={setPacotes}
                keyboardType="number-pad"
                erro={erroPacotes}
                tipo="quantidade"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo="Unidades no pacote"
                value={tamanhoPacote}
                onChangeText={setTamanhoPacote}
                keyboardType="number-pad"
                erro={erroTamanhoPacote}
                tipo="quantidade"
              />
            </View>
          </View>
          <CampoTexto
            rotulo="Valor total pago"
            value={valorTotal}
            onChangeText={setValorTotal}
            keyboardType="decimal-pad"
            tipo="dinheiro"
          />
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: espaco.md }}>
          <View style={{ flex: 1 }}>
            <CampoTexto
              ref={campoQuantidadeRef}
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
      )}
      <Botao titulo="Salvar" onPress={salvar} />
    </PainelInferior>
  );
}
