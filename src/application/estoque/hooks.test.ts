import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, ProdutoRepositorioFalso, produtoFalso } from './teste/repositorio-falso';
import { useCadastrarProduto } from './use-cadastrar-produto';
import { useCategorias } from './use-categorias';
import { useEditarProduto, useProduto, useRemoverProduto } from './use-editar-produto';
import { aplicarOrdemCongelada, enriquecer, useProdutos } from './use-produtos';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  produtoRepository: undefined,
}));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

/** RNTL 14: renderHook resolve antes do commit — espere `current` existir. */
async function montar<T>(callback: () => T) {
  const { result } = await renderHook(callback);
  await waitFor(() => expect(result.current).not.toBeNull());
  return result;
}

// Os hooks buscam no repositório de forma assíncrona; sem drenar as promessas
// pendentes, a resolução cai no teste seguinte e derruba a árvore dele.
afterEach(async () => {
  await act(async () => {
    await Promise.resolve();
  });
  cleanup();
});


describe('useProdutos', () => {
  it('entrega estado, fração e rótulo já calculados pelo domínio', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', quantidadeAtual: milesimos(2000) }),
    ]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador));

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.itens).toHaveLength(1);
    expect(result.current.itens[0]).toEqual(
      expect.objectContaining({ estado: 'emFalta', rotulo: 'Falta 1', temSobra: false }),
    );
    expect(result.current.itens[0].fracao).toBeCloseTo(0.667, 2);
  });

  it('reconsulta quando o banco avisa que mudou', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso()]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador));
    await waitFor(() => expect(result.current.itens).toHaveLength(1));

    repo.produtos.push(produtoFalso({ id: 'p2', nome: 'Feijão' }));
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() => expect(result.current.itens).toHaveLength(2));
  });

  it('não expõe item removido logicamente', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ deletadoEm: 1 })]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.itens).toHaveLength(0);
  });

  it('modo "estado": item que muda de bucket não muda de posição, mas estado/fração/rótulo refletem o novo valor', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'critico', nome: 'Acabou', quantidadeAtual: milesimos(0) }),
      produtoFalso({ id: 'ok', nome: 'Cheio', quantidadeAtual: milesimos(3000) }),
    ]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador, 'estado'));
    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['critico', 'ok']);

    // 'critico' passa a ter mais estoque que 'ok' — no SQL real isso o levaria
    // para o fim do bucket "ok"; a posição congelada deve ignorar isso.
    const indice = repo.produtos.findIndex((p) => p.id === 'critico');
    repo.produtos[indice] = { ...repo.produtos[indice], quantidadeAtual: milesimos(5000) };
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() =>
      expect(result.current.itens.find((item) => item.produto.id === 'critico')?.estado).toBe(
        'ok',
      ),
    );
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['critico', 'ok']);
  });

  it('modo "alfabetica": mudança de estado não precisa de congelamento, ordem sempre segue a query', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'zebra', nome: 'Zebra', quantidadeAtual: milesimos(0) }),
      produtoFalso({ id: 'abacate', nome: 'Abacate', quantidadeAtual: milesimos(3000) }),
    ]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador, 'alfabetica'));
    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['abacate', 'zebra']);

    const indice = repo.produtos.findIndex((p) => p.id === 'zebra');
    repo.produtos[indice] = { ...repo.produtos[indice], quantidadeAtual: milesimos(5000) };
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() =>
      expect(result.current.itens.find((item) => item.produto.id === 'zebra')?.estado).toBe('ok'),
    );
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['abacate', 'zebra']);
  });

  it('trocar de modo durante a sessão recaptura a posição congelada imediatamente', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'critico', nome: 'Acabou', quantidadeAtual: milesimos(0) }),
      produtoFalso({ id: 'ok', nome: 'Cheio', quantidadeAtual: milesimos(3000) }),
    ]);
    const observador = new ObservadorFalso();
    const { result, rerender } = await renderHook(
      ({ modo }: { modo: 'alfabetica' | 'estado' }) => useProdutos(repo, observador, modo),
      { initialProps: { modo: 'estado' } },
    );
    await waitFor(() => expect(result.current.itens).toHaveLength(2));

    const indice = repo.produtos.findIndex((p) => p.id === 'critico');
    repo.produtos[indice] = { ...repo.produtos[indice], quantidadeAtual: milesimos(5000) };

    await act(async () => {
      rerender({ modo: 'alfabetica' });
      await Promise.resolve();
    });

    // Nova ordenação recapturada: modo alfabético reordena por nome de novo.
    await waitFor(() =>
      expect(result.current.itens.map((item) => item.produto.id)).toEqual(['critico', 'ok']),
    );
  });

  it('modo "quantidade": item que muda de valor não muda de posição, mas o dado exposto reflete o novo valor', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'menor', nome: 'Arroz', quantidadeAtual: milesimos(0) }),
      produtoFalso({ id: 'maior', nome: 'Batata', quantidadeAtual: milesimos(3000) }),
    ]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador, 'quantidade'));
    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['menor', 'maior']);

    // 'menor' passa a ter mais estoque que 'maior' — no SQL real isso o
    // levaria para o fim da lista; a posição congelada deve ignorar isso.
    const indice = repo.produtos.findIndex((p) => p.id === 'menor');
    repo.produtos[indice] = { ...repo.produtos[indice], quantidadeAtual: milesimos(5000) };
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() =>
      expect(
        result.current.itens.find((item) => item.produto.id === 'menor')?.produto.quantidadeAtual,
      ).toBe(milesimos(5000)),
    );
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['menor', 'maior']);
  });

  it('trocar de direção dentro do mesmo par (estado → estadoInverso) recaptura a posição congelada', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'critico', nome: 'Acabou', quantidadeAtual: milesimos(0) }),
      produtoFalso({ id: 'ok', nome: 'Cheio', quantidadeAtual: milesimos(3000) }),
    ]);
    const observador = new ObservadorFalso();
    const { result, rerender } = await renderHook(
      ({ modo }: { modo: 'estado' | 'estadoInverso' }) => useProdutos(repo, observador, modo),
      { initialProps: { modo: 'estado' as const } },
    );
    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['critico', 'ok']);

    await act(async () => {
      rerender({ modo: 'estadoInverso' });
      await Promise.resolve();
    });

    // Nova ordenação recapturada com a direção invertida: 'ok' vem primeiro.
    await waitFor(() =>
      expect(result.current.itens.map((item) => item.produto.id)).toEqual(['ok', 'critico']),
    );
  });

  it('produto novo entra sem deslocar a posição congelada; produto removido some sem afetar a ordem relativa', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'a', nome: 'Arroz', quantidadeAtual: milesimos(0) }),
      produtoFalso({ id: 'b', nome: 'Batata', quantidadeAtual: milesimos(0) }),
    ]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProdutos(repo, observador, 'estado'));
    await waitFor(() => expect(result.current.itens).toHaveLength(2));

    repo.produtos.push(produtoFalso({ id: 'c', nome: 'Cebola', quantidadeAtual: milesimos(0) }));
    const indiceRemovido = repo.produtos.findIndex((p) => p.id === 'a');
    repo.produtos[indiceRemovido] = { ...repo.produtos[indiceRemovido], deletadoEm: 1 };
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() => expect(result.current.itens).toHaveLength(2));
    expect(result.current.itens.map((item) => item.produto.id)).toEqual(['b', 'c']);
  });
});

