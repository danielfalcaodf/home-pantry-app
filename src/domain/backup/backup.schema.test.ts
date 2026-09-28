import {
  ArquivoBackup,
  CasaBackup,
  converterParaVersaoAtual,
  resumoDoBackup,
  UsuarioBackup,
  validarBackup,
  VERSAO_SCHEMA_BACKUP_ATUAL,
} from './backup.schema';

function casaValida(): CasaBackup {
  return { id: 'casa-1', nome: 'Minha casa', criadaEm: 0, atualizadoEm: 0 };
}

function usuarioValido(): UsuarioBackup {
  return {
    id: 'usuario-1',
    casaId: 'casa-1',
    nome: 'Eu',
    perfil: 'admin',
    criadoEm: 0,
    atualizadoEm: 0,
  };
}

function arquivoValido(): ArquivoBackup {
  return {
    versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL,
    exportadoEm: 1000,
    casa: casaValida(),
    usuarios: [usuarioValido()],
    produtos: [],
    movimentos: [],
    compras: [],
    itensCompra: [],
  };
}

describe('validarBackup', () => {
  it('aceita um arquivo com a forma completa', () => {
    const resultado = validarBackup(arquivoValido());
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.valor.casa.id).toBe('casa-1');
    }
  });

  it.each([null, undefined, 'texto', 42, ['array']])(
    'recusa %p como formato inválido',
    (entrada) => {
      const resultado = validarBackup(entrada);
      expect(resultado).toEqual({ ok: false, erro: 'formato_invalido' });
    },
  );

  it('recusa objeto sem nenhuma das coleções esperadas', () => {
    const resultado = validarBackup({ versaoSchema: 1 });
    expect(resultado).toEqual({ ok: false, erro: 'formato_invalido' });
  });

  it('recusa quando uma coleção não é um array de objetos', () => {
    const invalido = { ...arquivoValido(), produtos: 'não é array' };
    expect(validarBackup(invalido)).toEqual({ ok: false, erro: 'formato_invalido' });
  });

  it('recusa arquivo sem versão declarada', () => {
    const { versaoSchema, ...semVersao } = arquivoValido();
    void versaoSchema;
    expect(validarBackup(semVersao)).toEqual({ ok: false, erro: 'sem_versao' });
  });

  it('recusa versão mais nova que a suportada pelo app', () => {
    const futuro = { ...arquivoValido(), versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL + 1 };
    expect(validarBackup(futuro)).toEqual({ ok: false, erro: 'versao_mais_nova' });
  });

  it('aceita versão anterior à atual', () => {
    const antigo = { ...arquivoValido(), versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL - 1 };
    const resultado = validarBackup(antigo);
    expect(resultado.ok).toBe(true);
  });
});

