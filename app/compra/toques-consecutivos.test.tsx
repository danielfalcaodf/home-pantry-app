import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import { ItemDaCompra, useModoCompra } from '@/application/compra/use-modo-compra';
import { ObservadorFalso, produtoFalso, ProdutoRepositorioFalso } from '@/application/estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '@/application/lista/teste/repositorio-compra-falso';
import { milesimos } from '@/domain/shared/quantidade';
import { ItemCompra } from '@/presentation/components/item-compra';
import { ThemeProvider } from '@/presentation/theme/provider';

// Fica em app/ (não em src/application/), pois testa a composição real de
// application (useModoCompra) + presentation (ItemCompra) — application/
// não pode importar presentation/ (regra de dependência do CLAUDE.md), e
// rotas em app/ podem importar as duas.
jest.mock('../../src/composicao/repositorios', () => ({ compraRepository: undefined }));
jest.mock('../../src/composicao/observador', () => ({ observadorDoBanco: undefined }));

function ListaDeTeste({ itens, marcar }: { itens: ItemDaCompra[]; marcar: (item: ItemDaCompra) => void }) {
  return (
    <>
      {itens.map((linha) => (
        <ItemCompra
          key={linha.item.id}
          linha={linha}
          onMarcar={() => marcar(linha)}
          onDesmarcar={() => {}}
          onAjustar={() => {}}
          onResponderPreco={() => {}}
        />
      ))}
    </>
  );
}

afterEach(cleanup);

describe('useModoCompra + ItemCompra — ACHADO-054', () => {
  // Suspeita (task 4): toques rápidos consecutivos poderiam persistir o
  // item errado como comprado. Reproduz a condição — dois fireEvent.press
  // em itens diferentes, sem aguardar re-render entre eles — e inspeciona
  // o repositório fake para ver qual item foi gravado.
  //
  // NÃO REPRODUZIDO sob RNTL (task 4.4): cada linha de `ItemCompra` fecha
  // seu `onMarcar` sobre o `linha.item` do próprio `.map()` (identidade por
  // `key={linha.item.id}`, sem FlashList nesta tela), então o toque grava
  // sempre o id certo, mesmo sem re-render entre os dois toques. Como
  // `fireEvent.press` sintético não reproduz timing de touch nativo, "não
  // reproduzido aqui" não é a mesma garantia que "não existe em produção" —
  // se a suspeita persistir, abrir um novo achado de QA para teste manual
  // ou Maestro dedicado (fora do escopo desta change). Nenhuma mudança de
  // produção foi feita em `use-modo-compra.ts` nem `item-compra.tsx`.
  it('dois toques consecutivos em itens diferentes marcam cada um o item certo', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz' }),
      produtoFalso({ id: 'p2', nome: 'Feijão' }),
      produtoFalso({ id: 'p3', nome: 'Açúcar' }),
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
    const item3 = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p3',
      unidade: 'un',
      quantidadePlanejada: milesimos(1000),
    });

    const observador = new ObservadorFalso();
    const { result } = await renderHook(() => useModoCompra(aberta.valor.id, compras, observador));
    await waitFor(() => expect(result.current.carregando).toBe(false));

    const { unmount } = await render(
      <ThemeProvider preferencia="escuro">
        <ListaDeTeste itens={result.current.itens} marcar={(item) => void result.current.marcar(item)} />
      </ThemeProvider>,
    );

    // Sem `await`/`waitFor` entre os dois toques — condição exata do achado.
    fireEvent.press(screen.getByRole('checkbox', { name: /Arroz/ }));
    fireEvent.press(screen.getByRole('checkbox', { name: /Feijão/ }));

    await waitFor(() => {
      expect(compras.itens.find((i) => i.id === item1.id)?.comprado).toBe(true);
    });
    expect(compras.itens.find((i) => i.id === item2.id)?.comprado).toBe(true);
    expect(compras.itens.find((i) => i.id === item3.id)?.comprado).toBe(false);

    await act(async () => {
      unmount();
    });
  });
});
