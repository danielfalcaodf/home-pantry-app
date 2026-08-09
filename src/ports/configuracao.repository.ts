export type PreferenciaDeTema = 'automatico' | 'claro' | 'escuro';

// String, não boolean: mesmo padrão de chave-valor em texto de `tema`, sem
// parsing de "true"/"false".
export type PreferenciaDeAgrupamento = 'agrupado' | 'continuo';

/** Sentinela: percorrer todas as categorias, não uma específica (task 3.1). */
export const CONFERENCIA_TUDO = '*';

// Cada chave declara seu padrão junto: ler preferência ausente nunca é erro,
// é o padrão.
export type Configuracoes = {
  tema: PreferenciaDeTema;
  agrupamentoDaLista: PreferenciaDeAgrupamento;
  /** Epoch ms do último backup gerado, como texto — '' quando nunca houve. */
  ultimoBackupEm: string;
  /**
   * Posição do percurso de conferência (design D5): '' quando não há
   * conferência em andamento a retomar, `CONFERENCIA_TUDO` para "conferir
   * tudo", ou o nome da categoria escolhida.
   */
  conferenciaCategoria: string;
  /** Índice do próximo item a conferir, como texto. */
  conferenciaIndice: string;
};

export const PADROES: Configuracoes = {
  tema: 'automatico',
  agrupamentoDaLista: 'agrupado',
  ultimoBackupEm: '',
  conferenciaCategoria: '',
  conferenciaIndice: '0',
};

export interface ConfiguracaoRepository {
  ler<C extends keyof Configuracoes>(casaId: string, chave: C): Promise<Configuracoes[C]>;
  gravar<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
    valor: Configuracoes[C],
  ): Promise<void>;
}
