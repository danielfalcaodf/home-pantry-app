## 1. Correção do encadeamento pós-restauração (ACHADO-039)

- [x] 1.1 Em `app/(tabs)/configuracoes.tsx`, no toast exibido quando `restauracao.estado.fase === 'concluido'` e `divergencias.length > 0`, adicionar a prop `acao: { titulo: 'Corrigir', onPress: () => router.push('/diagnostico') }`.
- [x] 1.2 Conferir que o toast sem divergências (`divergencias.length === 0`, mensagem "Backup restaurado.") continua sem `acao`.

## 2. Prova do cenário do bug (ACHADO-039)

- [x] 2.1 Teste RNTL: com `restauracao.estado.fase === 'concluido'` e divergências, o toast exibido tem uma ação visível com o rótulo "Corrigir".
- [x] 2.2 Teste RNTL: tocar na ação "Corrigir" do toast de divergência navega para `/diagnostico`.

## 3. Casos de borda do mesmo contexto (ACHADO-039)

- [x] 3.1 Teste RNTL: restauração concluída sem divergências não exibe ação alguma no toast (só a mensagem "Backup restaurado.").
- [x] 3.2 Teste RNTL: restauração com fase `erro` continua exibindo o toast de erro existente, sem a ação de corrigir (a ação só se aplica ao caso de divergência pós-sucesso).

## 4. Teste de composição da tela de Configurações (ACHADO-038)

- [x] 4.1 Criar teste de tela para `app/(tabs)/configuracoes.tsx` (RNTL, hooks de backup/restauração/exportação mockados) cobrindo: as três ações de dados (backup, restaurar, exportar) aparecem agrupadas sob a seção "Seus dados".
- [x] 4.2 Cobrir a distinção visual/textual da ação de restaurar como destrutiva (variante secundária + texto "Substitui os dados existentes... Não pode ser desfeito.").
- [x] 4.3 Cobrir que acionar "Fazer backup agora" e "Exportar meus dados (CSV)" executa direto, sem diálogo de confirmação.
- [x] 4.4 Cobrir a exibição da data do último backup (via `formatarDataDoUltimoBackup`) e o texto de "nunca feito" quando `ultimoBackupEm` é nulo.

## 5. Teste do adaptador real de sistema de arquivos (ACHADO-040)

- [x] 5.1 Criar `src/infrastructure/sistema-de-arquivos/expo-sistema-de-arquivos.test.ts`, mockando `expo-sharing`, `expo-document-picker` e `expo-file-system` (`File`, `Directory`, `Paths`).
- [x] 5.2 Testar `gravarECompartilhar`: cria/escreve o arquivo e chama `Sharing.shareAsync` com `uri` e `mimeType` corretos quando `Sharing.isAvailableAsync()` retorna `true`; não chama `shareAsync` quando retorna `false`.
- [x] 5.3 Testar `selecionarArquivo`: retorna `{ uri, nome }` do asset selecionado; retorna `null` quando `resultado.canceled` é `true`.
- [x] 5.4 Testar `lerTexto`: retorna o conteúdo textual do arquivo no `uri` informado.

## 6. Gate de testes obrigatório

- [x] 6.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) — sem regressões.
- [x] 6.2 Rodar `npm test` completo — todos os testes verdes, incluindo os novos desta change.
