## Why

Não existe hoje nenhuma forma de zerar o banco local do app — `SQLiteBackupRepository.restaurar`
é merge/upsert, nunca deleta o que já existe. O usuário quer um botão em Configurações para
apagar todos os dados locais (produtos, compras, movimentos), útil para recomeçar do zero ou
testar o app limpo, sem precisar desinstalar/reinstalar.

## What Changes

- Nova função `resetarBanco(db)` (infra) que apaga, em uma única transação, todo o conteúdo das
  tabelas de dados (produto, compra, compra_item, movimento_estoque, configuração), preservando
  ou recriando a `casa`/`usuario` local (`garantirCasaEUsuario`) para o app continuar funcional
  imediatamente após o reset.
- Novo caso de uso em `application/` expondo essa operação.
- Novo botão "Apagar todos os dados" na tela de Configurações (seção "Seus dados"), com
  confirmação destrutiva em duas camadas: o padrão inline de confirmação já usado pela
  restauração de backup, e um `Alert.alert` nativo com `style:'destructive'` — confirmado via
  pesquisa de boas práticas (Apple HIG: alerts reservados a ações raras e irreversíveis) como o
  padrão correto para uma ação sem volta.

## Capabilities

### New Capabilities

- `apagar-todos-os-dados`: capability de reset completo do banco local — a operação de wipe em
  si (transação, ordem de FK, recriação de `casa`/`usuario`).

### Modified Capabilities

- `tela-de-configuracoes`: requisito "Ações destrutivas sinalizadas" ganha o novo botão de
  apagar todos os dados como cenário adicional.

## Impact

- Novo módulo em `src/infrastructure/db/` (ou `repositories/`) — `resetarBanco`.
- Novo caso de uso em `src/application/`.
- `app/(tabs)/configuracoes.tsx`.
- Testes: TDD estrito (Nova Feature) — Jest infra (transação, ordem de FK, recriação de seed) e
  Jest application (caso de uso, cancelamento pelo usuário).
