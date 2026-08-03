import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ArquivoSelecionado, SistemaDeArquivos } from '../../ports/sistema-de-arquivos';

export class ExpoSistemaDeArquivos implements SistemaDeArquivos {
  async gravarECompartilhar(
    nomeArquivo: string,
    conteudo: string,
    mimeType = 'application/json',
  ): Promise<void> {
    const arquivo = new File(new Directory(Paths.cache), nomeArquivo);
    if (arquivo.exists) {
      arquivo.delete();
    }
    arquivo.create();
    arquivo.write(conteudo);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(arquivo.uri, { mimeType, dialogTitle: nomeArquivo });
    }
  }

  async selecionarArquivo(mimeType = 'application/json'): Promise<ArquivoSelecionado | null> {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: mimeType,
      copyToCacheDirectory: true,
    });
    if (resultado.canceled) {
      return null;
    }
    const [asset] = resultado.assets;
    return { uri: asset.uri, nome: asset.name };
  }

  async lerTexto(uri: string): Promise<string> {
    return new File(uri).text();
  }
}
