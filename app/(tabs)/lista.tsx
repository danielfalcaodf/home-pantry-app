import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import { useAdicionarAvulso } from '@/application/lista/use-adicionar-avulso';
import { useEditarAvulso } from '@/application/lista/use-editar-avulso';
import { useListaDeCompras } from '@/application/lista/use-lista-compras';
import { usePreferenciaDeAgrupamento } from '@/application/lista/use-preferencia-agrupamento';
import { useRemoverItemDaLista } from '@/application/lista/use-remover-item-lista';
import { useIniciarCompra } from '@/application/compra/use-iniciar-compra';
import { useEditarProduto } from '@/application/estoque/use-editar-produto';
import { DadosDoAvulso, ItemDaLista } from '@/domain/lista/lista';
import { totalDaListaDeCompras } from '@/domain/lista/lista.rules';
import { centavos } from '@/domain/shared/dinheiro';
import { paraDecimal } from '@/domain/shared/quantidade';
import { Botao } from '@/presentation/components/botao';
import { ChipEstado } from '@/presentation/components/chip-estado';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { IconeSvg } from '@/presentation/components/icone-svg';
import { ItemLista } from '@/presentation/components/item-lista';
import { RodapeTotal } from '@/presentation/components/rodape-total';
import { SheetAvulso } from '@/presentation/components/sheet-avulso';
import { SheetPrecoProduto } from '@/presentation/components/sheet-preco-produto';
import { Texto } from '@/presentation/components/texto';
import { TelaBase } from '@/presentation/components/tela-base';
import { Toast } from '@/presentation/components/toast';
import { agruparListaPorCategoria, listaContinua } from '@/presentation/format/agrupar-lista';
import { gerarTextoDaLista } from '@/presentation/format/lista-texto';
import { ALVO_TOQUE_MINIMO, espaco } from '@/presentation/theme/espaco';
import { icones } from '@/presentation/theme/icones';
import { useTheme } from '@/presentation/theme/provider';

