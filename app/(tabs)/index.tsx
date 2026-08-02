import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ProdutoNaDespensa, useProdutos } from '@/application/estoque/use-produtos';
import { useCategorias } from '@/application/estoque/use-categorias';
import { rotuloDaUnidade } from '@/domain/shared/unidade';
import { CampoTexto } from '@/presentation/components/campo-texto';
import { ChipEstado } from '@/presentation/components/chip-estado';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { ItemDespensa } from '@/presentation/components/item-despensa';
import { Texto } from '@/presentation/components/texto';
import {
  agruparPorCategoria,
  contarPorEstado,
  FiltroEstado,
  LinhaDaLista,
} from '@/presentation/format/agrupar-despensa';
import { leituraDeEstoque } from '@/presentation/format/leitura-de-estoque';
import { casaComBusca } from '@/presentation/format/normalizar-busca';
import { corDoEstado } from '@/presentation/theme/cor-do-estado';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

const FILTROS: { valor: FiltroEstado; rotulo: string }[] = [
  { valor: 'tudo', rotulo: 'Tudo' },
  { valor: 'critico', rotulo: 'Acabou' },
  { valor: 'emFalta', rotulo: 'Faltando' },
  { valor: 'ok', rotulo: 'Cheio' },
];

export default function Despensa() {
  const tema = useTheme();
  const { itens, carregando } = useProdutos();
  const categorias = useCategorias();

  // Filtro e busca são estado efêmero de tela (ADR-05) — nada global.
  const [filtro, setFiltro] = useState<FiltroEstado>('tudo');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const contagens = useMemo(() => contarPorEstado(itens), [itens]);

  const visiveis = useMemo(
    () =>
      itens.filter(
        (item) =>
          (filtro === 'tudo' || item.estado === filtro) &&
          (categoria === null || item.produto.categoria === categoria) &&
          casaComBusca(item.produto.nome, busca),
      ),
    [itens, filtro, categoria, busca],
  );

  // Agrupa só no filtro amplo: com um estado selecionado, o cabeçalho de
  // categoria vira ruído sobre uma lista já curta.
  const agrupar = filtro === 'tudo' && categoria === null && busca === '';
  const linhas: LinhaDaLista<ProdutoNaDespensa>[] = useMemo(
    () =>
      agrupar
        ? agruparPorCategoria(visiveis)
        : visiveis.map((item) => ({
            tipo: 'item' as const,
            item,
            chave: item.produto.id,
          })),
    [agrupar, visiveis],
  );

  if (!carregando && itens.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
        <EstadoVazio
          convite="Nada cadastrado ainda. Comece pelos 40 itens que quase toda casa tem — depois é só ajustar."
          acao={{
            titulo: 'Começar pela lista básica',
            onPress: () => router.push('/produto/lista-base'),
          }}
        />
        <View style={{ padding: espaco.xl, alignItems: 'center' }}>
          <Texto
            papel="body.md"
            cor={tema.action.azulejo}
            onPress={() => router.push('/produto/novo')}
          >
            Cadastrar do zero
          </Texto>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View style={{ paddingHorizontal: espaco.lg, paddingTop: espaco.lg, gap: espaco.md }}>
        <Texto papel="display.sm">Despensa</Texto>
        <CampoTexto
          rotulo="Buscar"
          value={busca}
          onChangeText={setBusca}
          placeholder="Nome do item"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            {FILTROS.map(({ valor, rotulo }) => (
              <ChipEstado
                key={valor}
                rotulo={rotulo}
                contagem={contagens[valor]}
                ativo={filtro === valor}
                cor={valor === 'tudo' ? undefined : corDoEstado(tema, valor)}
                onPress={() => setFiltro(valor)}
              />
            ))}
          </View>
        </ScrollView>
        {categorias.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: espaco.sm }}>
              <ChipEstado
                rotulo="Todas"
                ativo={categoria === null}
                onPress={() => setCategoria(null)}
              />
              {categorias.map((nome) => (
                <ChipEstado
                  key={nome}
                  rotulo={nome}
                  ativo={categoria === nome}
                  onPress={() => setCategoria(nome)}
                />
              ))}
            </View>
          </ScrollView>
        ) : null}
      </View>

      {visiveis.length === 0 ? (
        <EstadoVazio
          convite={`Nenhum item chamado "${busca}" por aqui.`}
          acao={{
            titulo: `Cadastrar ${busca}`,
            onPress: () => router.push(`/produto/novo?nome=${encodeURIComponent(busca)}`),
          }}
        />
      ) : (
        <FlashList
          data={linhas}
          keyExtractor={(linha) => linha.chave}
          renderItem={({ item: linha }) =>
            linha.tipo === 'cabecalho' ? (
              <View
                style={{
                  paddingHorizontal: espaco.lg,
                  paddingTop: espaco.lg,
                  paddingBottom: espaco.sm,
                  // Fundo opaco: translúcido brigaria com o medidor logo abaixo.
                  backgroundColor: tema.bg.base,
                }}
              >
                <Texto papel="caption" tom="secondary">
                  {linha.categoria}
                </Texto>
              </View>
            ) : (
              <ItemDespensa
                nome={linha.item.produto.nome}
                categoria={agrupar ? null : linha.item.produto.categoria}
                leitura={leituraDeEstoque(
                  linha.item.produto.quantidadeAtual,
                  linha.item.produto.quantidadeNecessaria,
                  linha.item.produto.unidade,
                )}
                rotuloEstado={linha.item.rotulo}
                estado={linha.item.estado}
                fracao={linha.item.fracao}
                temSobra={linha.item.temSobra}
                rotuloAcaoConsumo={`Registrar consumo de 1 ${rotuloDaUnidade(
                  linha.item.produto.unidade,
                  false,
                )} de ${linha.item.produto.nome}`}
                onAbrir={() => router.push(`/produto/${linha.item.produto.id}`)}
              />
            )
          }
        />
      )}
    </View>
  );
}
