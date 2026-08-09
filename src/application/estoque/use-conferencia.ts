import { useCallback, useEffect, useState } from 'react';

import { Produto } from '../../domain/produto/produto';
import { Milesimos } from '../../domain/shared/quantidade';
import {
  configuracaoRepository,
  obterIdentidadeLocal,
  produtoRepository,
  relogio,
} from '../../composicao/repositorios';
import { Clock } from '../../ports/clock';
import {
  CONFERENCIA_TUDO,
  ConfiguracaoRepository,
} from '../../ports/configuracao.repository';
import { ProdutoRepository } from '../../ports/produto.repository';
import { useAjustarEstoque } from './use-ajustar-estoque';

export { CONFERENCIA_TUDO } from '../../ports/configuracao.repository';

export type ItemDaConferencia = Pick<
  Produto,
  'id' | 'nome' | 'categoria' | 'unidade' | 'quantidadeAtual'
>;

export type ResumoDaConferencia = { corrigidos: number; corretos: number };

export type EstadoDaConferencia = {
  carregando: boolean;
  /** Categorias disponíveis para escolha, mais a opção de conferir tudo. */
  categorias: string[];
  /** Ausente enquanto o usuário não escolheu — mostra a tela de escolha. */
  categoriaEscolhida: string | null;
  itens: ItemDaConferencia[];
  indice: number;
  itemAtual: ItemDaConferencia | null;
  concluida: boolean;
  resumo: ResumoDaConferencia | null;
  escolherCategoria: (categoria: string) => Promise<void>;
  /** Confirma que a quantidade registrada está certa: avança sem gravar nada (D4). */
  confirmar: () => Promise<void>;
  /** Corrige para o valor final informado: grava ajuste e avança, sem diálogo extra. */
  corrigir: (valorFinal: Milesimos) => Promise<void>;
};

function ordenarPorNome(itens: Produto[]): Produto[] {
  return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/**
 * Fornece a sequência de itens e a posição do percurso de conferência
 * (task 3.2). O progresso É o estado do banco — retomar (design D5) é só
 * reler a posição salva, nunca uma transação pendente.
 */
export function useConferencia(
  repositorio: ProdutoRepository = produtoRepository,
  configuracoes: ConfiguracaoRepository = configuracaoRepository,
  clock: Clock = relogio,
) {
  const [carregando, setCarregando] = useState(true);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaEscolhida, setCategoriaEscolhida] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemDaConferencia[]>([]);
  const [indice, setIndice] = useState(0);
  const [resumo, setResumo] = useState<ResumoDaConferencia | null>(null);
  const { ajustar } = useAjustarEstoque(repositorio, clock);

  useEffect(() => {
    let montado = true;
    async function carregar() {
      const { casaId } = obterIdentidadeLocal();
      const [encontradas, categoriaSalva, indiceSalvo] = await Promise.all([
        repositorio.listarCategorias(casaId),
        configuracoes.ler(casaId, 'conferenciaCategoria'),
        configuracoes.ler(casaId, 'conferenciaIndice'),
      ]);
      if (!montado) {
        return;
      }
      setCategorias(encontradas);
      setCarregando(false);
      // Retomada (task 3.9): posição salva reabre direto no percurso.
      if (categoriaSalva !== '') {
        await selecionar(casaId, categoriaSalva, Number(indiceSalvo) || 0);
      }
    }
    async function selecionar(casaId: string, categoria: string, indiceInicial: number) {
      const todos = await repositorio.listarDespensa(casaId);
      const filtrados =
        categoria === CONFERENCIA_TUDO ? todos : todos.filter((p) => p.categoria === categoria);
      if (!montado) {
        return;
      }
      setCategoriaEscolhida(categoria);
      setItens(ordenarPorNome(filtrados));
      setIndice(Math.min(indiceInicial, filtrados.length));
      setResumo(null);
    }
    void carregar();
    return () => {
      montado = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escolherCategoria = useCallback(
    async (categoria: string) => {
      const { casaId } = obterIdentidadeLocal();
      const todos = await repositorio.listarDespensa(casaId);
      const filtrados =
        categoria === CONFERENCIA_TUDO ? todos : todos.filter((p) => p.categoria === categoria);
      setCategoriaEscolhida(categoria);
      setItens(ordenarPorNome(filtrados));
      setIndice(0);
      setResumo({ corrigidos: 0, corretos: 0 });
      await configuracoes.gravar(casaId, 'conferenciaCategoria', categoria);
      await configuracoes.gravar(casaId, 'conferenciaIndice', '0');
    },
    [repositorio, configuracoes],
  );

  const avancar = useCallback(
    async (corrigiu: boolean) => {
      const { casaId } = obterIdentidadeLocal();
      const proximo = indice + 1;
      setIndice(proximo);
      setResumo((atual) => ({
        corrigidos: (atual?.corrigidos ?? 0) + (corrigiu ? 1 : 0),
        corretos: (atual?.corretos ?? 0) + (corrigiu ? 0 : 1),
      }));
      if (proximo >= itens.length) {
        // Percurso concluído: limpa a posição salva — não há mais o que retomar.
        await configuracoes.gravar(casaId, 'conferenciaCategoria', '');
        await configuracoes.gravar(casaId, 'conferenciaIndice', '0');
      } else {
        await configuracoes.gravar(casaId, 'conferenciaIndice', String(proximo));
      }
    },
    [configuracoes, indice, itens.length],
  );

  const confirmar = useCallback(async () => {
    await avancar(false);
  }, [avancar]);

  const corrigir = useCallback(
    async (valorFinal: Milesimos) => {
      const item = itens[indice];
      if (!item) {
        return;
      }
      await ajustar(item.id, item.quantidadeAtual, valorFinal, null);
      await avancar(true);
    },
    [ajustar, itens, indice, avancar],
  );

  return {
    carregando,
    categorias,
    categoriaEscolhida,
    itens,
    indice,
    itemAtual: itens[indice] ?? null,
    concluida: categoriaEscolhida !== null && itens.length > 0 && indice >= itens.length,
    resumo,
    escolherCategoria,
    confirmar,
    corrigir,
  } satisfies EstadoDaConferencia;
}
