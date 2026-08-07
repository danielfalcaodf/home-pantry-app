import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useCancelarCompra } from '@/application/compra/use-cancelar-compra';
import { useFinalizarCompra } from '@/application/compra/use-finalizar-compra';
import { ItemDaCompra, useModoCompra } from '@/application/compra/use-modo-compra';
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
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

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

  const [itemEmAjuste, setItemEmAjuste] = useState<ItemDaCompra | null>(null);
  const [aviso, setAviso] = useState<{ mensagem: string; sucesso: boolean } | null>(null);

  const marcados = useMemo(() => itens.filter((linha) => linha.item.comprado).length, [itens]);
  const total = useMemo(() => totalPago(itens.map((linha) => linha.item)), [itens]);

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
          <BotaoVoltar />
          <Texto papel="display.sm">Compra</Texto>
        </View>
        <Texto papel="label" tom="secondary">
          Toque em cada item para marcar. Se sair, a compra continua aberta com o que você já marcou.
        </Texto>
      </View>

      <RodapeCompra marcados={marcados} totalDeItens={itens.length} total={total} />

      <ScrollView style={{ flex: 1 }}>
        {itens.map((linha) => (
          <ItemCompra
            key={linha.item.id}
            linha={linha}
            onMarcar={() => void marcar(linha.item)}
            onDesmarcar={() => void desmarcar(linha.item.id)}
            onAjustar={() => setItemEmAjuste(linha)}
            onResponderPreco={(resposta) => void responderAtualizarPreco(linha.item.id, resposta)}
          />
        ))}
      </ScrollView>

      {aviso?.sucesso ? null : (
        <View style={{ padding: espaco.lg, gap: espaco.md }}>
          <Botao titulo="Fechar compra" onPress={() => void fecharCompra()} disabled={finalizando} />
          <Botao
            titulo="Cancelar compra"
            variante="secundario"
            onPress={confirmarCancelamento}
            disabled={cancelando}
          />
        </View>
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
