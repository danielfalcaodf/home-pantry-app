import { useCallback, useState } from 'react';

import { apagarTodosOsDados } from '../../composicao/repositorios';

export type EstadoApagarTudo =
  | { fase: 'ocioso' }
  | { fase: 'confirmando' }
  | { fase: 'apagando' }
  | { fase: 'concluido' }
  | { fase: 'erro'; mensagem: string };

const MENSAGEM_FALHA = 'Não foi possível apagar. Toque para tentar de novo.';

export type EstadoApagarTodosOsDados = {
  estado: EstadoApagarTudo;
  /** Primeira confirmação (inline, mesmo padrão da restauração de backup). */
  pedirConfirmacao: () => void;
  /** Segunda confirmação (alerta nativo destrutivo) já aceita — executa o reset. */
  confirmar: () => Promise<void>;
  cancelar: () => void;
};

export function useApagarTodosOsDados(): EstadoApagarTodosOsDados {
  const [estado, setEstado] = useState<EstadoApagarTudo>({ fase: 'ocioso' });

  const pedirConfirmacao = useCallback(() => {
    setEstado({ fase: 'confirmando' });
  }, []);

  const confirmar = useCallback(async () => {
    setEstado({ fase: 'apagando' });
    try {
      apagarTodosOsDados();
      setEstado({ fase: 'concluido' });
    } catch {
      setEstado({ fase: 'erro', mensagem: MENSAGEM_FALHA });
    }
  }, []);

  const cancelar = useCallback(() => {
    setEstado({ fase: 'ocioso' });
  }, []);

  return { estado, pedirConfirmacao, confirmar, cancelar };
}