export default function Lista() {
  const tema = useTheme();
  const { itens, desativados, carregando } = useListaDeCompras();
  const { agrupado, alternar } = usePreferenciaDeAgrupamento();
  const { adicionar } = useAdicionarAvulso();
  const { editar } = useEditarAvulso();
  const { ultimaRemocao, remover, removerAvulso, desfazer, limpar, reativar } =
    useRemoverItemDaLista();
  const { iniciando, iniciar } = useIniciarCompra();
  const { editar: editarProduto } = useEditarProduto();

  const [sheetAberta, setSheetAberta] = useState(false);
  const [desativadosExpandido, setDesativadosExpandido] = useState(false);
  const [avulsoEmEdicao, setAvulsoEmEdicao] = useState<Extract<ItemDaLista, { tipo: 'avulso' }> | null>(
    null,
  );
  const [produtoEmEdicaoDePreco, setProdutoEmEdicaoDePreco] = useState<
    Extract<ItemDaLista, { tipo: 'produto' }> | null
  >(null);

  const total = useMemo(() => totalDaListaDeCompras(itens), [itens]);
  const linhas = useMemo(
    () => (agrupado ? agruparListaPorCategoria(itens) : listaContinua(itens)),
    [agrupado, itens],
  );

  function abrirNovoAvulso() {
    setAvulsoEmEdicao(null);
    setSheetAberta(true);
  }

  function abrirEdicaoDeAvulso(item: Extract<ItemDaLista, { tipo: 'avulso' }>) {
    setAvulsoEmEdicao(item);
    setSheetAberta(true);
  }

  function abrirEdicaoDePreco(item: Extract<ItemDaLista, { tipo: 'produto' }>) {
    setProdutoEmEdicaoDePreco(item);
  }

  async function salvarPrecoDoProduto(preco: number) {
    if (!produtoEmEdicaoDePreco) {
      return;
    }
    await editarProduto(produtoEmEdicaoDePreco.produtoId, {
      valorUnitario: centavos(Math.round(preco * 100)),
    });
  }

  async function salvarAvulso(dados: DadosDoAvulso) {
    if (avulsoEmEdicao) {
      await editar(avulsoEmEdicao.itemId, dados);
    } else {
      await adicionar(dados);
    }
  }

  async function removerItem(item: ItemDaLista) {
    if (item.tipo === 'avulso') {
      await removerAvulso(item);
      return;
    }
    await remover(item);
  }

  async function exportar() {
    const texto = gerarTextoDaLista(itens, agrupado, total);
    if (texto === '') {
      return;
    }
    await Share.share({ message: texto });
  }

  async function iniciarCompra() {
    const compraId = await iniciar(itens);
    router.push(`/compra/${compraId}`);
  }

  const listaVazia = !carregando && itens.length === 0;

  return (
    <TelaBase>
      {listaVazia ? (
        <EstadoVazio
          convite="Nada faltando por aqui. Se quiser levar algo pontual para a próxima compra, adicione um item avulso."
          acao={{ titulo: 'Adicionar item avulso', onPress: abrirNovoAvulso }}
        />
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: espaco.lg,
              paddingTop: espaco.lg,
              paddingBottom: espaco.sm,
            }}
          >
            <Texto papel="display.sm">Lista</Texto>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
              <Pressable
                onPress={abrirNovoAvulso}
                accessibilityRole="button"
                accessibilityLabel="Adicionar item avulso"
                hitSlop={8}
                style={{
                  minWidth: ALVO_TOQUE_MINIMO,
                  minHeight: ALVO_TOQUE_MINIMO,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconeSvg path={icones.adicionar} cor={tema.action.azulejo} tamanho={20} />
              </Pressable>
              <Pressable
                onPress={() => void exportar()}
                accessibilityRole="button"
                accessibilityLabel="Compartilhar lista"
                hitSlop={8}
                style={{
                  minWidth: ALVO_TOQUE_MINIMO,
                  minHeight: ALVO_TOQUE_MINIMO,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconeSvg path={icones.compartilhar} cor={tema.action.azulejo} tamanho={20} />
              </Pressable>
              <ChipEstado
                rotulo={agrupado ? 'Agrupado' : 'Agrupar'}
                cor={tema.action.azulejo}
                ativo={agrupado}
                onPress={() => void alternar()}
              />
            </View>
          </View>

          <RodapeTotal
            contagemItens={total.contagemItens}
            total={total.total}
            contagemSemPreco={total.contagemSemPreco}
          />

          <View style={{ paddingHorizontal: espaco.lg, paddingBottom: espaco.md }}>
            <Botao
              titulo={`Iniciar compra (${total.contagemItens})`}
              onPress={() => void iniciarCompra()}
              disabled={iniciando}
            />
          </View>

          <FlashList
            testID="lista-de-compras"
            style={{ flex: 1 }}
            data={linhas}
            keyExtractor={(linha) => linha.chave}
            renderItem={({ item: linha }) =>
              linha.tipo === 'cabecalho' ? (
                <View
                  style={{
                    paddingHorizontal: espaco.lg,
                    paddingTop: espaco.lg,
                    paddingBottom: espaco.sm,
                    backgroundColor: tema.bg.base,
                  }}
                >
                  <Texto papel="caption" tom="secondary">
                    {linha.categoria}
                  </Texto>
                </View>
              ) : (
                <Pressable
                  onPress={() =>
                    linha.item.tipo === 'avulso'
                      ? abrirEdicaoDeAvulso(linha.item)
                      : abrirEdicaoDePreco(linha.item)
                  }
                >
                  <ItemLista
                    item={linha.item}
                    categoria={agrupado ? null : linha.item.categoria}
                    onRemover={() => void removerItem(linha.item)}
                  />
                </Pressable>
              )
            }
          />
        </>
      )}

      {desativados.length > 0 ? (
        <View testID="secao-desativados" style={{ paddingHorizontal: espaco.lg, paddingBottom: espaco.lg }}>
          <Pressable
            onPress={() => setDesativadosExpandido(!desativadosExpandido)}
            accessibilityRole="button"
            accessibilityState={{ expanded: desativadosExpandido }}
            hitSlop={8}
            style={{
              minHeight: ALVO_TOQUE_MINIMO,
              flexDirection: 'row',
              alignItems: 'center',
              gap: espaco.xs,
            }}
          >
            <Texto papel="caption" tom="secondary">
              {`Fora da lista por agora (${desativados.length})`}
            </Texto>
            <View style={{ transform: [{ rotate: desativadosExpandido ? '180deg' : '0deg' }] }}>
              <IconeSvg path={icones.cheveron} cor={tema.text.secondary} tamanho={16} />
            </View>
          </Pressable>
          {desativadosExpandido ? (
            // Altura limitada mesmo expandida: nunca compete pela altura da
            // lista ativa (que já tem `flex: 1` acima) — rola dentro do
            // próprio espaço com muitos itens (correcao-colapso-fora-da-lista).
            <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
              <View style={{ gap: espaco.sm, paddingTop: espaco.sm }}>
                {desativados.map((item) => (
                  <View
                    key={item.itemId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: ALVO_TOQUE_MINIMO,
                    }}
                  >
                    <Texto papel="body.md" tom="secondary">
                      {item.nome}
                    </Texto>
                    <Pressable
                      onPress={() => void reativar(item.itemId)}
                      accessibilityRole="button"
                      accessibilityLabel={`Voltar ${item.nome} pra lista`}
                      hitSlop={8}
                      style={{ minHeight: ALVO_TOQUE_MINIMO, justifyContent: 'center' }}
                    >
                      <Texto papel="body.md" cor={tema.action.azulejo}>
                        Voltar pra lista
                      </Texto>
                    </Pressable>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      <SheetPrecoProduto
        key={produtoEmEdicaoDePreco?.produtoId}
        visivel={produtoEmEdicaoDePreco !== null}
        nome={produtoEmEdicaoDePreco?.nome ?? ''}
        precoInicial={
          produtoEmEdicaoDePreco && !produtoEmEdicaoDePreco.semPreco
            ? produtoEmEdicaoDePreco.valorUnitario / 100
            : null
        }
        onFechar={() => setProdutoEmEdicaoDePreco(null)}
        onSalvar={(preco) => void salvarPrecoDoProduto(preco)}
      />

      <SheetAvulso
        visivel={sheetAberta}
        inicial={
          avulsoEmEdicao
            ? {
                nome: avulsoEmEdicao.nome,
                unidade: avulsoEmEdicao.unidade,
                quantidade: paraDecimal(avulsoEmEdicao.quantidadeAComprar),
                preco: avulsoEmEdicao.semPreco ? null : avulsoEmEdicao.valorUnitario / 100,
              }
            : undefined
        }
        onFechar={() => setSheetAberta(false)}
        onSalvar={(dados) => void salvarAvulso(dados)}
      />

      {ultimaRemocao ? (
        <Toast
          key={ultimaRemocao.tipo === 'produto' ? ultimaRemocao.itemExclusaoId : `avulso-${ultimaRemocao.nome}`}
          mensagem={`${ultimaRemocao.nome} removido da lista`}
          acao={{ titulo: 'Desfazer', onPress: () => void desfazer() }}
          onFim={limpar}
        />
      ) : null}
    </TelaBase>
  );
}