describe('aplicarOrdemCongelada (função pura)', () => {
  it('mantém cada item na posição indicada pela ordem congelada', () => {
    const itens = [
      enriquecer(produtoFalso({ id: 'a', nome: 'A' })),
      enriquecer(produtoFalso({ id: 'b', nome: 'B' })),
      enriquecer(produtoFalso({ id: 'c', nome: 'C' })),
    ];
    const resultado = aplicarOrdemCongelada(itens, ['c', 'a', 'b']);
    expect(resultado.map((item) => item.produto.id)).toEqual(['c', 'a', 'b']);
  });

  it('item ausente da ordem (novo) é anexado ao final, na posição relativa em que veio', () => {
    const itens = [
      enriquecer(produtoFalso({ id: 'a', nome: 'A' })),
      enriquecer(produtoFalso({ id: 'novo', nome: 'Novo' })),
      enriquecer(produtoFalso({ id: 'b', nome: 'B' })),
    ];
    const resultado = aplicarOrdemCongelada(itens, ['a', 'b']);
    expect(resultado.map((item) => item.produto.id)).toEqual(['a', 'b', 'novo']);
  });

  it('item da ordem ausente dos itens (removido) é omitido do resultado', () => {
    const itens = [enriquecer(produtoFalso({ id: 'a', nome: 'A' }))];
    const resultado = aplicarOrdemCongelada(itens, ['removido', 'a']);
    expect(resultado.map((item) => item.produto.id)).toEqual(['a']);
  });
});

