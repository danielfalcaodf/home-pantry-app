export type PreferenciaDeTema = 'automatico' | 'claro' | 'escuro';

// String, não boolean: mesmo padrão de chave-valor em texto de `tema`, sem
// parsing de "true"/"false".
export type PreferenciaDeAgrupamento = 'agrupado' | 'continuo';

// 6 modos em 3 pares critério × direção: nome (a-z / z-a), urgência
// (acabou primeiro / cheio primeiro) e quantidade (menor / maior) —
// `alfabetica` e `estado` mantêm os nomes originais da change (compat com o
// default já persistido); os quatro sentidos restantes foram adicionados
// depois (revisão de escopo para o menu de 6 opções).
export type OrdenacaoDaDespensa =
  | 'alfabetica'
  | 'alfabeticaInversa'
  | 'estado'
  | 'estadoInverso'
  | 'quantidade'
  | 'quantidadeInversa';

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
  ordenacaoDaDespensa: OrdenacaoDaDespensa;
};

export const PADROES: Configuracoes = {
  tema: 'automatico',
  agrupamentoDaLista: 'agrupado',
  ultimoBackupEm: '',
  conferenciaCategoria: '',
  conferenciaIndice: '0',
  ordenacaoDaDespensa: 'alfabetica',
};

export interface ConfiguracaoRepository {
  ler<C extends keyof Configuracoes>(casaId: string, chave: C): Promise<Configuracoes[C]>;
  gravar<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
    valor: Configuracoes[C],
  ): Promise<void>;
}
