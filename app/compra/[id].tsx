import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

import { useCancelarCompra } from '@/application/compra/use-cancelar-compra';
import { useAvisoCompraStore } from '@/application/compra/aviso-compra-store';
import { useFinalizarCompra } from '@/application/compra/use-finalizar-compra';
import { DivergenciaDePrecoDaCompra } from '@/application/compra/revisao-preco';
import { ItemDaCompra, useModoCompra } from '@/application/compra/use-modo-compra';
import { usePreferenciaDeAgrupamento } from '@/application/lista/use-preferencia-agrupamento';
import { totalPago } from '@/domain/compra/compra.rules';
import { passoRapido } from '@/domain/compra/quantidade-compra.rules';
import { custoEstimadoComFator, fatorConversao } from '@/domain/produto/conversao-embalagem.rules';
import { centavos, formatarBRL, multiplicarQuantidadePorPreco } from '@/domain/shared/dinheiro';
import { deDecimal, paraDecimal } from '@/domain/shared/quantidade';
import { Botao } from '@/presentation/components/botao';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { PainelInferior } from '@/presentation/components/painel-inferior';
import { ItemCompra } from '@/presentation/components/item-compra';
import { RodapeCompra } from '@/presentation/components/rodape-compra';
import { SheetAjusteCompra } from '@/presentation/components/sheet-ajuste-compra';
import { TelaBase } from '@/presentation/components/tela-base';
import { Texto } from '@/presentation/components/texto';
import { Toast } from '@/presentation/components/toast';
import {
  agruparPorCategoriaGenerico,
  listaContinuaGenerico,
} from '@/presentation/format/agrupar-lista';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

function nomeDoItemDaCompra(linha: ItemDaCompra): string {
  return linha.item.nomeAvulso ?? linha.produto?.nome ?? '';
}

function categoriaDoItemDaCompra(linha: ItemDaCompra): string | null {
  return linha.produto?.categoria ?? null;
}

// Prioriza o tamanho de pacote já confirmado nesta compra (mercado pode
// divergir do cadastrado) sobre o fator cadastrado no produto — mesma
// precedência do ajuste detalhado e do passo rápido (design.md).
function fatorDoItemDaCompra(linha: ItemDaCompra) {
  return linha.item.fatorUsadoNaCompra ?? linha.produto?.fatorConversaoEmbalagem ?? null;
}

// Antes de marcar comprado, o custo é sempre estimativa (valorEstimadoUnit
// já vem arredondado de `valorUnitarioDoPacote`) — multiplicar de volta pela
// quantidade reintroduz o erro que a divisão tinha eliminado (achado em
// produção: pacote de 6 a R$10,00 exibindo R$10,02). Com embalagem
// cadastrada, calcula direto a partir do preço do pacote numa única conta.
// Depois de marcado (`valorPagoUnitario` presente), o preço já é o que o
// usuário informou na compra — mantém o cálculo por unidade de sempre.
function custoTotalDoItemDaCompra(linha: ItemDaCompra): ReturnType<typeof multiplicarQuantidadePorPreco> {
  const { item, produto } = linha;
  const quantidade = item.quantidadeComprada ?? item.quantidadePlanejada;
  const fator = fatorDoItemDaCompra(linha);
  if (item.valorPagoUnitario === null && fator !== null && produto?.valorReferenciaEmbalagem != null) {
    return custoEstimadoComFator(quantidade, fator, produto.valorReferenciaEmbalagem);
  }
  return multiplicarQuantidadePorPreco(quantidade, item.valorPagoUnitario ?? item.valorEstimadoUnit);
}

function chaveDoItemDaCompra(linha: ItemDaCompra): string {
  return linha.item.id;
}

/**
 * Tela única, sem navegação interna (FRONTEND §8.3): quem está com o
 * carrinho e uma mão livre precisa de tudo aqui — marcar, ajustar e fechar,
 * sem sair da tela. A tela acordada dura só enquanto ela está montada.
 */
