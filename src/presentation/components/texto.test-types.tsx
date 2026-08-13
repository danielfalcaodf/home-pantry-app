import { Texto } from './texto';

/**
 * ACHADO-015: `Texto` só aceita papéis da escala tipográfica (`PapelTipografico`),
 * mas nada provava que o compilador rejeita um papel fora dela. Verificado
 * só por `tsc --noEmit`.
 */
function papelForaDaEscala() {
  // @ts-expect-error — 'display.xl' não pertence à escala de PapelTipografico.
  return <Texto papel="display.xl">quebrado</Texto>;
}

function papelDentroDaEscala() {
  return <Texto papel="display.lg">ok</Texto>;
}

void papelForaDaEscala;
void papelDentroDaEscala;