describe('useCadastrarProduto', () => {
  it('erro de validação volta antes de tocar o repositório', async () => {
    const repo = new ProdutoRepositorioFalso();
    const result = await montar(() => useCadastrarProduto(repo));
    const resultado = await result.current.cadastrar({
      nome: '  ',
      unidade: 'un',
      quantidadeNecessaria: 1,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.campo).toBe('nome');
    }
    expect(repo.produtos).toHaveLength(0);
  });

  it('nome duplicado vira mensagem no vocabulário da interface', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ nome: 'Arroz' })]);
    const result = await montar(() => useCadastrarProduto(repo));
    const resultado = await result.current.cadastrar({
      nome: 'arroz',
      unidade: 'un',
      quantidadeNecessaria: 1,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.erro.mensagem).toBe('Já existe um item chamado arroz na sua despensa.');
    }
  });

  it('cadastro válido cria o produto', async () => {
    const repo = new ProdutoRepositorioFalso();
    const result = await montar(() => useCadastrarProduto(repo));
    const resultado = await result.current.cadastrar({
      nome: 'Feijão',
      unidade: 'kg',
      quantidadeNecessaria: 1.5,
      categoria: ' grãos ',
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.quantidadeNecessaria).toBe(1500);
      expect(resultado.valor.categoria).toBe('Grãos');
    }
  });
});

describe('useProduto, useEditarProduto e useRemoverProduto', () => {
  it('carrega o item enriquecido pelo id', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso({ id: 'p9', nome: 'Café' })]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useProduto('p9', repo, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.item?.produto.nome).toBe('Café');
  });

  it('alterar a quantidade necessária muda o estado do item', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ quantidadeAtual: milesimos(2000), quantidadeNecessaria: milesimos(3000) }),
    ]);
    const observador = new ObservadorFalso();
    const lista = { result: await montar(() => useProdutos(repo, observador)) };
    await waitFor(() => expect(lista.result.current.itens[0].estado).toBe('emFalta'));

    const editor = { result: await montar(() => useEditarProduto(repo)) };
    await editor.result.current.editar('p1', { quantidadeNecessaria: milesimos(1000) });
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() => expect(lista.result.current.itens[0].estado).toBe('ok'));
  });

  it('remoção lógica tira o item da despensa', async () => {
    const repo = new ProdutoRepositorioFalso([produtoFalso()]);
    const observador = new ObservadorFalso();
    const lista = { result: await montar(() => useProdutos(repo, observador)) };
    await waitFor(() => expect(lista.result.current.itens).toHaveLength(1));

    const remocao = { result: await montar(() => useRemoverProduto(repo)) };
    await remocao.result.current.remover('p1');
    await act(async () => {
      observador.notificar();
    });

    await waitFor(() => expect(lista.result.current.itens).toHaveLength(0));
    expect(repo.produtos).toHaveLength(1); // continua no banco
  });
});

describe('useCategorias', () => {
  it('entrega as categorias existentes, sem repetir', async () => {
    const repo = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'a', nome: 'Arroz', categoria: 'Grãos' }),
      produtoFalso({ id: 'b', nome: 'Feijão', categoria: 'Grãos' }),
      produtoFalso({ id: 'c', nome: 'Sabão', categoria: 'Limpeza' }),
    ]);
    const observador = new ObservadorFalso();
    const result = await montar(() => useCategorias(repo, observador));
    await waitFor(() => expect(result.current).toEqual(['Grãos', 'Limpeza']));
  });
});

describe('conformidade dos hooks', () => {
  const diretorio = __dirname;
  const arquivos = fs
    .readdirSync(diretorio)
    .filter((nome) => nome.startsWith('use-') && nome.endsWith('.ts'));

  it.each(arquivos)('%s não importa implementação concreta de infraestrutura', (nome) => {
    const fonte = fs.readFileSync(path.join(diretorio, nome), 'utf8');
    expect(fonte).not.toMatch(/from ['"].*\/infrastructure\//);
    expect(fonte).not.toMatch(/SQLite\w+Repository/);
  });
});
