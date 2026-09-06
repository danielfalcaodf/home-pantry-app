import { Pressable, View } from 'react-native';

import { ItemDaLista } from '../../domain/lista/lista';
import { formatarBRL } from '../../domain/shared/dinheiro';
import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { textoExcedente, textoQuantidadeAComprar } from '../format/quantidade-a-comprar';
import { useTheme } from '../theme/provider';
import { Texto } from './texto';

export type ItemListaProps = {
  item: ItemDaLista;
  categoria: string | null;
  onRemover: () => void;
};

/**
 * Linha simples, sem linha d'água — aqui a lista lê como um cupom (FRONTEND
 * §8.2): nome à esquerda, quantidade e preço em mono alinhados à direita.
 */
export function ItemLista({ item, categoria, onRemover }: ItemListaProps) {
  const tema = useTheme();
  const nome = item.tipo === 'avulso' ? `+ ${item.nome}` : item.nome;
  const excedente = textoExcedente(item);

  return (
    <View
      style={{
        minHeight: ALVO_TOQUE_MINIMO,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: tema.line.hairline,
        paddingHorizontal: espaco.lg,
        paddingVertical: espaco.md,
        gap: espaco.md,
      }}
    >
      <View style={{ flex: 1, gap: espaco.xs }}>
        <Texto papel="body.md" numberOfLines={1}>
          {nome}
        </Texto>
        {categoria ? (
          <Texto papel="label" tom="secondary">
            {item.tipo === 'avulso' ? 'Avulso' : categoria}
          </Texto>
        ) : item.tipo === 'avulso' ? (
          <Texto papel="label" tom="secondary">
            Avulso
          </Texto>
        ) : null}
      </View>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        <Texto papel="data.md" tom="secondary" numberOfLines={1}>
          {textoQuantidadeAComprar(item)}
        </Texto>
        {excedente ? (
          <Texto papel="label" tom="secondary" numberOfLines={1}>
            ({excedente})
          </Texto>
        ) : null}
      </View>
      <View style={{ minWidth: 88, alignItems: 'flex-end' }}>
        {item.semPreco ? (
          <Texto papel="label" tom="secondary">
            sem preço
          </Texto>
        ) : (
          <Texto papel="data.md">{formatarBRL(item.custo)}</Texto>
        )}
      </View>
      <Pressable
        onPress={onRemover}
        accessibilityRole="button"
        accessibilityLabel={`Remover ${item.nome} da lista`}
        hitSlop={espaco.md}
        style={{
          minHeight: ALVO_TOQUE_MINIMO,
          minWidth: ALVO_TOQUE_MINIMO,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Texto papel="body.lg" cor={tema.text.secondary}>
          ×
        </Texto>
      </Pressable>
    </View>
  );
}
