import { espaco } from '../theme/espaco';
import { Botao } from './botao';
import { TelaBase } from './tela-base';
import { Texto } from './texto';

export type TelaErroProps = {
  /** O que houve, sem pedido de desculpas (FRONTEND §11). */
  titulo: string;
  /** A ação de recuperação, em linguagem de quem usa. */
  descricao: string;
  detalhe?: string;
  acao?: { titulo: string; onPress: () => void };
};

export function TelaErro({ titulo, descricao, detalhe, acao }: TelaErroProps) {
  return (
    <TelaBase
      edges={['top', 'bottom']}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: espaco.xl,
        gap: espaco.lg,
      }}
    >
      <Texto papel="display.sm" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      <Texto papel="body.md" tom="secondary" style={{ textAlign: 'center' }}>
        {descricao}
      </Texto>
      {acao ? <Botao titulo={acao.titulo} onPress={acao.onPress} /> : null}
      {detalhe ? (
        <Texto papel="caption" tom="secondary" style={{ textAlign: 'center' }}>
          {detalhe}
        </Texto>
      ) : null}
    </TelaBase>
  );
}
