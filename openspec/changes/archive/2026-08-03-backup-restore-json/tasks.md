## 1. Formato do backup

- [x] 1.1 Criar `src/domain/backup/backup.schema.ts` definindo a forma do arquivo com versão de schema, data de exportação e as coleções de casa, usuários, produtos, movimentos, compras e itens de compra
- [x] 1.2 Implementar a validação da estrutura retornando `Result`, sem depender de sistema de arquivos
- [x] 1.3 Implementar a verificação de versão: recusar versão mais nova que a do app, aceitar versões anteriores
- [x] 1.4 Criar a função de conversão de versões anteriores para o formato corrente, com uma entrada por versão publicada
- [x] 1.5 Escrever testes de validação cobrindo arquivo válido, arquivo malformado, arquivo sem versão e arquivo de versão mais nova
- [x] 1.6 Decidir e registrar se a versão do backup acompanha a numeração das migrations

## 2. Exportação

- [x] 2.1 Criar `src/infrastructure/backup/exportar.ts` reunindo todos os registros da casa pelos repositórios — implementado como `SQLiteBackupRepository.montar()` (`src/infrastructure/repositories/sqlite-backup.repository.ts`) atrás do port `BackupRepository`, mesmo padrão Ports & Adapters dos demais repositórios, em vez de uma função solta
- [x] 2.2 Incluir produtos removidos logicamente, com sua marcação de remoção
- [x] 2.3 Incluir todo o histórico de movimentos, sem truncamento por data
- [x] 2.4 Incluir compras finalizadas, canceladas e a compra aberta, com seus itens
- [x] 2.5 Gravar quantidades e valores como inteiros em unidades internas, sem conversão para exibição
- [x] 2.6 Criar `use-exportar-backup.ts` gerando o arquivo com nome contendo a data
- [x] 2.7 Ligar a exportação à folha de compartilhamento do sistema
- [x] 2.8 Registrar a data do último backup na tabela de configuração
- [x] 2.9 Escrever teste do conteúdo exportado, confirmando que nenhuma coleção é omitida
- [x] 2.10 Verificar que a exportação funciona com o aparelho sem conexão — nenhum passo do caminho de exportação faz chamada de rede (leitura é só SQLite local; gravação e compartilhamento são operações de arquivo do aparelho), garantia por construção — mesma linha das changes 6-8

## 3. Restauração

- [x] 3.1 Criar `use-restaurar-backup.ts` com seleção de arquivo pelo seletor do sistema
- [x] 3.2 Validar a estrutura e a versão **antes** de qualquer escrita no banco
- [x] 3.3 Apresentar a confirmação com a data do backup e a contagem de registros a restaurar
- [x] 3.4 Implementar a aplicação em transação única, combinando por identificador com atualização dos existentes e inserção dos ausentes
- [x] 3.5 Garantir que a operação é idempotente, sem duplicar registros nem movimentos ao restaurar o mesmo arquivo duas vezes
- [x] 3.6 Implementar a mensagem de recusa de backup de versão mais nova, com o texto definido no documento de frontend
- [x] 3.7 Implementar a mensagem de falha preservando o banco intacto e oferecendo tentar novamente
- [x] 3.8 Garantir que cancelar na confirmação não realiza nenhuma escrita
- [x] 3.9 Escrever teste de restauração completa bem-sucedida
- [x] 3.10 Escrever teste de falha injetada no meio, confirmando que o banco permanece como estava
- [x] 3.11 Escrever teste de idempotência restaurando o mesmo backup duas vezes
- [x] 3.12 Escrever teste de combinação, restaurando um backup em um banco que já tem dados criados depois dele
- [x] 3.13 Verificar que a restauração funciona com o aparelho sem conexão — nenhum passo faz chamada de rede (leitura de arquivo local + escrita no SQLite local), garantia por construção

## 4. Reconciliação

- [x] 4.1 Executar a consulta de reconciliação automaticamente ao final de toda restauração bem-sucedida — `use-restaurar-backup.ts`, ao final de `confirmar()`
- [x] 4.2 Exibir os produtos divergentes quando houver, com o valor materializado e o calculado
- [x] 4.3 Oferecer a correção pela soma dos movimentos, gravando um movimento de ajuste — `MovimentoRepository.corrigirDivergencia` + `useDiagnostico.corrigir`
- [x] 4.4 Garantir que nenhuma quantidade é alterada em silêncio — toda correção passa por `corrigirDivergencia`, que grava o movimento de ajuste (`motivo: 'reconciliacao'`) na mesma transação
- [x] 4.5 Expor a reconciliação como ação de diagnóstico nas configurações
- [x] 4.6 Escrever teste confirmando zero divergências após restaurar um backup íntegro
- [x] 4.7 Escrever teste com backup adulterado, confirmando que a divergência é detectada e informada

## 5. Exportação tabular

- [x] 5.1 Implementar a geração do arquivo separado por vírgulas com os produtos
- [x] 5.2 Converter quantidades e valores para leitura humana no arquivo tabular
- [x] 5.3 Rotular a ação explicitamente como exportação de dados, distinta e não restaurável
- [x] 5.4 Ligar à folha de compartilhamento do sistema

## 6. Tela de configurações

- [x] 6.1 Criar `app/configuracoes.tsx` alcançável a partir de uma tela principal, sem navegação profunda — link a partir da aba Resumo
- [x] 6.2 Mover a escolha de tema para esta tela, com as três opções e persistência — nenhuma change anterior tinha construído a UI de escolha (só a persistência, na `design-system-tema`); `ThemeProvider` ganhou `escolher`/`useEscolherTema` para uma única instância do hook viver no layout raiz e a tela de configurações trocar a preferência sem duplicar estado
- [x] 6.3 Agrupar exportar backup, restaurar backup e exportar dados
- [x] 6.4 Distinguir visualmente a restauração como ação destrutiva, descrevendo seu efeito
- [x] 6.5 Executar a exportação diretamente, sem confirmação
- [x] 6.6 Exibir a data do último backup, ou o convite a fazer o primeiro quando nunca houve
- [x] 6.7 Adicionar a ação de diagnóstico que roda a reconciliação sob demanda

## 7. Conformidade

- [x] 7.1 Executar lint, typecheck e verificação de fronteiras — `npm run verificar` verde
- [x] 7.2 Confirmar que `src/domain/backup/` não importa nada de sistema de arquivos nem do Expo — `grep -rE "from ['\"](expo|react|drizzle|@react)" src/domain/` sem resultado (regra também aplicada pelo lint)
- [x] 7.3 Confirmar que nenhum literal de cor foi introduzido fora dos tokens — `no-restricted-syntax` do eslint.config.js cobre `app/` e `src/`, verde
- [ ] 7.4 Testar o ciclo completo em aparelho real: exportar, desinstalar o app, reinstalar, restaurar, e conferir que despensa e histórico voltaram — exige aparelho físico (mesma razão das changes 5-8: sem emulador Android/iOS neste ambiente); a transação de restauração e a idempotência estão cobertas por teste de infraestrutura (SQLite real, `sqlite-backup.repository.test.ts`)
- [x] 7.5 Registrar no guia do repositório que gerar um backup JSON antes de atualizar o app é o único mecanismo que sobrevive a mudanças de schema — `CLAUDE.md`, seção de migrations
