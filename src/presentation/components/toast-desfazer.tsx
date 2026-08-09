import { Toast } from './toast';

export const JANELA_DESFAZER = 10_000;

export type RegistroParaDesfazer = {
  /** Desfazer é sempre por este id, nunca "o último gravado". */
  movimentoId: string;
  mensagem: string;
};

export type ToastDesfazerProps = {
  registro: RegistroParaDesfazer | null;
  onDesfazer: (movimentoId: string) => void;
  onFim: () => void;
};

/**
 * Um por vez: uma confirmação nova substitui a anterior. A `key` garante que
 * o temporizador reinicie no registro novo em vez de herdar o antigo.
 */
export function ToastDesfazer({ registro, onDesfazer, onFim }: ToastDesfazerProps) {
  if (!registro) {
    return null;
  }
  return (
    <Toast
      key={registro.movimentoId}
      mensagem={registro.mensagem}
      duracao={JANELA_DESFAZER}
      acao={{ titulo: 'Desfazer', onPress: () => onDesfazer(registro.movimentoId) }}
      onFim={onFim}
    />
  );
}
