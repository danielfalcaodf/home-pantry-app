import { centavos } from '../../domain/shared/dinheiro';
import { milesimos } from '../../domain/shared/quantidade';
import { produtoFalso, ProdutoRepositorioFalso } from '../estoque/teste/repositorio-falso';
import { CompraRepositorioFalso } from '../lista/teste/repositorio-compra-falso';

import { divergenciasDePrecoMarcadas } from './revisao-preco';

describe('divergenciasDePrecoMarcadas', () => {
  it('inclui apenas itens marcados com produto e preço divergente, inclusive primeiro preço', async () => {
    const produtos = new ProdutoRepositorioFalso([
      produtoFalso({ id: 'p1', nome: 'Arroz', valorUnitario: centavos(890) }),
      produtoFalso({ id: 'p2', nome: 'Feijão', valorUnitario: centavos(0) }),
    ]);
    const compras = new CompraRepositorioFalso(produtos);
    const aberta = await compras.abrir('casa-teste', 'usuario-teste', 1000);
    if (!aberta.ok) {
      throw new Error('setup');
    }
    const divergente = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    const primeiroPreco = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p2', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    const avulso = await compras.adicionarItem(aberta.valor.id, {
      nomeAvulso: 'Pilha', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    const naoMarcado = await compras.adicionarItem(aberta.valor.id, {
      produtoId: 'p1', unidade: 'un', quantidadePlanejada: milesimos(1000),
    });
    await compras.editarItem(divergente.id, { comprado: true, valorPagoUnitario: centavos(950) });
    await compras.editarItem(primeiroPreco.id, { comprado: true, valorPagoUnitario: centavos(700) });
    await compras.editarItem(avulso.id, { comprado: true, valorPagoUnitario: centavos(300) });
    await compras.editarItem(naoMarcado.id, { valorPagoUnitario: centavos(950) });

    expect(divergenciasDePrecoMarcadas(await compras.listarItens(aberta.valor.id))).toEqual([
      expect.objectContaining({ produtoId: 'p1', precoSalvo: 890, precoPago: 950, primeiroPreco: false }),
      expect.objectContaining({ produtoId: 'p2', precoSalvo: 0, precoPago: 700, primeiroPreco: true }),
    ]);
  });
});
