import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ProdutoNaDespensa, useProdutos } from '@/application/estoque/use-produtos';
import { useCategorias } from '@/application/estoque/use-categorias';
import { useDarBaixa } from '@/application/estoque/use-dar-baixa';
import { useDesfazerMovimento } from '@/application/estoque/use-desfazer-movimento';
import { useReporPontual } from '@/application/estoque/use-repor-pontual';
import { deDecimal, milesimos } from '@/domain/shared/quantidade';
import { rotuloDaUnidade } from '@/domain/shared/unidade';
import { CampoTexto } from '@/presentation/components/campo-texto';
import { ChipEstado } from '@/presentation/components/chip-estado';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { IconeSvg } from '@/presentation/components/icone-svg';
import { ItemDespensa } from '@/presentation/components/item-despensa';
import { TecladoQuantidade } from '@/presentation/components/teclado-quantidade';
import { Texto } from '@/presentation/components/texto';
import { Toast } from '@/presentation/components/toast';
import { ToastDesfazer } from '@/presentation/components/toast-desfazer';
import { useRegistroDeConsumo } from '@/presentation/components/use-registro-de-consumo';
import {
  agruparPorCategoria,
  casaComFiltro,
  contarPorEstado,
  FiltroEstado,
  LinhaDaLista,
} from '@/presentation/format/agrupar-despensa';
import { leituraDeEstoque } from '@/presentation/format/leitura-de-estoque';
import { casaComBusca } from '@/presentation/format/normalizar-busca';
import { corDoEstado } from '@/presentation/theme/cor-do-estado';
import { ALVO_TOQUE_MINIMO, espaco } from '@/presentation/theme/espaco';
import { icones } from '@/presentation/theme/icones';
import { useTheme } from '@/presentation/theme/provider';

const FILTROS: { valor: FiltroEstado; rotulo: string }[] = [
  { valor: 'tudo', rotulo: 'Tudo' },
  { valor: 'critico', rotulo: 'Acabou' },
  { valor: 'faltando', rotulo: 'Faltando' },
];

const FILTROS_VALIDOS = new Set<FiltroEstado>(['tudo', 'critico', 'emFalta', 'ok', 'faltando']);

export default function Despensa() {
  const tema = useTheme();
  const { itens, carregando } = useProdutos();
  const categorias = useCategorias();

  // Filtro e busca são estado efêmero de tela (ADR-05) — nada global. A
  // tela Resumo pode chegar com um filtro pronto (task 2.6): cada contagem
  // por estado leva direto para a despensa já filtrada por aquele estado.
  const { filtro: filtroDaRota } = useLocalSearchParams<{ filtro?: string }>();
  const [filtro, setFiltro] = useState<FiltroEstado>('tudo');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [itemDoTeclado, setItemDoTeclado] = useState<ProdutoNaDespensa | null>(null);

  useEffect(() => {
    // Sincroniza com um sistema externo (a rota) — não deriva de outro
    // estado local, só reage a um parâmetro de navegação (task 2.6).
    if (filtroDaRota && FILTROS_VALIDOS.has(filtroDaRota as FiltroEstado)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiltro(filtroDaRota as FiltroEstado);
    }
  }, [filtroDaRota]);

  const { registrar: registrarConsumo } = useDarBaixa();
  const { registrar: registrarReposicao } = useReporPontual();
  const { desfazer } = useDesfazerMovimento();
  const confirmacao = useRegistroDeConsumo();

  async function usar(item: ProdutoNaDespensa, quantidade = milesimos(1000)) {
    const resultado = await registrarConsumo(item.produto.id, quantidade);
    confirmacao.anunciar(resultado, item.produto, quantidade, 'consumo', () =>
      void usar(item, quantidade),
    );
  }

  async function repor(item: ProdutoNaDespensa, quantidade: number) {
    const emMilesimos = deDecimal(quantidade);
    const resultado = await registrarReposicao(item.produto.id, emMilesimos);
    confirmacao.anunciar(resultado, item.produto, emMilesimos, 'reposicao');
  }

  const contagens = useMemo(() => contarPorEstado(itens), [itens]);

  const visiveis = useMemo(
    () =>
      itens.filter(
        (item) =>
          casaComFiltro(item.estado, filtro) &&
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Texto papel="display.sm">Despensa</Texto>
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            <Pressable
              onPress={() => setBuscaAberta((aberta) => !aberta)}
              accessibilityRole="button"
              accessibilityLabel="Buscar"
              accessibilityState={{ selected: buscaAberta }}
              hitSlop={8}
              style={{
                minWidth: ALVO_TOQUE_MINIMO,
                minHeight: ALVO_TOQUE_MINIMO,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconeSvg
                path={icones.buscar}
                cor={buscaAberta ? tema.action.azulejo : tema.text.secondary}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push('/produto/novo')}
              accessibilityRole="button"
              accessibilityLabel="Adicionar produto"
              hitSlop={8}
              style={{
                minWidth: ALVO_TOQUE_MINIMO,
                minHeight: ALVO_TOQUE_MINIMO,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconeSvg path={icones.adicionar} cor={tema.text.secondary} />
            </Pressable>
          </View>
        </View>
        {buscaAberta ? (
          <CampoTexto
            rotulo="Buscar"
            value={busca}
            onChangeText={setBusca}
            placeholder="Nome do item"
            autoFocus
          />
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            {FILTROS.map(({ valor, rotulo }) => (
              <ChipEstado
                key={valor}
                rotulo={rotulo}
                contagem={contagens[valor]}
                ativo={filtro === valor}
                cor={valor === 'tudo' ? undefined : corDoEstado(tema, valor === 'faltando' ? 'emFalta' : valor)}
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
                onConsumir={() => void usar(linha.item)}
                onAbrirTeclado={() => setItemDoTeclado(linha.item)}
              />
            )
          }
        />
      )}

      {/* A confirmação flutua sobre a lista sem bloquear o toque nela. */}
      <ToastDesfazer
        registro={confirmacao.registro}
        onDesfazer={(movimentoId) => {
          void desfazer(movimentoId);
          confirmacao.limpar();
        }}
        onFim={confirmacao.limpar}
      />
      {confirmacao.aviso && !confirmacao.registro ? (
        <Toast
          mensagem={confirmacao.aviso}
          onFim={confirmacao.limpar}
          acao={
            confirmacao.tentarNovamente.current
              ? { titulo: 'Tentar de novo', onPress: () => confirmacao.tentarNovamente.current?.() }
              : undefined
          }
        />
      ) : null}

      {itemDoTeclado ? (
        <TecladoQuantidade
          visivel
          nomeDoItem={itemDoTeclado.produto.nome}
          unidade={itemDoTeclado.produto.unidade}
          onFechar={() => setItemDoTeclado(null)}
          onUsei={(quantidade) => void usar(itemDoTeclado, deDecimal(quantidade))}
          onRepus={(quantidade) => void repor(itemDoTeclado, quantidade)}
        />
      ) : null}
    </View>
  );
}
