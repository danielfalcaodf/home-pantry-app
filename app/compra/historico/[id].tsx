import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';

import { ItemComProduto, useDetalheDaCompra } from '@/application/resumo/use-detalhe-compra';
import { dataDeReferencia } from '@/domain/compra/compra.rules';
import { centavos, formatarBRL } from '@/domain/shared/dinheiro';
import { formatarQuantidade } from '@/domain/shared/quantidade';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { Texto } from '@/presentation/components/texto';
import { formatarDataDaCompra } from '@/presentation/format/historico-de-compras';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

/**
 * Somente leitura, sem exceção (mesma regra do histórico do produto, design
 * D8 daquela change): nenhuma ação de editar item ou reabrir a compra
 * (task 5.5). Produto removido logicamente após a compra continua vindo
 * pela junção externa (design D7) — o nome exibido é o que está cadastrado
 * hoje; sem produto algum (avulso), usa o nome próprio do item.
 */
export default function DetalheDaCompra() {
  const tema = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { carregando, compra, itens } = useDetalheDaCompra(id);

  if (carregando) {
    return null;
  }
  if (!compra) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
        <EstadoVazio convite="Esta compra não foi encontrada." />
      </View>
    );
  }

  const cancelada = compra.status === 'cancelada';

  function Linha({ item, produto }: ItemComProduto) {
    const nome = produto?.nome ?? item.nomeAvulso ?? 'Produto removido';
    const quantidade = item.quantidadeComprada ?? item.quantidadePlanejada;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: espaco.lg,
          paddingVertical: espaco.md,
          borderBottomWidth: 1,
          borderBottomColor: tema.line.hairline,
          gap: espaco.md,
        }}
      >
        <View style={{ flex: 1, gap: espaco.xs }}>
          <Texto papel="body.md" tom={item.comprado ? 'primary' : 'secondary'} numberOfLines={1}>
            {nome}
          </Texto>
          <Texto papel="label" tom="secondary">
            {formatarQuantidade(quantidade, item.unidade)}
            {item.produtoId === null ? ' · avulso' : ''}
            {!item.comprado ? ' · não comprado' : ''}
          </Texto>
        </View>
        <Texto papel="data.md" tom={item.comprado ? 'primary' : 'secondary'}>
          {item.comprado && item.valorPagoUnitario !== null ? formatarBRL(item.valorPagoUnitario) : '—'}
        </Texto>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View style={{ padding: espaco.lg, gap: espaco.xs }}>
        <Texto papel="display.sm">Compra de {formatarDataDaCompra(dataDeReferencia(compra))}</Texto>
        {cancelada ? (
          <Texto papel="label" tom="secondary">
            Cancelada — nenhum item foi reposto
          </Texto>
        ) : (
          <Texto papel="data.lg">{formatarBRL(compra.valorTotalPago ?? centavos(0))}</Texto>
        )}
      </View>
      {itens.length === 0 ? (
        <EstadoVazio convite="Esta compra não tem itens." />
      ) : (
        <FlatList data={itens} keyExtractor={({ item }) => item.id} renderItem={({ item }) => <Linha {...item} />} />
      )}
    </View>
  );
}
