import { falha, Result, sucesso } from '../../shared/result';
import { Centavos, centavos, dividirIgualmente } from '../shared/dinheiro';
import { Milesimos, milesimos } from '../shared/quantidade';
import { ehIndivisivel, Unidade } from '../shared/unidade';

// Quantas unidades de estoque vêm num pacote fechado — nunca milésimos,
// é uma contagem inteira (DATABASE: `fator_conversao_embalagem`).
export type FatorConversao = number & { readonly __marca: 'fatorConversao' };

export function fatorConversao(n: number): FatorConversao {
  return Math.trunc(n) as FatorConversao;
}

export type ErroFatorConversao = { mensagem: string };

// Fator é sempre opcional; `null`/`undefined` na entrada não é erro, é
// "produto sem embalagem cadastrada" (spec conversao-de-embalagem, cenário
// "Fator é opcional").
export function validarFatorConversao(
  unidade: Unidade,
  fator: number | null | undefined,
): Result<FatorConversao | null, ErroFatorConversao> {
  if (fator === null || fator === undefined) {
    return sucesso(null);
  }
  if (!ehIndivisivel(unidade)) {
    return falha({ mensagem: 'Embalagem só vale para unidade indivisível' });
  }
  if (!Number.isInteger(fator) || fator <= 0) {
    return falha({ mensagem: 'Informe um número inteiro maior que zero' });
  }
  return sucesso(fatorConversao(fator));
}

// Vocabulário de interface: rótulo só composto pelo número, sem campo de
// texto livre para nomear a embalagem (spec, "Rótulo do pacote").
export function rotuloDoPacote(fator: FatorConversao | null): string | null {
  return fator === null ? null : `Vem em pacotes de ${fator}`;
}

// Divide o valor do pacote pelo fator, arredondando ao centavo mais próximo
// — nunca truncando (spec: 1290/12 = 107,5 → 108, não 107).
export function valorUnitarioDoPacote(
  valorPacote: Centavos,
  fator: FatorConversao,
): Centavos {
  return dividirIgualmente(valorPacote, fator);
}

// Custo estimado a partir da quantidade em unidades, calculado numa única
// conta (quantidade × valor do pacote ÷ fator) — nunca multiplicando a
// quantidade pelo `valorUnitarioDoPacote` já arredondado de volta, que
// reintroduz o erro que a divisão tinha eliminado (achado em produção: um
// pacote de 6 a R$10,00 vira R$1,67/un e 6 × R$1,67 = R$10,02, não R$10,00).
// Funciona mesmo se a quantidade não for múltiplo exato do fator (ajuste
// manual de unidade no modo compra).
export function custoEstimadoComFator(
  quantidadeEmUnidades: Milesimos,
  fator: FatorConversao,
  valorPacote: Centavos,
): Centavos {
  const unidades = quantidadeEmUnidades / 1000;
  return centavos(Math.round((unidades * valorPacote) / fator));
}

export type QuantidadeComPacotes = {
  /** Total em unidades de estoque (milésimos) — pacotes × fator. */
  quantidade: Milesimos;
  pacotes: number;
  /** Unidades que sobrarão em estoque além da falta, após a compra. */
  excedente: Milesimos;
};

// Arredonda a falta para o múltiplo do fator, nunca para 1 unidade —
// substitui `arredondarParaUnidade` quando o produto tem embalagem
// cadastrada (spec regras-de-estoque, "Arredondamento... para múltiplo do
// fator"). `falta` já vem clampada em >= 0 por quem chama.
export function quantidadeAComprarComFator(
  falta: Milesimos,
  fator: FatorConversao,
): QuantidadeComPacotes {
  const faltaEmUnidades = falta / 1000;
  const pacotes = faltaEmUnidades <= 0 ? 0 : Math.ceil(faltaEmUnidades / fator);
  const totalEmUnidades = pacotes * fator;
  return {
    quantidade: milesimos(totalEmUnidades * 1000),
    pacotes,
    excedente: milesimos((totalEmUnidades - faltaEmUnidades) * 1000),
  };
}

export type AjustePorPacotes = {
  quantidadeComprada: Milesimos;
  valorPagoUnitario: Centavos;
};

// Deriva quantidade comprada e preço por unidade a partir do que foi
// realmente encontrado no mercado — o tamanho do pacote aqui pode divergir
// do fator cadastrado no produto, e essa divergência nunca retroalimenta o
// cadastro (spec, "Preço pago por unidade derivado do fator usado na compra").
export function derivarComPacotes(
  pacotes: number,
  tamanhoPacoteUsado: FatorConversao,
  valorTotalPago: Centavos,
): AjustePorPacotes {
  const totalEmUnidades = pacotes * tamanhoPacoteUsado;
  return {
    quantidadeComprada: milesimos(totalEmUnidades * 1000),
    valorPagoUnitario: dividirIgualmente(valorTotalPago, totalEmUnidades),
  };
}