describe('converterParaVersaoAtual', () => {
  it('é identidade quando o arquivo já está na versão atual', () => {
    const arquivo = arquivoValido();
    expect(converterParaVersaoAtual(arquivo)).toEqual(arquivo);
  });

  it('marca a versão como atual mesmo sem conversor registrado para a versão antiga', () => {
    const antigo = { ...arquivoValido(), versaoSchema: 3 };
    const convertido = converterParaVersaoAtual(antigo);
    expect(convertido.versaoSchema).toBe(VERSAO_SCHEMA_BACKUP_ATUAL);
  });

  it('v4 → v5 (change conversao-unidade-de-compra): preenche os campos novos de produto e item com null', () => {
    const produtoSemEmbalagem = {
      id: 'p1',
      casaId: 'casa-1',
      nome: 'Arroz',
      categoria: null,
      unidade: 'un',
      quantidadeAtual: 0,
      quantidadeNecessaria: 1000,
      valorUnitario: 0,
      marcaPreferida: null,
      observacao: null,
      ativo: true,
      criadoEm: 0,
      atualizadoEm: 0,
      deletadoEm: null,
      syncStatus: 'local',
    };
    const itemSemPacotes = {
      id: 'item-1',
      compraId: 'compra-1',
      produtoId: 'p1',
      nomeAvulso: null,
      unidade: 'un',
      quantidadePlanejada: 1000,
      quantidadeComprada: null,
      valorEstimadoUnit: 0,
      valorPagoUnitario: null,
      comprado: false,
      ordem: 0,
      excluido: false,
      atualizarPreco: null,
    };
    const antigo = {
      ...arquivoValido(),
      versaoSchema: 4,
      produtos: [produtoSemEmbalagem],
      itensCompra: [itemSemPacotes],
    } as unknown as ArquivoBackup;

    const convertido = converterParaVersaoAtual(antigo);

    expect(convertido.versaoSchema).toBe(VERSAO_SCHEMA_BACKUP_ATUAL);
    expect(convertido.produtos[0].fatorConversaoEmbalagem).toBeNull();
    expect(convertido.produtos[0].valorReferenciaEmbalagem).toBeNull();
    expect(convertido.itensCompra[0].quantidadePacotes).toBeNull();
    expect(convertido.itensCompra[0].fatorUsadoNaCompra).toBeNull();
  });

  describe('v5 → v6 (change correcao-unidades-un-kg-preco): unidades reduzidas a un/kg', () => {
    function produtoV5(id: string, unidade: string, atual: number, necessaria: number, valor: number, fator: number | null = null) {
      return {
        id,
        casaId: 'casa-1',
        nome: `Produto ${id}`,
        categoria: null,
        unidade,
        quantidadeAtual: atual,
        quantidadeNecessaria: necessaria,
        valorUnitario: valor,
        marcaPreferida: null,
        observacao: null,
        fatorConversaoEmbalagem: fator,
        valorReferenciaEmbalagem: fator === null ? null : 1290,
        ativo: true,
        criadoEm: 0,
        atualizadoEm: 0,
        deletadoEm: null,
        syncStatus: 'local',
      };
    }

    function movimentoV5(id: string, produtoId: string, delta: number, resultante: number) {
      return {
        id,
        casaId: 'casa-1',
        produtoId,
        usuarioId: 'usuario-1',
        compraId: null,
        tipo: delta < 0 ? 'baixa' : 'reposicao',
        quantidadeDelta: delta,
        quantidadeResultante: resultante,
        motivo: null,
        criadoEm: 0,
        syncStatus: 'local',
      };
    }

    function itemV5(id: string, compraId: string, unidade: string, planejada: number, comprada: number | null, estimado: number) {
      return {
        id,
        compraId,
        produtoId: null,
        nomeAvulso: 'Avulso',
        unidade,
        quantidadePlanejada: planejada,
        quantidadeComprada: comprada,
        valorEstimadoUnit: estimado,
        valorPagoUnitario: comprada === null ? null : 520,
        quantidadePacotes: null,
        fatorUsadoNaCompra: null,
        comprado: comprada !== null,
        ordem: 0,
        excluido: false,
        atualizarPreco: null,
      };
    }

    function compraV5(id: string, status: string) {
      return {
        id,
        casaId: 'casa-1',
        usuarioId: 'usuario-1',
        status,
        valorTotalPago: null,
        criadaEm: 0,
        finalizadaEm: status === 'finalizada' ? 1 : null,
        atualizadoEm: 0,
        syncStatus: 'local',
      };
    }

    const v5 = (conteudo: Partial<Record<keyof ArquivoBackup, unknown>>) =>
      ({ ...arquivoValido(), versaoSchema: 5, ...conteudo }) as unknown as ArquivoBackup;

    it('produto g vira kg sem preço e o histórico acompanha a escala', () => {
      const convertido = converterParaVersaoAtual(
        v5({
          produtos: [produtoV5('queijo', 'g', 500000, 1000000, 519)],
          movimentos: [movimentoV5('m1', 'queijo', 700000, 700000), movimentoV5('m2', 'queijo', -200000, 500000)],
        }),
      );

      expect(convertido.produtos[0]).toEqual(
        expect.objectContaining({ unidade: 'kg', quantidadeAtual: 500, quantidadeNecessaria: 1000, valorUnitario: 0 }),
      );
      expect(convertido.movimentos[1]).toEqual(
        expect.objectContaining({ quantidadeDelta: -200, quantidadeResultante: 500 }),
      );
    });

    it('fração de grama no movimento vira 1 milésimo de kg, nunca 0', () => {
      const convertido = converterParaVersaoAtual(
        v5({
          produtos: [produtoV5('acafrao', 'g', 1000, 5000, 0)],
          movimentos: [movimentoV5('m1', 'acafrao', -400, 1000)],
        }),
      );
      expect(convertido.movimentos[0].quantidadeDelta).toBe(-1);
    });

    it('caixa com fator 6 vira un sem mudar números, preço nem fator', () => {
      const convertido = converterParaVersaoAtual(
        v5({ produtos: [produtoV5('sabao', 'caixa', 2000, 3000, 215, 6)] }),
      );
      expect(convertido.produtos[0]).toEqual(
        expect.objectContaining({
          unidade: 'un',
          quantidadeAtual: 2000,
          quantidadeNecessaria: 3000,
          valorUnitario: 215,
          fatorConversaoEmbalagem: 6,
          valorReferenciaEmbalagem: 1290,
        }),
      );
    });

    it('L vira un arredondado para cima e sem preço; movimentos de outros produtos intactos', () => {
      const convertido = converterParaVersaoAtual(
        v5({
          produtos: [produtoV5('leite', 'L', 1500, 2500, 899)],
          movimentos: [movimentoV5('m1', 'leite', 1500, 1500)],
        }),
      );
      expect(convertido.produtos[0]).toEqual(
        expect.objectContaining({ unidade: 'un', quantidadeAtual: 2000, quantidadeNecessaria: 3000, valorUnitario: 0 }),
      );
      expect(convertido.movimentos[0].quantidadeDelta).toBe(1500);
    });

    it('itens de compra: g zera o estimado só em compra aberta; volume arredonda; pacote vira un', () => {
      const convertido = converterParaVersaoAtual(
        v5({
          compras: [compraV5('aberta', 'aberta'), compraV5('fechada', 'finalizada')],
          itensCompra: [
            itemV5('g-aberta', 'aberta', 'g', 500000, null, 519),
            itemV5('g-fechada', 'fechada', 'g', 500000, 400000, 519),
            itemV5('ml', 'aberta', 'ml', 1500, null, 0),
            itemV5('pacote', 'aberta', 'pacote', 2000, null, 1290),
          ],
        }),
      );
      const [gAberta, gFechada, ml, pacote] = convertido.itensCompra;
      expect(gAberta).toEqual(
        expect.objectContaining({ unidade: 'kg', quantidadePlanejada: 500, valorEstimadoUnit: 0 }),
      );
      expect(gFechada).toEqual(
        expect.objectContaining({
          unidade: 'kg',
          quantidadeComprada: 400,
          valorEstimadoUnit: 519,
          valorPagoUnitario: 520,
        }),
      );
      expect(ml).toEqual(expect.objectContaining({ unidade: 'un', quantidadePlanejada: 2000 }));
      expect(pacote).toEqual(
        expect.objectContaining({ unidade: 'un', quantidadePlanejada: 2000, valorEstimadoUnit: 1290 }),
      );
    });

    it('backup v4 passa pela cadeia inteira até v6', () => {
      const { fatorConversaoEmbalagem: _f, valorReferenciaEmbalagem: _v, ...produtoV4 } = produtoV5(
        'arroz',
        'pacote',
        2000,
        2000,
        2290,
      );
      const convertido = converterParaVersaoAtual({
        ...v5({ produtos: [produtoV4] }),
        versaoSchema: 4,
      });
      expect(convertido.versaoSchema).toBe(6);
      expect(convertido.produtos[0]).toEqual(
        expect.objectContaining({ unidade: 'un', quantidadeAtual: 2000, fatorConversaoEmbalagem: null }),
      );
    });
  });
});

describe('resumoDoBackup', () => {
  it('conta cada coleção e traz a data de exportação', () => {
    const arquivo: ArquivoBackup = {
      ...arquivoValido(),
      exportadoEm: 42,
      usuarios: [usuarioValido(), usuarioValido()],
      produtos: [],
      movimentos: [],
      compras: [],
      itensCompra: [],
    };
    expect(resumoDoBackup(arquivo)).toEqual({
      exportadoEm: 42,
      totalUsuarios: 2,
      totalProdutos: 0,
      totalMovimentos: 0,
      totalCompras: 0,
      totalItensCompra: 0,
    });
  });
});
