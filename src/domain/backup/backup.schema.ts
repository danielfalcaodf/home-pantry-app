import { Compra, CompraItem } from '../compra/compra';
import { MovimentoEstoque } from '../movimento/movimento';
import { Produto } from '../produto/produto';
import { falha, Result, sucesso } from '../../shared/result';

// Casa/usuário não têm tipo de domínio próprio ainda (só existem como
// tabela) — nascem aqui porque o backup é o primeiro consumidor que
// precisa da forma completa dos dois para validação estrutural.
export type CasaBackup = {
  id: string;
  nome: string;
  criadaEm: number;
  atualizadoEm: number;
};

export type PerfilUsuario = 'admin' | 'membro';

export type UsuarioBackup = {
  id: string;
  casaId: string;
  nome: string;
  perfil: PerfilUsuario;
  criadoEm: number;
  atualizadoEm: number;
};

// Versão de schema do backup: acompanha o número de migrations aplicadas
// (design D3 / "Open Questions" — resolvida: a forma do backup deriva do
// schema do banco). Migrations atuais: 0000_init, 0001_configuracao,
// 0002_compra_item_exclusao, 0003_compra_item_atualizar_preco,
// 0004_conversao-unidade-de-compra → 5 aplicadas. Toda migration futura que
// mude a FORMA dos dados exportados soma 1 aqui e ganha uma entrada em
// `CONVERSORES`.
export const VERSAO_SCHEMA_BACKUP_ATUAL = 5;

// v4 → v5 (change conversao-unidade-de-compra): produto e item de compra
// ganharam campos opcionais novos. Um backup v4 nunca os teve — preencher
// com `null` é o mesmo estado de "sem embalagem cadastrada" que um produto
// já existente ganha depois da migration (comportamento inalterado).
function converterV4ParaV5(arquivo: ArquivoBackup): ArquivoBackup {
  return {
    ...arquivo,
    produtos: arquivo.produtos.map((produto) => ({
      ...produto,
      fatorConversaoEmbalagem: produto.fatorConversaoEmbalagem ?? null,
      valorReferenciaEmbalagem: produto.valorReferenciaEmbalagem ?? null,
    })),
    itensCompra: arquivo.itensCompra.map((item) => ({
      ...item,
      quantidadePacotes: item.quantidadePacotes ?? null,
      fatorUsadoNaCompra: item.fatorUsadoNaCompra ?? null,
    })),
  };
}

// Formato do arquivo de backup (design D1): JSON, não cópia do banco — os
// registros são as formas de domínio já existentes, em unidades internas
// (milésimos/centavos), sem conversão para exibição.
export type ArquivoBackup = {
  versaoSchema: number;
  exportadoEm: number;
  casa: CasaBackup;
  usuarios: UsuarioBackup[];
  produtos: Produto[];
  movimentos: MovimentoEstoque[];
  compras: Compra[];
  itensCompra: CompraItem[];
};

export type ErroValidacaoBackup = 'formato_invalido' | 'sem_versao' | 'versao_mais_nova';

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function ehArrayDeObjetos(valor: unknown): valor is Record<string, unknown>[] {
  return Array.isArray(valor) && valor.every(ehObjeto);
}

// Validação estrutural e de versão (design D6): TypeScript puro, sem tocar
// sistema de arquivos — ler o arquivo é responsabilidade da infraestrutura,
// validar a forma dele é regra de domínio.
export function validarBackup(dado: unknown): Result<ArquivoBackup, ErroValidacaoBackup> {
  if (!ehObjeto(dado)) {
    return falha('formato_invalido');
  }
  if (typeof dado.versaoSchema !== 'number') {
    return falha('sem_versao');
  }
  if (
    typeof dado.exportadoEm !== 'number' ||
    !ehObjeto(dado.casa) ||
    !ehArrayDeObjetos(dado.usuarios) ||
    !ehArrayDeObjetos(dado.produtos) ||
    !ehArrayDeObjetos(dado.movimentos) ||
    !ehArrayDeObjetos(dado.compras) ||
    !ehArrayDeObjetos(dado.itensCompra)
  ) {
    return falha('formato_invalido');
  }
  // Versão mais nova SÓ depois da checagem estrutural: um arquivo malformado
  // que também declara versão futura ainda é, antes de tudo, malformado.
  if (dado.versaoSchema > VERSAO_SCHEMA_BACKUP_ATUAL) {
    return falha('versao_mais_nova');
  }
  return sucesso(dado as unknown as ArquivoBackup);
}

// Uma entrada por versão publicada que mudou a forma dos dados (design D3).
// Só existe a versão corrente até aqui, então a conversão é identidade —
// cresce a cada migration futura que altere o formato do backup.
type Conversor = (arquivo: ArquivoBackup) => ArquivoBackup;
const CONVERSORES: Record<number, Conversor> = { 4: converterV4ParaV5 };

export function converterParaVersaoAtual(arquivo: ArquivoBackup): ArquivoBackup {
  let atual = arquivo;
  for (let versao = atual.versaoSchema; versao < VERSAO_SCHEMA_BACKUP_ATUAL; versao++) {
    const conversor = CONVERSORES[versao];
    atual = conversor ? conversor(atual) : atual;
  }
  return atual.versaoSchema === VERSAO_SCHEMA_BACKUP_ATUAL
    ? atual
    : { ...atual, versaoSchema: VERSAO_SCHEMA_BACKUP_ATUAL };
}

export type ResumoBackup = {
  exportadoEm: number;
  totalUsuarios: number;
  totalProdutos: number;
  totalMovimentos: number;
  totalCompras: number;
  totalItensCompra: number;
};

// Para a confirmação antes de aplicar (spec "Resumo antes de aplicar"):
// data do backup e contagem de registros, sem tocar o banco.
export function resumoDoBackup(arquivo: ArquivoBackup): ResumoBackup {
  return {
    exportadoEm: arquivo.exportadoEm,
    totalUsuarios: arquivo.usuarios.length,
    totalProdutos: arquivo.produtos.length,
    totalMovimentos: arquivo.movimentos.length,
    totalCompras: arquivo.compras.length,
    totalItensCompra: arquivo.itensCompra.length,
  };
}
