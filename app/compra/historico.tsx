import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';

import { CompraDoHistorico, useHistoricoDeCompras } from '@/application/resumo/use-historico-compras';
import { dataDeReferencia } from '@/domain/compra/compra.rules';
import { centavos, formatarBRL } from '@/domain/shared/dinheiro';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { TelaBase } from '@/presentation/components/tela-base';
import { Texto } from '@/presentation/components/texto';
import { formatarDataDaCompra } from '@/presentation/format/historico-de-compras';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

/**
 * Compra cancelada aparece aqui (design D5), distinta visualmente e sem
 * valor de gasto — cancelar não é apagar o registro de que houve tentativa.
 */
export default function HistoricoDeCompras() {
  const tema = useTheme();
  const historico = useHistoricoDeCompras();

  if (historico.carregando) {
    return null;
  }

  function Linha({ compra, qtdItensComprados }: CompraDoHistorico) {
    const cancelada = compra.status === 'cancelada';
    const plural = qtdItensComprados !== 1;
    return (
      <Pressable onPress={() => router.push(`/compra/historico/${compra.id}`)}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: espaco.lg,
            paddingVertical: espaco.md,
            borderBottomWidth: 1,
            borderBottomColor: tema.line.hairline,
          }}
        >
          <View style={{ gap: espaco.xs }}>
            <Texto papel="body.md" tom={cancelada ? 'secondary' : 'primary'}>
              {formatarDataDaCompra(dataDeReferencia(compra))}
            </Texto>
            <Texto papel="label" tom="secondary">
              {cancelada ? 'Cancelada' : `${qtdItensComprados} ${plural ? 'itens' : 'item'}`}
            </Texto>
          </View>
          <Texto papel="data.md" tom={cancelada ? 'secondary' : 'primary'}>
            {cancelada ? '—' : formatarBRL(compra.valorTotalPago ?? centavos(0))}
          </Texto>
        </View>
      </Pressable>
    );
  }

  return (
    <TelaBase>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.lg }}>
        <BotaoVoltar />
        <Texto papel="display.sm">Histórico de compras</Texto>
      </View>
      {historico.compras.length === 0 ? (
        <EstadoVazio convite="Nenhuma compra fechada ainda." />
      ) : (
        <FlatList
          data={historico.compras}
          keyExtractor={({ compra }) => compra.id}
          renderItem={({ item }) => <Linha {...item} />}
          onEndReached={() => void historico.carregarMais()}
          onEndReachedThreshold={0.5}
        />
      )}
    </TelaBase>
  );
}
