import { ArquivoSelecionado, SistemaDeArquivos } from '../../../ports/sistema-de-arquivos';

/** Substituível pelo real sem o caso de uso saber a diferença (LSP). */
export class SistemaDeArquivosFalso implements SistemaDeArquivos {
  gravados: { nomeArquivo: string; conteudo: string; mimeType?: string }[] = [];
  arquivoParaSelecionar: ArquivoSelecionado | null = null;
  textosPorUri: Record<string, string> = {};

  async gravarECompartilhar(
    nomeArquivo: string,
    conteudo: string,
    mimeType?: string,
  ): Promise<void> {
    this.gravados.push({ nomeArquivo, conteudo, mimeType });
  }

  async selecionarArquivo(): Promise<ArquivoSelecionado | null> {
    return this.arquivoParaSelecionar;
  }

  async lerTexto(uri: string): Promise<string> {
    return this.textosPorUri[uri] ?? '';
  }
}
