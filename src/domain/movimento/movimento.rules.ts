import { falha, Result, sucesso } from '../../shared/result';
import { Milesimos, milesimos } from '../shared/quantidade';
import { TipoMovimento } from './movimento';

// Um movimento ainda não persistido: só o que as regras puras precisam.
export type MovimentoPendente = {
  tipo: TipoMovimento;
  variacao: Milesimos;
};

export type ErroMovimento = 'variacao_zero' | 'sinal_incoerente';

// Coerência de sinal (mesmo CHECK de DATABASE §4): baixa < 0, reposição > 0,
// ajuste com qualquer sinal — mas nunca zero.
export function construirMovimento(
  tipo: TipoMovimento,
  variacao: Milesimos,
): Result<MovimentoPendente, ErroMovimento> {
  if (variacao === 0) {
    return falha('variacao_zero');
  }
  if (tipo === 'baixa' && variacao > 0) {
    return falha('sinal_incoerente');
  }
  if (tipo === 'reposicao' && variacao < 0) {
    return falha('sinal_incoerente');
  }
  return sucesso({ tipo, variacao });
}

export type MovimentoAplicado =
  | { gravar: true; saldoResultante: Milesimos; variacaoAplicada: Milesimos }
  | { gravar: false; saldoResultante: Milesimos };

// Saldo nunca fica negativo: quando a variação cruzaria o zero, fixa em zero
// e a variação aplicada é a que produz esse saldo. Baixa sobre saldo já
// zerado não gera movimento — variação zero é rejeitada pelo banco e
// poluiria a trilha append-only (design D6).
export function aplicarMovimento(
  saldoAtual: Milesimos,
  movimento: MovimentoPendente,
): MovimentoAplicado {
  if (saldoAtual <= 0 && movimento.variacao < 0) {
    return { gravar: false, saldoResultante: milesimos(0) };
  }
  const saldoBruto = saldoAtual + movimento.variacao;
  if (saldoBruto < 0) {
    return {
      gravar: true,
      saldoResultante: milesimos(0),
      variacaoAplicada: milesimos(-saldoAtual),
    };
  }
  return {
    gravar: true,
    saldoResultante: milesimos(saldoBruto),
    variacaoAplicada: movimento.variacao,
  };
}

// Desfazer nunca altera a trilha: o inverso é um NOVO movimento de sinal
// oposto. Baixa vira reposição, reposição vira baixa, ajuste segue ajuste.
export function movimentoInverso(movimento: {
  tipo: TipoMovimento;
  quantidadeDelta: Milesimos;
}): MovimentoPendente {
  const variacao = milesimos(-movimento.quantidadeDelta);
  if (movimento.tipo === 'ajuste') {
    return { tipo: 'ajuste', variacao };
  }
  return { tipo: movimento.tipo === 'baixa' ? 'reposicao' : 'baixa', variacao };
}
