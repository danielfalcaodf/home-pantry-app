import { useCallback, useState } from 'react';

import {
  backupRepository,
  movimentoRepository,
  obterIdentidadeLocal,
  relogio,
  sistemaDeArquivos,
} from '../../composicao/repositorios';
import {
  ArquivoBackup,
  converterParaVersaoAtual,
  ErroValidacaoBackup,
  resumoDoBackup,
  ResumoBackup,
  validarBackup,
} from '../../domain/backup/backup.schema';
import { BackupRepository } from '../../ports/backup.repository';
import { DivergenciaReconciliacao, MovimentoRepository } from '../../ports/movimento.repository';
import { SistemaDeArquivos } from '../../ports/sistema-de-arquivos';

export type EstadoRestauracao =
  | { fase: 'ocioso' }
  | { fase: 'confirmando'; resumo: ResumoBackup; arquivo: ArquivoBackup }
  | { fase: 'restaurando' }
  | { fase: 'concluido'; divergencias: DivergenciaReconciliacao[] }
  | { fase: 'erro'; mensagem: string };

// Texto exato de FRONTEND §11 (task 3.6) — a única mensagem de restauração
// já definida no documento de frontend.
const MENSAGEM_VERSAO_MAIS_NOVA =
  'O backup é de uma versão mais nova do app. Atualize antes de restaurar.';
const MENSAGEM_FORMATO_INVALIDO = 'Este arquivo não é um backup válido.';
// Mesma voz de FRONTEND §11 ("Não foi possível salvar. Toque para tentar de
// novo.") — o banco já está intacto quando esta mensagem aparece: a
// transação de `restaurar` desfaz tudo sozinha em qualquer falha.
const MENSAGEM_FALHA = 'Não foi possível restaurar. Toque para tentar de novo.';

function mensagemDeValidacao(erro: ErroValidacaoBackup): string {
  return erro === 'versao_mais_nova' ? MENSAGEM_VERSAO_MAIS_NOVA : MENSAGEM_FORMATO_INVALIDO;
}

export type EstadoRestaurarBackup = {
  estado: EstadoRestauracao;
  /** Abre o seletor de arquivo, valida e — se válido — vai para 'confirmando'. */
  selecionar: () => Promise<void>;
  /** Aplica a restauração já confirmada; roda a reconciliação ao final. */
  confirmar: () => Promise<void>;
  /** Cancela a confirmação: nenhuma escrita ocorreu até aqui. */
  cancelar: () => void;
};

// Sem chamada de rede em nenhum passo (leitura de arquivo local, escrita no
// SQLite local) — funciona offline por construção (task 3.13).
export function useRestaurarBackup(
  backups: BackupRepository = backupRepository,
  movimentos: MovimentoRepository = movimentoRepository,
  arquivos: SistemaDeArquivos = sistemaDeArquivos,
): EstadoRestaurarBackup {
  const [estado, setEstado] = useState<EstadoRestauracao>({ fase: 'ocioso' });

  const selecionar = useCallback(async () => {
    const selecionado = await arquivos.selecionarArquivo('application/json');
    if (!selecionado) {
      // Cancelado no seletor do sistema: estado permanece intocado.
      return;
    }
    let bruto: unknown;
    try {
      bruto = JSON.parse(await arquivos.lerTexto(selecionado.uri));
    } catch {
      setEstado({ fase: 'erro', mensagem: MENSAGEM_FORMATO_INVALIDO });
      return;
    }
    const validado = validarBackup(bruto);
    if (!validado.ok) {
      setEstado({ fase: 'erro', mensagem: mensagemDeValidacao(validado.erro) });
      return;
    }
    const arquivo = converterParaVersaoAtual(validado.valor);
    setEstado({ fase: 'confirmando', resumo: resumoDoBackup(arquivo), arquivo });
  }, [arquivos]);

  const confirmar = useCallback(async () => {
    if (estado.fase !== 'confirmando') {
      return;
    }
    const { arquivo } = estado;
    setEstado({ fase: 'restaurando' });
    try {
      const { casaId } = obterIdentidadeLocal();
      await backups.restaurar(arquivo, casaId, relogio.agora());
      const divergencias = await movimentos.reconciliar(casaId);
      setEstado({ fase: 'concluido', divergencias });
    } catch {
      setEstado({ fase: 'erro', mensagem: MENSAGEM_FALHA });
    }
  }, [estado, backups, movimentos]);

  const cancelar = useCallback(() => {
    setEstado({ fase: 'ocioso' });
  }, []);

  return { estado, selecionar, confirmar, cancelar };
}
