import { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ehIndivisivel, rotuloDaUnidade, Unidade } from '../../domain/shared/unidade';
import { espaco, ALVO_TOQUE_MINIMO } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { tipografia } from '../theme/tipografia';
import { aplicarMascaraQuantidade } from './campo-texto';
import { Botao } from './botao';
import { IconeSvg } from './icone-svg';
import { PainelInferior } from './painel-inferior';
import { Texto } from './texto';

export type TecladoQuantidadeProps = {
  visivel: boolean;
  nomeDoItem: string;
  unidade: Unidade;
  onFechar: () => void;
  /** Recebe o valor decimal digitado; a conversão para milésimos é do domínio. */
  onUsei: (quantidade: number) => void;
  onRepus: (quantidade: number) => void;
};

/**
 * Um campo, a unidade fixa ao lado, duas ações. Fechar sem confirmar não
 * altera nada — o painel nunca grava por si.
 */
export function TecladoQuantidade({
  visivel,
  nomeDoItem,
  unidade,
  onFechar,
  onUsei,
  onRepus,
}: TecladoQuantidadeProps) {
  const tema = useTheme();
  const campoQuantidadeRef = useRef<TextInput>(null);
  const [texto, setTexto] = useState('');

  const divisivel = !ehIndivisivel(unidade);
  const quantidade = Number(texto.replace(',', '.'));
  const valida = quantidade > 0;

  function confirmar(acao: (valor: number) => void) {
    if (!valida) {
      return;
    }
    acao(quantidade);
    setTexto('');
    onFechar();
  }

  function fechar() {
    setTexto('');
    onFechar();
  }

  return (
    <PainelInferior
      visivel={visivel}
      onFechar={fechar}
      onAberto={() => campoQuantidadeRef.current?.focus()}
      testID="evita-teclado-quantidade"
      style={{ padding: espaco.xl, gap: espaco.lg }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto papel="body.lg">{nomeDoItem}</Texto>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
        <TextInput
          ref={campoQuantidadeRef}
          value={texto}
          onChangeText={(valor) => setTexto(aplicarMascaraQuantidade(valor))}
          accessibilityLabel="Quantidade"
          keyboardType={divisivel ? 'decimal-pad' : 'number-pad'}
          placeholder="0"
          placeholderTextColor={tema.text.secondary}
          style={{
            flex: 1,
            color: tema.text.primary,
            fontFamily: tipografia['display.lg'].fontFamily,
            fontSize: tipografia['display.lg'].fontSize,
            borderBottomWidth: 2,
            borderBottomColor: tema.action.azulejo,
          }}
        />
        <Texto papel="body.lg" tom="secondary">
          {rotuloDaUnidade(unidade, quantidade !== 1)}
        </Texto>
      </View>
      <View style={{ flexDirection: 'row', gap: espaco.md }}>
        <View style={{ flex: 1 }}>
          <Botao titulo="Usei" onPress={() => confirmar(onUsei)} disabled={!valida} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao
            titulo="Repus"
            variante="secundario"
            onPress={() => confirmar(onRepus)}
            disabled={!valida}
          />
        </View>
      </View>
    </PainelInferior>
  );
}
