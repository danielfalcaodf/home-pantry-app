export type ArquivoSelecionado = {
  uri: string;
  nome: string;
};

/**
 * Fronteira com o sistema de arquivos e a folha de compartilhamento do
 * aparelho — não é persistência (por isso não é um *Repository), mas
 * precisa da mesma injeção por interface para os hooks serem testáveis
 * sem depender de módulo nativo (mesmo espírito do port `Clock`).
 */
export interface SistemaDeArquivos {
  /** Grava o conteúdo num arquivo temporário e aciona a folha de compartilhamento do sistema. */
  gravarECompartilhar(nomeArquivo: string, conteudo: string, mimeType?: string): Promise<void>;
  /** Abre o seletor de arquivos do sistema; retorna `null` quando o usuário cancela. */
  selecionarArquivo(mimeType?: string): Promise<ArquivoSelecionado | null>;
  lerTexto(uri: string): Promise<string>;
}
