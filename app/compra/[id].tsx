import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useCancelarCompra } from '@/application/compra/use-cancelar-compra';
import { useFinalizarCompra } from '@/application/compra/use-finalizar-compra';
import { ItemDaCompra, useModoCompra } from '@/application/compra/use-modo-compra';
import { usePreferenciaDeAgrupamento } from '@/application/lista/use-preferencia-agrupamento';
import { totalPago } from '@/domain/compra/compra.rules';
import { centavos } from '@/domain/shared/dinheiro';
import { deDecimal, paraDecimal } from '@/domain/shared/quantidade';
import { Botao } from '@/presentation/components/botao';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { ItemCompra } from '@/presentation/components/item-compra';
import { RodapeCompra } from '@/presentation/components/rodape-compra';
import { SheetAjusteCompra } from '@/presentation/components/sheet-ajuste-compra';
import { Texto } from '@/presentation/components/texto';
import { Toast } from '@/presentation/components/toast';
import {
  agruparPorCategoriaGenerico,
  listaContinuaGenerico,
} from '@/presentation/format/agrupar-lista';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

function nomeDoItemDaCompra(linha: ItemDaCompra): string {
  return linha.item.nomeAvulso ?? linha.produto?.nome ?? '';
}

function categoriaDoItemDaCompra(linha: ItemDaCompra): string | null {
  return linha.produto?.categoria ?? null;
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
  const { itens, carregando, marcar, desmarcar, ajustarQuantidade, ajustarPreco, responderAtualizarPreco } =
    useModoCompra(id);
  const { finalizando, finalizar } = useFinalizarCompra();
  const { cancelando, cancelar } = useCancelarCompra();

  const { agrupado } = usePreferenciaDeAgrupamento();

  const [itemEmAjuste, setItemEmAjuste] = useState<ItemDaCompra | null>(null);
  const [aviso, setAviso] = useState<{ mensagem: string; sucesso: boolean } | null>(null);

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

  async function fecharCompra() {
    const resultado = await finalizar(id);
    if (resultado.ok) {
      const plural = resultado.itensRepostos !== 1;
      setAviso({
        mensagem: `Você repôs ${resultado.itensRepostos} ${plural ? 'itens' : 'item'}`,
        sucesso: true,
      });
      return;
    }
    setAviso({
      mensagem: 'Não foi possível fechar a compra agora. Toque em Fechar compra para tentar de novo.',
      sucesso: false,
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

  if (carregando) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
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
              onMarcar={() => void marcar(linha.item.item)}
              onDesmarcar={() => void desmarcar(linha.item.item.id)}
              onAjustar={() => setItemEmAjuste(linha.item)}
              onResponderPreco={(resposta) => void responderAtualizarPreco(linha.item.item.id, resposta)}
            />
          ),
        )}
      </ScrollView>

      {aviso?.sucesso ? null : (
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
          onFechar={() => setItemEmAjuste(null)}
          onSalvar={salvarAjuste}
        />
      ) : null}

      {aviso ? (
        <Toast
          mensagem={aviso.mensagem}
          onFim={() => {
            const foiSucesso = aviso.sucesso;
            setAviso(null);
            if (foiSucesso) {
              router.replace('/');
            }
          }}
        />
      ) : null}
    </View>
  );
}
