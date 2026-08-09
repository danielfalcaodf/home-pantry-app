/**
 * Reatividade sem vazar Drizzle nem SQLite para `application/`: os hooks
 * assinam a mudança e reconsultam pelo repositório. A implementação usa o
 * change listener do expo-sqlite; nos testes, um disparador em memória.
 */
export interface ObservadorDeMudancas {
  assinar(ouvinte: () => void): () => void;
}
