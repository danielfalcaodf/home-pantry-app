import { ExpoSistemaDeArquivos } from './expo-sistema-de-arquivos';

const mockDelete = jest.fn();
const mockCreate = jest.fn();
const mockWrite = jest.fn();
const mockText = jest.fn();
let mockExists = false;
let mockUri = 'file:///cache/arquivo.json';

const mockFileConstructor = jest.fn();
const mockDirectoryConstructor = jest.fn();

// `Paths` precisa ser um literal inline aqui: valores atribuídos direto
// (fora de uma função) na fábrica do jest.mock são lidos no require, que
// roda ANTES das consts do topo do arquivo — uma const externa chegaria
// undefined nesse ponto, mesmo com o prefixo "mock" liberando a referência.
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(function (this: unknown, ...args: unknown[]) {
    mockFileConstructor(...args);
    Object.defineProperties(this as object, {
      exists: { get: () => mockExists },
      uri: { get: () => mockUri },
    });
    Object.assign(this as object, {
      delete: mockDelete,
      create: mockCreate,
      write: mockWrite,
      text: mockText,
    });
  }),
  Directory: jest.fn().mockImplementation(function (this: unknown, ...args: unknown[]) {
    mockDirectoryConstructor(...args);
  }),
  Paths: { cache: 'file:///cache' },
}));

const mockIsAvailableAsync = jest.fn();
const mockShareAsync = jest.fn();

jest.mock('expo-sharing', () => ({
  isAvailableAsync: (...args: unknown[]) => mockIsAvailableAsync(...args),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

const mockGetDocumentAsync = jest.fn();

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}));

describe('ExpoSistemaDeArquivos', () => {
  let sistema: ExpoSistemaDeArquivos;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExists = false;
    mockUri = 'file:///cache/arquivo.json';
    sistema = new ExpoSistemaDeArquivos();
  });

  describe('gravarECompartilhar', () => {
    it('escreve o conteúdo no arquivo e compartilha com o mimeType correto quando disponível', async () => {
      mockIsAvailableAsync.mockResolvedValue(true);

      await sistema.gravarECompartilhar('backup.json', '{"a":1}', 'application/json');

      expect(mockCreate).toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalledWith('{"a":1}');
      expect(mockShareAsync).toHaveBeenCalledWith('file:///cache/arquivo.json', {
        mimeType: 'application/json',
        dialogTitle: 'backup.json',
      });
    });

    it('apaga um arquivo existente antes de criar um novo', async () => {
      mockExists = true;
      mockIsAvailableAsync.mockResolvedValue(true);

      await sistema.gravarECompartilhar('backup.json', '{"a":1}');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
    });

    it('não chama shareAsync quando o compartilhamento não está disponível', async () => {
      mockIsAvailableAsync.mockResolvedValue(false);

      await sistema.gravarECompartilhar('backup.json', '{"a":1}');

      expect(mockShareAsync).not.toHaveBeenCalled();
    });
  });

  describe('selecionarArquivo', () => {
    it('retorna uri e nome do arquivo selecionado', async () => {
      mockGetDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///cache/escolhido.json', name: 'escolhido.json' }],
      });

      const resultado = await sistema.selecionarArquivo();

      expect(resultado).toEqual({ uri: 'file:///cache/escolhido.json', nome: 'escolhido.json' });
    });

    it('retorna null quando o usuário cancela a seleção', async () => {
      mockGetDocumentAsync.mockResolvedValue({ canceled: true });

      const resultado = await sistema.selecionarArquivo();

      expect(resultado).toBeNull();
    });
  });

  describe('lerTexto', () => {
    it('retorna o conteúdo textual do arquivo no uri informado', async () => {
      mockText.mockResolvedValue('{"conteudo":true}');

      const conteudo = await sistema.lerTexto('file:///cache/arquivo.json');

      expect(conteudo).toBe('{"conteudo":true}');
    });
  });
});
