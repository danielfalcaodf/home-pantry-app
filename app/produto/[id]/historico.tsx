import { useLocalSearchParams } from 'expo-router';
import { FlatList, View } from 'react-native';

import { useHistoricoDoProduto } from '@/application/estoque/use-historico';
import { useProduto } from '@/application/estoque/use-editar-produto';
import { MovimentoEstoque } from '@/domain/movimento/movimento';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { Texto } from '@/presentation/components/texto';
import {
  descreverMovimento,
  formatarDataDoMovimento,
} from '@/presentation/format/historico-do-movimento';
import { corDoMovimento } from '@/presentation/theme/cor-do-estado';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

/**
 * Somente leitura, sem exceção (design D8, task 5.7) — corrigir um registro
 * errado é um ajuste novo, nunca a edição do movimento antigo.
 */
export default function HistoricoDoProduto() {
  const tema = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { item, carregando: carregandoProduto } = useProduto(id);
  const historico = useHistoricoDoProduto(id);

  if (carregandoProduto || historico.carregando) {
    return null;
  }
  if (!item) {
    return null;
  }

  const { unidade, nome } = item.produto;

  function Linha({ movimento }: { movimento: MovimentoEstoque }) {
    const descricao = descreverMovimento(movimento, unidade);
    const cor = corDoMovimento(tema, movimento.tipo);
    return (
      <View
        style={{
          paddingVertical: espaco.md,
          paddingHorizontal: espaco.lg,
          borderBottomWidth: 1,
          borderBottomColor: tema.line.hairline,
          gap: espaco.xs,
        }}
      >
        <View style={{ flexDirection: 'row', gap: espaco.xs }}>
          <Texto papel="body.md" cor={cor}>
            {descricao.verbo}
          </Texto>
          <Texto papel="data.md" cor={cor}>
            {descricao.quantidade}
          </Texto>
        </View>
        <View style={{ flexDirection: 'row', gap: espaco.sm }}>
          <Texto papel="data.md" tom="secondary">
            {formatarDataDoMovimento(movimento.criadoEm)}
          </Texto>
          {movimento.motivo && movimento.tipo === 'ajuste' ? (
            <Texto papel="body.md" tom="secondary">
              · {movimento.motivo}
            </Texto>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, padding: espaco.lg }}>
        <BotaoVoltar />
        <Texto papel="display.sm">Histórico de {nome}</Texto>
      </View>
      {historico.itens.length === 0 ? (
        <EstadoVazio convite="Nenhum registro ainda." />
      ) : (
        <FlatList
          data={historico.itens}
          keyExtractor={(movimento) => movimento.id}
          renderItem={({ item: movimento }) => <Linha movimento={movimento} />}
          onEndReached={() => void historico.carregarMais()}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}
