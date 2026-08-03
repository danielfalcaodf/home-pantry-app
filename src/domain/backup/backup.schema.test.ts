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
    const antigo = { ...arquivoValido(), versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL - 1 };
    const convertido = converterParaVersaoAtual(antigo);
    expect(convertido.versaoSchema).toBe(VERSAO_SCHEMA_BACKUP_ATUAL);
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