export default function ModoCompra() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tema = useTheme();
  const {
    itens,
    carregando,
    marcar,
    desmarcar,
    ajustarQuantidade,
    ajustarQuantidadeRapida,
    ajustarPreco,
    ajustarComPacotes,
    responderAtualizarPreco,
  } = useModoCompra(id);
  const { finalizando, divergencias, finalizar } = useFinalizarCompra();
  const { cancelando, cancelar } = useCancelarCompra();

  const { agrupado } = usePreferenciaDeAgrupamento();

  const [itemEmAjuste, setItemEmAjuste] = useState<ItemDaCompra | null>(null);
  // Só mensagem de falha: sucesso navega na hora pra Despensa e mostra o
  // aviso lá (via parâmetro `avisoCompra`) — esta tela já desmontou.
  const [avisoDeFalha, setAvisoDeFalha] = useState<string | null>(null);
  const [revisaoAberta, setRevisaoAberta] = useState(false);
  const [itensEmRevisao, setItensEmRevisao] = useState<DivergenciaDePrecoDaCompra[]>([]);
  const [precosSelecionados, setPrecosSelecionados] = useState<ReadonlySet<string>>(new Set());
  const [escolhendoExcecoes, setEscolhendoExcecoes] = useState(false);

  const marcados = useMemo(() => itens.filter((linha) => linha.item.comprado).length, [itens]);
  const total = useMemo(() => totalPago(itens.map((linha) => linha.item)), [itens]);

  // Mesmas funções de agrupamento da aba Lista, mesma preferência
  // compartilhada — as duas telas não podem divergir (A-08).
  const linhas = useMemo(
    () =>
      agrupado
        ? agruparPorCategoriaGenerico(
            itens,
            categoriaDoItemDaCompra,
            nomeDoItemDaCompra,
            chaveDoItemDaCompra,
          )
        : listaContinuaGenerico(itens, nomeDoItemDaCompra, chaveDoItemDaCompra),
    [agrupado, itens],
  );

  // Achado de QA: navegar só depois do toast sumir (5s) trava quem já
  // fechou a compra e quer seguir pra Despensa — a confirmação é um
  // reforço, não um portão. Sai da tela na hora (o toast local não teria
  // tempo de aparecer, pois esta tela desmonta com a navegação); a
  // mensagem viaja pela store global (a aba Despensa já costuma estar
  // montada, então parâmetro de rota não chega até ela).
  function tratarResultadoDoFechamento(resultado: Awaited<ReturnType<typeof finalizar>>) {
    if (resultado.ok) {
      const plural = resultado.itensRepostos !== 1;
      useAvisoCompraStore.getState().definir(`Você repôs ${resultado.itensRepostos} ${plural ? 'itens' : 'item'}`);
      router.replace('/');
      return;
    }
    setAvisoDeFalha('Não foi possível fechar a compra agora. Toque em Fechar compra para tentar de novo.');
  }

  async function fecharCompra() {
    const divergentes = await divergencias(id);
    if (divergentes.length > 0) {
      setItensEmRevisao(divergentes);
      setPrecosSelecionados(new Set(divergentes.map(({ produtoId }) => produtoId)));
      setRevisaoAberta(true);
      return;
    }
    tratarResultadoDoFechamento(await finalizar(id));
  }

  async function confirmarRevisao(selecionados: ReadonlySet<string> = precosSelecionados) {
    await Promise.all(
      itensEmRevisao.map(({ itemId, produtoId }) =>
        responderAtualizarPreco(itemId, selecionados.has(produtoId)),
      ),
    );
    setRevisaoAberta(false);
    setEscolhendoExcecoes(false);
    await fecharCompraSemRevisar();
  }

  async function fecharCompraSemRevisar() {
    tratarResultadoDoFechamento(await finalizar(id));
  }

  function alternarSelecaoDePreco(produtoId: string) {
    setPrecosSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(produtoId)) {
        proximo.delete(produtoId);
      } else {
        proximo.add(produtoId);
      }
      return proximo;
    });
  }

  function confirmarCancelamento() {
    Alert.alert('Cancelar esta compra?', 'O que você já marcou fica só no histórico. Nada é reposto.', [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Cancelar compra',
        style: 'destructive',
        onPress: async () => {
          const ok = await cancelar(id);
          if (ok) {
            router.back();
          }
        },
      },
    ]);
  }

  function salvarAjuste(dados: { quantidade: number; preco: number | null }) {
    if (!itemEmAjuste) {
      return;
    }
    void ajustarQuantidade(itemEmAjuste.item.id, deDecimal(dados.quantidade));
    void ajustarPreco(
      itemEmAjuste.item.id,
      dados.preco === null ? null : centavos(Math.round(dados.preco * 100)),
    );
  }

  function salvarAjustePorPacotes(dados: { pacotes: number; tamanhoPacote: number; valorTotal: number }) {
    if (!itemEmAjuste) {
      return;
    }
    void ajustarComPacotes(
      itemEmAjuste.item.id,
      dados.pacotes,
      fatorConversao(dados.tamanhoPacote),
      centavos(Math.round(dados.valorTotal * 100)),
    );
  }

  return (
    <TelaBase edges={['top', 'bottom']}>
      <View style={{ padding: espaco.lg, paddingBottom: espaco.sm, gap: espaco.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
          <BotaoVoltar
            confirmar={
              marcados > 0
                ? {
                    titulo: 'Sair da compra?',
                    mensagem: 'A compra continua aberta com o que você já marcou.',
                  }
                : undefined
            }
          />
          <Texto papel="display.sm">Compra</Texto>
        </View>
        <Texto papel="label" tom="secondary">
          Toque em cada item para marcar. Se sair, a compra continua aberta com o que você já marcou.
        </Texto>
      </View>

      {carregando ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: espaco.md }}>
          <ActivityIndicator size="large" color={tema.action.azulejo} />
          <Texto papel="label" tom="secondary">
            Preparando sua compra…
          </Texto>
        </View>
      ) : (
      <ScrollView style={{ flex: 1 }}>
        {linhas.map((linha) =>
          linha.tipo === 'cabecalho' ? (
            <View
              key={linha.chave}
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
            <ItemCompra
              key={linha.chave}
              linha={linha.item}
              custoTotal={custoTotalDoItemDaCompra(linha.item)}
              onMarcar={() => void marcar(linha.item)}
              onDesmarcar={() => void desmarcar(linha.item.item.id)}
              onAjustar={() => setItemEmAjuste(linha.item)}
              onDiminuirQuantidade={() => void ajustarQuantidadeRapida(linha.item.item.id, -1)}
              onAumentarQuantidade={() => void ajustarQuantidadeRapida(linha.item.item.id, 1)}
              podeDiminuirQuantidade={
                (linha.item.item.quantidadeComprada ?? linha.item.item.quantidadePlanejada) >
                passoRapido(linha.item.item.unidade, fatorDoItemDaCompra(linha.item))
              }
            />
          ),
        )}
      </ScrollView>
      )}

      {carregando ? null : (
        <>
          <RodapeCompra marcados={marcados} totalDeItens={itens.length} total={total} />
          <View style={{ padding: espaco.lg, gap: espaco.md }}>
            <Botao titulo="Fechar compra" onPress={() => void fecharCompra()} disabled={finalizando} />
            <Botao
              titulo="Cancelar compra"
              variante="secundario"
              onPress={confirmarCancelamento}
              disabled={cancelando}
            />
          </View>
        </>
      )}

      {itemEmAjuste ? (
        <SheetAjusteCompra
          visivel
          nome={itemEmAjuste.item.nomeAvulso ?? itemEmAjuste.produto?.nome ?? ''}
          unidade={itemEmAjuste.item.unidade}
          quantidadeInicial={paraDecimal(
            itemEmAjuste.item.quantidadeComprada ?? itemEmAjuste.item.quantidadePlanejada,
          )}
          precoInicial={
            itemEmAjuste.item.valorPagoUnitario !== null ? itemEmAjuste.item.valorPagoUnitario / 100 : null
          }
          fatorConversaoEmbalagem={itemEmAjuste.produto?.fatorConversaoEmbalagem ?? null}
          onFechar={() => setItemEmAjuste(null)}
          onSalvar={salvarAjuste}
          onSalvarPacotes={salvarAjustePorPacotes}
        />
      ) : null}

      <PainelInferior
        visivel={revisaoAberta}
        onFechar={() => {
          setRevisaoAberta(false);
          setEscolhendoExcecoes(false);
        }}
      >
        <View style={{ padding: espaco.lg, gap: espaco.md }}>
          <Texto papel="display.sm">
            {itensEmRevisao.length}{' '}
            {itensEmRevisao.length === 1 ? 'preço diferente' : 'preços diferentes'}
          </Texto>
          <Texto papel="label" tom="secondary">
            Atualizar muda a estimativa de compras futuras, não altera a compra de agora.
          </Texto>

          {escolhendoExcecoes ? (
            <View style={{ gap: espaco.sm }}>
              {itensEmRevisao.map((divergencia) => {
                const selecionado = precosSelecionados.has(divergencia.produtoId);
                return (
                  <Pressable
                    key={divergencia.itemId}
                    onPress={() => alternarSelecaoDePreco(divergencia.produtoId)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selecionado }}
                    accessibilityLabel={`${divergencia.nome}, ${
                      divergencia.primeiroPreco ? 'sem preço salvo' : formatarBRL(divergencia.precoSalvo)
                    } para ${formatarBRL(divergencia.precoPago)}`}
                    style={{
                      minHeight: ALVO_TOQUE_MINIMO,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: espaco.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: raio.linha,
                        borderWidth: 2,
                        borderColor: selecionado ? tema.action.azulejo : tema.line.hairline,
                        backgroundColor: selecionado ? tema.action.azulejo : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {selecionado ? (
                        <Texto papel="label" cor={tema.text.onAction} importantForAccessibility="no">
                          ✓
                        </Texto>
                      ) : null}
                    </View>
                    <Texto papel="body.md" style={{ flex: 1 }}>
                      {divergencia.nome}:{' '}
                      {divergencia.primeiroPreco ? 'Sem preço salvo' : formatarBRL(divergencia.precoSalvo)} →{' '}
                      {formatarBRL(divergencia.precoPago)}
                    </Texto>
                  </Pressable>
                );
              })}
              <Botao
                titulo={`Confirmar ${precosSelecionados.size} selecionado${precosSelecionados.size === 1 ? '' : 's'}`}
                onPress={() => void confirmarRevisao()}
              />
            </View>
          ) : (
            <View style={{ gap: espaco.sm }}>
              <Botao
                titulo={`Atualizar ${itensEmRevisao.length}`}
                onPress={() => void confirmarRevisao(new Set(itensEmRevisao.map(({ produtoId }) => produtoId)))}
              />
              <Botao
                titulo="Manter preços salvos"
                variante="secundario"
                onPress={() => void confirmarRevisao(new Set())}
              />
              <Botao
                titulo="Escolher quais atualizar"
                variante="secundario"
                onPress={() => setEscolhendoExcecoes(true)}
              />
            </View>
          )}
        </View>
      </PainelInferior>

      {avisoDeFalha ? <Toast mensagem={avisoDeFalha} onFim={() => setAvisoDeFalha(null)} /> : null}
    </TelaBase>
  );
}
