export type PreferenciaDeTema = 'automatico' | 'claro' | 'escuro';

// String, não boolean: mesmo padrão de chave-valor em texto de `tema`, sem
// parsing de "true"/"false".
export type PreferenciaDeAgrupamento = 'agrupado' | 'continuo';

// Cada chave declara seu padrão junto: ler preferência ausente nunca é erro,
// é o padrão.
export type Configuracoes = {
  tema: PreferenciaDeTema;
  agrupamentoDaLista: PreferenciaDeAgrupamento;
};

export const PADROES: Configuracoes = {
  tema: 'automatico',
  agrupamentoDaLista: 'agrupado',
};

export interface ConfiguracaoRepository {
  ler<C extends keyof Configuracoes>(casaId: string, chave: C): Promise<Configuracoes[C]>;
  gravar<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
    valor: Configuracoes[C],
  ): Promise<void>;
}
