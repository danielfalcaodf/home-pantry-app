export type PreferenciaDeTema = 'automatico' | 'claro' | 'escuro';

// Cada chave declara seu padrão junto: ler preferência ausente nunca é erro,
// é o padrão.
export type Configuracoes = {
  tema: PreferenciaDeTema;
};

export const PADROES: Configuracoes = {
  tema: 'automatico',
};

export interface ConfiguracaoRepository {
  ler<C extends keyof Configuracoes>(casaId: string, chave: C): Promise<Configuracoes[C]>;
  gravar<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
    valor: Configuracoes[C],
  ): Promise<void>;
}
