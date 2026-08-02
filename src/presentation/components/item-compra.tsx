import { Pressable, View } from 'react-native';

import { ItemDaCompra } from '../../application/compra/use-modo-compra';
import { formatarBRL } from '../../domain/shared/dinheiro';
import { formatarQuantidade } from '../../domain/shared/quantidade';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { ChipEstado } from './chip-estado';
import { Texto } from './texto';

const LADO_MARCACAO = 28;

export type ItemCompraProps = {
  linha: ItemDaCompra;
  onMarcar: () => void;
  onDesmarcar: () => void;
  onAjustar: () => void;
  onResponderPreco: (resposta: boolean) => void;
};

/**
 * Item marcado perde toda a tinta e o nome ganha risco (design D7 da change
 * modo-compra-e-fechamento): "a lista vai literalmente esvaziando conforme
 * você anda pelo mercado". A pergunta de preço é embutida na linha, nunca um
 * diálogo modal (D4) — não pode travar a marcação do próximo item.
 */
export function ItemCompra({ linha, onMarcar, onDesmarcar, onAjustar, onResponderPreco }: ItemCompraProps) {
  const tema = useTheme();
  const { item, produto } = linha;
  const nome = item.nomeAvulso ?? produto?.nome ?? '';
  const quantidade = item.quantidadeComprada ?? item.quantidadePlanejada;
  const precoPorUnidade = item.valorPagoUnitario ?? item.valorEstimadoUnit;
  const semPreco = precoPorUnidade <= 0;

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: tema.line.hairline }}>
      <Pressable
        onPress={() => (item.comprado ? onDesmarcar() : onMarcar())}
        onLongPress={onAjustar}
        style={{
          minHeight: ALVO_TOQUE_MINIMO,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: espaco.lg,
          paddingVertical: espaco.md,
          gap: espaco.md,
        }}
      >
        <View
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.comprado }}
          accessibilityLabel={`${item.comprado ? 'Desmarcar' : 'Marcar'} ${nome}`}
          style={{
            width: ALVO_TOQUE_MINIMO,
            height: ALVO_TOQUE_MINIMO,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: LADO_MARCACAO,
              height: LADO_MARCACAO,
              borderRadius: raio.linha,
              borderWidth: 2,
              borderColor: item.comprado ? tema.action.azulejo : tema.line.hairline,
              backgroundColor: item.comprado ? tema.action.azulejo : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.comprado ? (
              <Texto papel="label" cor={tema.text.onAction}>
                ✓
              </Texto>
            ) : null}
          </View>
        </View>

        <View style={{ flex: 1, gap: espaco.xs }}>
          <Texto
            papel="body.md"
            tom={item.comprado ? 'secondary' : 'primary'}
            numberOfLines={1}
            style={item.comprado ? { textDecorationLine: 'line-through' } : undefined}
          >
            {nome}
          </Texto>
          <Texto papel="label" tom="secondary">
            {formatarQuantidade(quantidade, item.unidade)}
          </Texto>
        </View>

        <View style={{ minWidth: 88, alignItems: 'flex-end' }}>
          {semPreco ? (
            <Texto papel="label" tom="secondary">
              sem preço
            </Texto>
          ) : (
            <Texto papel="data.md" tom={item.comprado ? 'secondary' : 'primary'}>
              {formatarBRL(precoPorUnidade)}
            </Texto>
          )}
        </View>
      </Pressable>

      {item.comprado && linha.divergePreco ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: espaco.sm,
            paddingHorizontal: espaco.lg,
            paddingBottom: espaco.md,
          }}
        >
          <Texto papel="label" tom="secondary" style={{ flex: 1 }}>
            Atualizar o preço de {nome} para {formatarBRL(precoPorUnidade)}?
          </Texto>
          <ChipEstado rotulo="Sim" ativo={item.atualizarPreco === true} onPress={() => onResponderPreco(true)} />
          <ChipEstado rotulo="Não" ativo={item.atualizarPreco === false} onPress={() => onResponderPreco(false)} />
        </View>
      ) : null}
    </View>
  );
}
