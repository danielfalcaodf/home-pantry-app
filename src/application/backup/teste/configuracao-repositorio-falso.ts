import {
  Configuracoes,
  ConfiguracaoRepository,
  PADROES,
} from '../../../ports/configuracao.repository';

export class ConfiguracaoRepositorioFalso implements ConfiguracaoRepository {
  valores = new Map<string, unknown>();

  async ler<C extends keyof Configuracoes>(casaId: string, chave: C): Promise<Configuracoes[C]> {
    const chaveComposta = `${casaId}:${chave}`;
    return this.valores.has(chaveComposta)
      ? (this.valores.get(chaveComposta) as Configuracoes[C])
      : PADROES[chave];
  }

  async gravar<C extends keyof Configuracoes>(
    casaId: string,
    chave: C,
    valor: Configuracoes[C],
  ): Promise<void> {
    this.valores.set(`${casaId}:${chave}`, valor);
  }
}
