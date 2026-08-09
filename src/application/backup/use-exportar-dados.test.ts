import { act, cleanup, renderHook } from '@testing-library/react-native';

import { produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { SistemaDeArquivosFalso } from './teste/sistema-de-arquivos-falso';
import { useExportarDados } from './use-exportar-dados';

jest.mock('../../composicao/repositorios', () => ({
  obterIdentidadeLocal: () => ({ casaId: 'casa-teste', usuarioId: 'usuario-teste' }),
  relogio: { agora: () => 1_700_000_000_000 },
  produtoRepository: undefined,
  sistemaDeArquivos: undefined,
}));

afterEach(cleanup);

describe('useExportarDados', () => {
  it('gera um CSV com os produtos da despensa local e compartilha', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', casaId: 'casa-teste', nome: 'Arroz' }),
    ]);
    const arquivos = new SistemaDeArquivosFalso();
    const { result } = await renderHook(() => useExportarDados(produtos, arquivos));

    await act(async () => {
      await result.current.exportar();
    });

    expect(arquivos.gravados).toHaveLength(1);
    expect(arquivos.gravados[0].nomeArquivo).toMatch(/^repor-produtos-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(arquivos.gravados[0].mimeType).toBe('text/csv');
    expect(arquivos.gravados[0].conteudo).toContain('Arroz');
    expect(arquivos.gravados[0].conteudo.split('\r\n')[0]).toBe(
      'Nome,Categoria,Unidade,Quantidade atual,Quantidade necessária,Valor unitário',
    );
  });

  it('exportando fica falso outra vez ao final', async () => {
    const { result } = await renderHook(() =>
      useExportarDados(new ProdutoRepositorioFalso(), new SistemaDeArquivosFalso()),
    );
    expect(result.current.exportando).toBe(false);
    await act(async () => {
      await result.current.exportar();
    });
    expect(result.current.exportando).toBe(false);
  });
});
