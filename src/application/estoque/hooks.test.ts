import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, ProdutoRepositorioFalso, produtoFalso } from './teste/repositorio-falso';
import { useCadastrarProduto } from './use-cadastrar-produto';
import { useCategorias } from './use-categorias';
import { useEditarProduto, useProduto, useRemoverProduto } from './use-editar-produto';
import { useProdutos } from './use-produtos';

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
