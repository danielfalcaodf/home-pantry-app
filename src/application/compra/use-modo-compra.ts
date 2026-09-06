import { useCallback, useEffect, useState } from 'react';

import { divergenciaDePreco } from '../../domain/compra/compra.rules';
import { ajustarQuantidadeRapida as calcularQuantidadeRapida } from '../../domain/compra/quantidade-compra.rules';
import { derivarComPacotes, FatorConversao } from '../../domain/produto/conversao-embalagem.rules';
import { Centavos } from '../../domain/shared/dinheiro';
import { Milesimos } from '../../domain/shared/quantidade';
import { observadorDoBanco } from '../../composicao/observador';
import { compraRepository } from '../../composicao/repositorios';
import { CompraRepository, ItemComProduto } from '../../ports/compra.repository';
import { ObservadorDeMudancas } from '../../ports/observador-de-mudancas';

// `divergePreco` computado aqui (application), nunca na tela: a
// apresentação só recebe valores prontos (FRONTEND §12.2). Nunca perguntado
// para item avulso (4.4), pois avulso não tem produto associado.
export type ItemDaCompra = ItemComProduto & { divergePreco: boolean };

function comDivergencia(item: ItemComProduto): ItemDaCompra {
  const divergePreco =
    item.produto !== null &&
    item.item.valorPagoUnitario !== null &&
    divergenciaDePreco(item.item, item.produto);
  return { ...item, divergePreco };
}

export type EstadoModoCompra = {
  itens: ItemDaCompra[];
  carregando: boolean;
  /** Marca o item, assumindo a quantidade planejada quando não há ajuste (3.1). */
  marcar: (item: ItemComProduto) => Promise<void>;
  desmarcar: (itemId: string) => Promise<void>;
  ajustarQuantidade: (itemId: string, quantidadeComprada: Milesimos) => Promise<void>;
  ajustarQuantidadeRapida: (itemId: string, direcao: -1 | 1) => Promise<void>;
  ajustarPreco: (itemId: string, valorPagoUnitario: Centavos | null) => Promise<void>;
  /**
   * Ajuste detalhado para item cujo produto tem fator de conversão
   * cadastrado (spec modo-compra): substitui quantidade/preço por unidade
   * por pacotes + tamanho real do pacote + valor total pago. O tamanho real
   * pode divergir do fator cadastrado no produto — só é rastreado no item,
   * nunca retroalimenta o cadastro.
   */
  ajustarComPacotes: (
    itemId: string,
    pacotes: number,
    tamanhoPacote: FatorConversao,
    valorTotalPago: Centavos,
  ) => Promise<void>;
  responderAtualizarPreco: (itemId: string, resposta: boolean) => Promise<void>;
};

/**
 * Cada ação grava direto em `compra_item` (design D3): marcar, ajustar e
 * responder a pergunta de preço nunca tocam produto nem movimento — a
 * reposição inteira acontece só no fechamento, em uma transação própria
 * (use-finalizar-compra).
 */
export function useModoCompra(
  compraId: string,
  compras: CompraRepository = compraRepository,
  observador: ObservadorDeMudancas = observadorDoBanco,
): EstadoModoCompra {
  const [itens, setItens] = useState<ItemDaCompra[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(
    async (montado: () => boolean) => {
      const listaItens = await compras.listarItens(compraId);
      if (!montado()) {
        return;
      }
      // Item removido da lista ("Fora da lista por agora") antes de iniciar
      // a compra não pode reaparecer aqui — mesmo filtro de
      // use-lista-compras.ts e use-iniciar-compra.ts (A-16).
      setItens(listaItens.filter(({ item }) => !item.excluido).map(comDivergencia));
      setCarregando(false);
    },
    [compras, compraId],
  );

  useEffect(() => {
    let montado = true;
    const estaMontado = () => montado;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recarregar(estaMontado);
    const cancelarAssinatura = observador.assinar(() => {
      void recarregar(estaMontado);
    });
    return () => {
      montado = false;
      cancelarAssinatura();
    };
  }, [recarregar, observador]);

  const marcar = useCallback(
    async ({ item, produto }: ItemComProduto) => {
      // `valorEstimadoUnit` é Centavos não-nulável (0 = "sem preço", não
      // "não informado" — `??` nunca dispararia nele). Se estiver zerado
      // mas o produto já tem preço vivo (compra aberta residual criada
      // antes do preço ter sido editado na Lista — ver design.md), usa o
      // preço vivo do produto, já trazido junto na mesma consulta.
      const precoEstimado = item.valorEstimadoUnit > 0 ? item.valorEstimadoUnit : (produto?.valorUnitario ?? item.valorEstimadoUnit);
      await compras.editarItem(item.id, {
        comprado: true,
        quantidadeComprada: item.quantidadeComprada ?? item.quantidadePlanejada,
        // Sem preço pago digitado, assume o preço estimado do produto — mesmo padrão já
        // usado acima para a quantidade planejada (3.1).
        valorPagoUnitario: item.valorPagoUnitario ?? precoEstimado,
      });
    },
    [compras],
  );

  const desmarcar = useCallback(
    async (itemId: string) => {
      await compras.editarItem(itemId, { comprado: false, atualizarPreco: null });
    },
    [compras],
  );

  const ajustarQuantidade = useCallback(
    async (itemId: string, quantidadeComprada: Milesimos) => {
      await compras.editarItem(itemId, { quantidadeComprada });
    },
    [compras],
  );

  const ajustarQuantidadeRapida = useCallback(
    async (itemId: string, direcao: -1 | 1) => {
      const linha = itens.find((linha) => linha.item.id === itemId);
      if (!linha) {
        return;
      }
      const { item, produto } = linha;
      const atual = item.quantidadeComprada ?? item.quantidadePlanejada;
      // Prioriza o tamanho de pacote já confirmado nesta compra (mercado
      // pode divergir do cadastrado) sobre o fator cadastrado no produto —
      // mesma precedência do ajuste detalhado (design.md).
      const fator = item.fatorUsadoNaCompra ?? produto?.fatorConversaoEmbalagem ?? null;
      await compras.editarItem(itemId, {
        quantidadeComprada: calcularQuantidadeRapida(atual, item.unidade, direcao, fator),
      });
    },
    [compras, itens],
  );

  const ajustarPreco = useCallback(
    async (itemId: string, valorPagoUnitario: Centavos | null) => {
      await compras.editarItem(itemId, { valorPagoUnitario });
    },
    [compras],
  );

  const ajustarComPacotes = useCallback(
    async (
      itemId: string,
      pacotes: number,
      tamanhoPacote: FatorConversao,
      valorTotalPago: Centavos,
    ) => {
      const { quantidadeComprada, valorPagoUnitario } = derivarComPacotes(
        pacotes,
        tamanhoPacote,
        valorTotalPago,
      );
      await compras.editarItem(itemId, {
        quantidadeComprada,
        valorPagoUnitario,
        quantidadePacotes: pacotes,
        fatorUsadoNaCompra: tamanhoPacote,
      });
    },
    [compras],
  );

  const responderAtualizarPreco = useCallback(
    async (itemId: string, resposta: boolean) => {
      await compras.editarItem(itemId, { atualizarPreco: resposta });
    },
    [compras],
  );

  return {
    itens,
    carregando,
    marcar,
    desmarcar,
    ajustarQuantidade,
    ajustarQuantidadeRapida,
    ajustarPreco,
    ajustarComPacotes,
    responderAtualizarPreco,
  };
}
