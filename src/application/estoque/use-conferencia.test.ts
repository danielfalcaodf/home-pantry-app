import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { ConfiguracaoRepositorioFalso } from '../backup/teste/configuracao-repositorio-falso';
import { CONFERENCIA_TUDO } from '../../ports/configuracao.repository';
import { milesimos } from '../../domain/shared/quantidade';
import { ProdutoRepositorioFalso, produtoFalso } from './teste/repositorio-falso';
import { useConferencia } from './use-conferencia';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
  configuracaoRepository: undefined,
  relogio: { agora: () => 1_700_000_000_000 },
}));

const relogio = { agora: () => 1_700_000_000_000 };

function montarRepo() {
  return new ProdutoRepositorioFalso([
    produtoFalso({ id: 'p1', nome: 'Arroz', categoria: 'Grãos', quantidadeAtual: milesimos(2000) }),
    produtoFalso({ id: 'p2', nome: 'Feijão', categoria: 'Grãos', quantidadeAtual: milesimos(0) }),
    produtoFalso({ id: 'p3', nome: 'Sabão', categoria: 'Limpeza', quantidadeAtual: milesimos(1000) }),
  ]);
}

async function montar(produtos: ProdutoRepositorioFalso, configuracoes: ConfiguracaoRepositorioFalso) {
  const { result } = await renderHook(() => useConferencia(produtos, configuracoes, relogio));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return result;
}

async function montarComUnmount(
  produtos: ProdutoRepositorioFalso,
  configuracoes: ConfiguracaoRepositorioFalso,
) {
  const { result, unmount } = await renderHook(() => useConferencia(produtos, configuracoes, relogio));
  await waitFor(() => expect(result.current.carregando).toBe(false));
  return { result, unmount };
}

afterEach(cleanup);

describe('useConferencia', () => {
  it('lista categorias e não escolhe nenhuma até o usuário decidir', async () => {
    const result = await montar(montarRepo(), new ConfiguracaoRepositorioFalso());
    expect(result.current.categorias).toEqual(['Grãos', 'Limpeza']);
    expect(result.current.categoriaEscolhida).toBeNull();
  });

  it('escolher uma categoria monta o percurso ordenado por nome, incluindo itens zerados', async () => {
    const result = await montar(montarRepo(), new ConfiguracaoRepositorioFalso());
    await act(async () => {
      await result.current.escolherCategoria('Grãos');
    });
    expect(result.current.itens.map((i) => i.nome)).toEqual(['Arroz', 'Feijão']);
    expect(result.current.itemAtual?.nome).toBe('Arroz');
    expect(result.current.indice).toBe(0);
  });

  it('conferir tudo inclui itens de todas as categorias', async () => {
    const result = await montar(montarRepo(), new ConfiguracaoRepositorioFalso());
    await act(async () => {
      await result.current.escolherCategoria(CONFERENCIA_TUDO);
    });
    expect(result.current.itens).toHaveLength(3);
  });

  it('confirmar avança sem gravar nenhum movimento', async () => {
    const repo = montarRepo();
    const result = await montar(repo, new ConfiguracaoRepositorioFalso());
    await act(async () => {
      await result.current.escolherCategoria('Grãos');
    });
    await act(async () => {
      await result.current.confirmar();
    });
    expect(result.current.indice).toBe(1);
    expect(result.current.itemAtual?.nome).toBe('Feijão');
    expect(repo.movimentos).toHaveLength(0);
  });

  it('corrigir grava um ajuste e avança', async () => {
    const repo = montarRepo();
    const result = await montar(repo, new ConfiguracaoRepositorioFalso());
    await act(async () => {
      await result.current.escolherCategoria('Grãos');
    });
    await act(async () => {
      await result.current.corrigir(milesimos(5000));
    });
    expect(repo.produtos.find((p) => p.id === 'p1')?.quantidadeAtual).toBe(5000);
    expect(repo.movimentos).toEqual([expect.objectContaining({ produtoId: 'p1', tipo: 'ajuste' })]);
    expect(result.current.indice).toBe(1);
  });

  it('conclui o percurso e informa quantos foram corrigidos e quantos estavam corretos', async () => {
    const repo = montarRepo();
    const result = await montar(repo, new ConfiguracaoRepositorioFalso());
    await act(async () => {
      await result.current.escolherCategoria('Grãos');
    });
    await act(async () => {
      await result.current.corrigir(milesimos(5000));
    });
    await act(async () => {
      await result.current.confirmar();
    });
    expect(result.current.concluida).toBe(true);
    expect(result.current.resumo).toEqual({ corrigidos: 1, corretos: 1 });
  });

  it('não oferece a mesma categoria criar/remover produto — apenas corrigir/confirmar', async () => {
    const result = await montar(montarRepo(), new ConfiguracaoRepositorioFalso());
    await act(async () => {
      await result.current.escolherCategoria('Grãos');
    });
    expect(Object.keys(result.current)).not.toContain('criar');
    expect(Object.keys(result.current)).not.toContain('remover');
  });

  it('retoma de onde parou: posição salva reabre direto no percurso', async () => {
    const repo = montarRepo();
    const configuracoes = new ConfiguracaoRepositorioFalso();
    await configuracoes.gravar('casa-teste', 'conferenciaCategoria', 'Grãos');
    await configuracoes.gravar('casa-teste', 'conferenciaIndice', '1');

    const result = await montar(repo, configuracoes);
    expect(result.current.categoriaEscolhida).toBe('Grãos');
    expect(result.current.indice).toBe(1);
    expect(result.current.itemAtual?.nome).toBe('Feijão');
  });

  it('sair no meio do percurso (sem confirmar) e remontar retoma o mesmo item, sem gravar movimento extra', async () => {
    const repo = montarRepo();
    const configuracoes = new ConfiguracaoRepositorioFalso();
    const { result: primeiraMontagem, unmount } = await montarComUnmount(repo, configuracoes);
    await act(async () => {
      await primeiraMontagem.current.escolherCategoria('Grãos');
    });
    await act(async () => {
      await primeiraMontagem.current.confirmar();
    });
    // Usuário sai (equivalente ao botão Voltar) sem confirmar/corrigir o item seguinte.
    await act(async () => {
      unmount();
    });

    const segundaMontagem = await montar(repo, configuracoes);
    expect(segundaMontagem.current.categoriaEscolhida).toBe('Grãos');
    expect(segundaMontagem.current.indice).toBe(1);
    expect(segundaMontagem.current.itemAtual?.nome).toBe('Feijão');
    expect(repo.movimentos).toHaveLength(0);
  });

  it('percurso concluído limpa a posição salva', async () => {
    const repo = montarRepo();
    const configuracoes = new ConfiguracaoRepositorioFalso();
    const result = await montar(repo, configuracoes);
    await act(async () => {
      await result.current.escolherCategoria('Limpeza');
    });
    await act(async () => {
      await result.current.confirmar();
    });
    expect(await configuracoes.ler('casa-teste', 'conferenciaCategoria')).toBe('');
  });
});
