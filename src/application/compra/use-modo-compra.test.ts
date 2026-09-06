import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';

import { fatorConversao } from '../../domain/produto/conversao-embalagem.rules';
import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { ObservadorFalso, produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';
import { useModoCompra } from './use-modo-compra';

jest.mock('../../composicao/repositorios', () => ({ compraRepository: undefined }));
jest.mock('../../composicao/observador', () => ({ observadorDoBanco: undefined }));

afterEach(cleanup);

async function montarCompraComItem() {
  const produtos = new ProdutoRepositorioFalso([
    produtoFalso({ id: 'p1', nome: 'Arroz', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
  ]);
  const compras = new CompraRepositorioFalso(produtos);
  const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
  if (!aberta.ok) {
    throw new Error('setup');
  }
  const item = await compras.adicionarItem(aberta.valor.id, {
    produtoId: 'p1',
    unidade: 'un',
    quantidadePlanejada: milesimos(2000),
    valorEstimadoUnit: centavos(890),
  });
  return { compras, produtos, compraId: aberta.valor.id, item, observador: new ObservadorFalso() };
}

describe('useModoCompra', () => {
  it('marca o item assumindo a quantidade planejada quando não há ajuste', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar({ item, produto: null });
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));
    expect(result.current.itens[0].item.quantidadeComprada).toBe(2000);
  });

  it('marca sem preço pago digitado assume o preço estimado do produto (correção do total zerado)', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(item.valorEstimadoUnit).toBe(890);
    expect(item.valorPagoUnitario).toBeNull();

    await act(async () => {
      await result.current.marcar({ item, produto: null });
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(890);
  });

  it('marca com valorEstimadoUnit obsoleto (zero) usa o preço vivo do produto como rede de segurança', async () => {
    // Reproduz o bug relatado: item materializado numa compra aberta residual
    // ANTES de o preço do produto ter sido editado na Lista — valorEstimadoUnit
    // fica congelado em 0, mas o produto já tem preço vivo na mesma consulta.
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', valorUnitario: centavos(1000), quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(2000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const item = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(2000),
      // valorEstimadoUnit omitido de propósito -> default 0 do schema, como
      // aconteceria com uma linha residual criada antes do preço existir.
    });
    expect(item.valorEstimadoUnit).toBe(0);
    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar(result.current.itens[0]);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(1000);
  });

  it('marca item sem nenhum preço cadastrado grava zero (não inventa valor, contribui zero no total)', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Pilha', quantidadeAtual: milesimos(0), quantidadeNecessaria: milesimos(1000) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const item = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    expect(item.valorEstimadoUnit).toBe(0);
    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar({ item, produto: null });
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(0);
  });

  it('marca item com preço já ajustado manualmente não sobrescreve o valor ajustado', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.ajustarPreco(item.id, centavos(950));
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.valorPagoUnitario).toBe(950));

    await act(async () => {
      await result.current.marcar({ item: { ...item, valorPagoUnitario: centavos(950) }, produto: null });
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(950);
  });

  it('ajustarPreco depois de marcar continua sobrescrevendo o preço herdado assumido por padrão', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar({ item, produto: null });
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.valorPagoUnitario).toBe(890));

    await act(async () => {
      await result.current.ajustarPreco(item.id, centavos(750));
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.valorPagoUnitario).toBe(750));
  });

  it('desmarcar reverte a marcação sem apagar os valores ajustados', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.marcar({ item, produto: null });
      await result.current.ajustarPreco(item.id, centavos(950));
      await result.current.responderAtualizarPreco(item.id, true);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(true));

    await act(async () => {
      await result.current.desmarcar(item.id);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.comprado).toBe(false));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(950);
    expect(result.current.itens[0].item.atualizarPreco).toBeNull();
  });

  it('ajustar quantidade e preço recalcula o que fica gravado no item', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.ajustarQuantidade(item.id, milesimos(1500));
      await result.current.ajustarPreco(item.id, centavos(700));
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(1500));
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(700);
  });

  it('responder a pergunta de preço grava a resposta no item, sem alterar o produto', async () => {
    const { compras, produtos, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.responderAtualizarPreco(item.id, true);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.atualizarPreco).toBe(true));
    expect(produtos.produtos[0].valorUnitario).toBe(890);
  });

  it('detecta divergência de preço, inclusive quando o produto não tem preço cadastrado', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', valorUnitario: centavos(890) }),
      produtoFalso({ id: 'p2', nome: 'Feijão', valorUnitario: centavos(0) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const item1 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    const item2 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p2',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    const avulso = await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha AA',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(item1.id, { valorPagoUnitario: centavos(950) });
    await compras.editarItem(item2.id, { valorPagoUnitario: centavos(300) });
    await compras.editarItem(avulso.id, { valorPagoUnitario: centavos(300) });

    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    const porId = new Map(result.current.itens.map((i) => [i.item.id, i]));
    expect(porId.get(item1.id)?.divergePreco).toBe(true);
    expect(porId.get(item2.id)?.divergePreco).toBe(true); // sem preço cadastrado (D5)
    expect(porId.get(avulso.id)?.divergePreco).toBe(false); // avulso nunca pergunta (4.4)
  });

  it('retomada: marcações preservadas ao sair e voltar, pois o estado vem sempre do repositório', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    await compras.editarItem(item.id, { comprado: true, quantidadeComprada: milesimos(2000) });

    const primeira = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(primeira.result.current.carregando).toBe(false));
    expect(primeira.result.current.itens[0].item.comprado).toBe(true);
    await act(async () => {
      primeira.unmount();
    });

    // "voltar à tela": nova instância do hook, mesmo compraId.
    const segunda = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(segunda.result.current.carregando).toBe(false));
    expect(segunda.result.current.itens[0].item.comprado).toBe(true);
    expect(segunda.result.current.itens[0].item.quantidadeComprada).toBe(2000);
  });

  it('ajuste rápido altera quantidade antes e depois da marcação sem mudar a marcação nem o preço detalhado', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.ajustarQuantidadeRapida(item.id, 1);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(3000));
    expect(result.current.itens[0].item.comprado).toBe(false);

    await act(async () => {
      await result.current.ajustarPreco(item.id, centavos(700));
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.valorPagoUnitario).toBe(700));

    await act(async () => {
      await result.current.marcar(result.current.itens[0]);
      await result.current.ajustarQuantidadeRapida(item.id, -1);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(2000));
    expect(result.current.itens[0].item.comprado).toBe(true);
    expect(result.current.itens[0].item.valorPagoUnitario).toBe(700);
  });

  it('ajuste rápido não reduz unidade indivisível abaixo de uma unidade', async () => {
    const { compras, compraId, item, observador } = await montarCompraComItem();
    await compras.editarItem(item.id, { quantidadeComprada: milesimos(1000) });
    const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    await act(async () => {
      await result.current.ajustarQuantidadeRapida(item.id, -1);
      observador.notificar();
    });
    await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(1000));
  });

  // ACHADO-054 (task 4): reproduzido e não confirmado com um componente real
  // — teste dedicado em app/compra/toques-consecutivos.test.tsx, pois
  // renderizar `ItemCompra` (presentation/) aqui violaria a regra de
  // dependência application/ → presentation/ (CLAUDE.md).

  describe('ajuste rápido com fator de conversão (achado pós-exploração, 2026-09-05)', () => {
    it('"+" anda pelo fator cadastrado do produto, não por 1 unidade', async () => {
      const produtos = new ProdutoRepositorioFalso([
        produtoFalso({ id: 'p1', nome: 'Papel higiênico', fatorConversaoEmbalagem: fatorConversao(6) }),
      ]);
      const compras = new CompraRepositorioFalso(produtos);
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup');
      }
      const item = await compras.adicionarItem(aberta.valor.id, {
        produtoId: 'p1',
        unidade: 'un',
        quantidadePlanejada: milesimos(6000),
      });
      const observador = new ObservadorFalso();
      const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        await result.current.ajustarQuantidadeRapida(item.id, 1);
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(12000));
    });

    it('"-" não desce abaixo de 1 pacote inteiro', async () => {
      const produtos = new ProdutoRepositorioFalso([
        produtoFalso({ id: 'p1', nome: 'Papel higiênico', fatorConversaoEmbalagem: fatorConversao(6) }),
      ]);
      const compras = new CompraRepositorioFalso(produtos);
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup');
      }
      const item = await compras.adicionarItem(aberta.valor.id, {
        produtoId: 'p1',
        unidade: 'un',
        quantidadePlanejada: milesimos(6000),
      });
      const observador = new ObservadorFalso();
      const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        await result.current.ajustarQuantidadeRapida(item.id, -1);
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(6000));
    });

    it('usa o tamanho de pacote já confirmado nesta compra, não o cadastrado', async () => {
      const produtos = new ProdutoRepositorioFalso([
        produtoFalso({ id: 'p1', nome: 'Papel higiênico', fatorConversaoEmbalagem: fatorConversao(12) }),
      ]);
      const compras = new CompraRepositorioFalso(produtos);
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup');
      }
      const item = await compras.adicionarItem(aberta.valor.id, {
        produtoId: 'p1',
        unidade: 'un',
        quantidadePlanejada: milesimos(12000),
      });
      const observador = new ObservadorFalso();
      const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        // Mercado tinha pacote de 16, não 12 — confirmado no ajuste detalhado.
        await result.current.ajustarComPacotes(item.id, 1, fatorConversao(16), centavos(1600));
        observador.notificar();
      });
      await waitFor(() => expect(result.current.itens[0].item.fatorUsadoNaCompra).toBe(16));

      await act(async () => {
        await result.current.ajustarQuantidadeRapida(item.id, 1);
        observador.notificar();
      });

      // 16 (confirmado) + 16, não 16 + 12 (cadastrado).
      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(32000));
    });

    it('produto sem fator mantém o passo por unidade de sempre', async () => {
      const { compras, compraId, item, observador } = await montarCompraComItem();
      const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        await result.current.ajustarQuantidadeRapida(item.id, 1);
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(3000));
    });
  });

  describe('ajustarComPacotes (change conversao-unidade-de-compra)', () => {
    it('deriva quantidade comprada e preço por unidade a partir de pacotes', async () => {
      const produtos = new ProdutoRepositorioFalso([
        produtoFalso({
          id: 'p1',
          nome: 'Papel higiênico',
          fatorConversaoEmbalagem: fatorConversao(12),
          valorUnitario: centavos(100),
        }),
      ]);
      const compras = new CompraRepositorioFalso(produtos);
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup');
      }
      const item = await compras.adicionarItem(aberta.valor.id, {
        produtoId: 'p1',
        unidade: 'un',
        quantidadePlanejada: milesimos(12000),
      });
      const observador = new ObservadorFalso();
      const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        await result.current.ajustarComPacotes(item.id, 1, fatorConversao(12), centavos(1290));
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(12000));
      expect(result.current.itens[0].item.valorPagoUnitario).toBe(108);
      expect(result.current.itens[0].item.quantidadePacotes).toBe(1);
      expect(result.current.itens[0].item.fatorUsadoNaCompra).toBe(12);
    });

    it('tamanho de pacote diferente do cadastrado no mercado não altera o fator do produto', async () => {
      const produtos = new ProdutoRepositorioFalso([
        produtoFalso({
          id: 'p1',
          nome: 'Papel higiênico',
          fatorConversaoEmbalagem: fatorConversao(12),
          valorUnitario: centavos(100),
        }),
      ]);
      const compras = new CompraRepositorioFalso(produtos);
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup');
      }
      const item = await compras.adicionarItem(aberta.valor.id, {
        produtoId: 'p1',
        unidade: 'un',
        quantidadePlanejada: milesimos(12000),
      });
      const observador = new ObservadorFalso();
      const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        // Mercado tinha pacote de 16, não 12.
        await result.current.ajustarComPacotes(item.id, 1, fatorConversao(16), centavos(1600));
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(16000));
      expect(result.current.itens[0].item.valorPagoUnitario).toBe(100);
      expect(result.current.itens[0].item.fatorUsadoNaCompra).toBe(16);
      expect(produtos.produtos[0].fatorConversaoEmbalagem).toBe(12); // cadastro intocado
    });

    it('preço derivado de pacotes que diverge do cadastrado aciona a mesma revisão existente', async () => {
      const produtos = new ProdutoRepositorioFalso([
        produtoFalso({
          id: 'p1',
          nome: 'Papel higiênico',
          fatorConversaoEmbalagem: fatorConversao(12),
          valorUnitario: centavos(100),
        }),
      ]);
      const compras = new CompraRepositorioFalso(produtos);
      const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
      if (!aberta.ok) {
        throw new Error('setup');
      }
      const item = await compras.adicionarItem(aberta.valor.id, {
        produtoId: 'p1',
        unidade: 'un',
        quantidadePlanejada: milesimos(12000),
      });
      const observador = new ObservadorFalso();
      const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        // 1290/12 = 108, diverge do valorUnitario cadastrado (100).
        await result.current.ajustarComPacotes(item.id, 1, fatorConversao(12), centavos(1290));
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.valorPagoUnitario).toBe(108));
      expect(result.current.itens[0].divergePreco).toBe(true);
    });

    it('produto sem fator mantém o fluxo existente de quantidade/preço por unidade', async () => {
      const { compras, compraId, item, observador } = await montarCompraComItem();
      const { result } = await renderHook(() => useModoCompra(compraId, compras, observador));
      await waitFor(() => expect(result.current.carregando).toBe(false));

      await act(async () => {
        await result.current.ajustarQuantidade(item.id, milesimos(1500));
        await result.current.ajustarPreco(item.id, centavos(700));
        observador.notificar();
      });

      await waitFor(() => expect(result.current.itens[0].item.quantidadeComprada).toBe(1500));
      expect(result.current.itens[0].item.quantidadePacotes).toBeNull();
      expect(result.current.itens[0].item.fatorUsadoNaCompra).toBeNull();
    });
  });
});
