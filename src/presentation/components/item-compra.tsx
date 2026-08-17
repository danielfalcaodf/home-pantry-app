import { Pressable, View } from 'react-native';

import { CompraItem } from '../../domain/compra/compra';
import { formatarBRL } from '../../domain/shared/dinheiro';
import { formatarQuantidade } from '../../domain/shared/quantidade';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { ChipEstado } from './chip-estado';
import { IconeSvg } from './icone-svg';
import { Texto } from './texto';

const LADO_MARCACAO = 28;

// Mesma forma de application/compra/use-modo-compra.ItemDaCompra, mas
// declarada aqui: presentation não importa application nem domain/produto/
// (regra de camada) — o componente recebe o valor já pronto por tipagem
// estrutural, só com o nome do produto, que é tudo que a linha usa.
export type LinhaDeCompra = {
  item: CompraItem;
  produto: { nome: string } | null;
  divergePreco: boolean;
};

export type ItemCompraProps = {
  linha: LinhaDeCompra;
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
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.comprado }}
        accessibilityLabel={`${nome}, ${formatarQuantidade(quantidade, item.unidade)}${
          semPreco ? ', sem preço' : `, ${formatarBRL(precoPorUnidade)}`
        }`}
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
          style={{
            width: ALVO_TOQUE_MINIMO,
            height: ALVO_TOQUE_MINIMO,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            testID="marcacao-quadrado"
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
              <Texto papel="label" cor={tema.text.onAction} importantForAccessibility="no">
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
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
          {/* Sinaliza que a linha aceita ajuste por toque longo (ACHADO
              affordance) — o próprio ícone não é tocável, só indica que o
              gesto existe; o alvo continua sendo a linha inteira via
              onLongPress do Pressable pai. */}
          <View testID="icone-ajustar">
            <IconeSvg path={icones.ajustar} cor={tema.text.secondary} tamanho={16} />
          </View>
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
