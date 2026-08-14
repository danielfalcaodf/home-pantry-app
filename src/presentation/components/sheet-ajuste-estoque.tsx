import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { MotivoAjuste } from '../../domain/movimento/movimento';
import { rotuloDaUnidade, Unidade } from '../../domain/shared/unidade';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { ChipEstado } from './chip-estado';
import { EvitaTeclado } from './evita-teclado';
import { IconeSvg } from './icone-svg';
import { Texto } from './texto';

export type SheetAjusteEstoqueProps = {
  visivel: boolean;
  nome: string;
  unidade: Unidade;
  /** Valor atual em decimal, já convertido pela apresentação. */
  quantidadeAtual: number;
  onFechar: () => void;
  onSalvar: (dados: { valorFinal: number; motivo: MotivoAjuste | null }) => void;
};

const MOTIVOS: { valor: MotivoAjuste; rotulo: string }[] = [
  { valor: 'perda', rotulo: 'Perda' },
  { valor: 'vencimento', rotulo: 'Vencimento' },
  { valor: 'correcao', rotulo: 'Correção' },
];

/**
 * O toque na quantidade atual do detalhe abre este caminho, nunca um campo
 * de texto ao lado de "nome" e "categoria" (design D3) — a pessoa informa o
 * que contou, não a diferença (D2), e o motivo é sempre opcional (task 1.5).
 */
export function SheetAjusteEstoque({
  visivel,
  nome,
  unidade,
  quantidadeAtual,
  onFechar,
  onSalvar,
}: SheetAjusteEstoqueProps) {
  const tema = useTheme();
  const [valor, setValor] = useState(String(quantidadeAtual).replace('.', ','));
  const [motivo, setMotivo] = useState<MotivoAjuste | null>(null);
  const [erro, setErro] = useState<string | undefined>(undefined);

  function fechar() {
    setValor(String(quantidadeAtual).replace('.', ','));
    setMotivo(null);
    setErro(undefined);
    onFechar();
  }

  function salvar() {
    const valorFinal = Number(valor.replace(',', '.'));
    // Rejeitar valor negativo com erro em texto (task 1.4) — nunca só
    // impedir o toque em silêncio.
    if (!Number.isFinite(valorFinal) || valorFinal < 0) {
      setErro('Não pode ser negativo');
      return;
    }
    onSalvar({ valorFinal, motivo });
    fechar();
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <Pressable
        onPress={fechar}
        accessibilityLabel="Fechar"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <EvitaTeclado style={{ flex: undefined }} testID="evita-teclado-ajuste-estoque">
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
            <Texto papel="body.lg">Corrigir {nome}</Texto>
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
          <CampoTexto
            rotulo={`Quanto você tem agora (${rotuloDaUnidade(unidade, true)})`}
            value={valor}
            onChangeText={(texto) => {
              setValor(texto);
              setErro(undefined);
            }}
            erro={erro}
            keyboardType="decimal-pad"
            tipo="quantidade"
          />
          <View style={{ gap: espaco.sm }}>
            <Texto papel="label" tom="secondary">
              Motivo (opcional)
            </Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
              {MOTIVOS.map((opcao) => (
                <ChipEstado
                  key={opcao.valor}
                  rotulo={opcao.rotulo}
                  ativo={motivo === opcao.valor}
                  onPress={() => setMotivo(motivo === opcao.valor ? null : opcao.valor)}
                />
              ))}
            </View>
          </View>
          <Botao titulo="Corrigir" onPress={salvar} />
        </Pressable>
        </EvitaTeclado>
      </Pressable>
    </Modal>
  );
}
