# apagar-todos-os-dados

## Purpose

Permitir que o usuário zere completamente os dados locais do app (produtos, compras, itens de
compra, movimentos de estoque) a partir da tela de Configurações, sem precisar desinstalar o
app, mantendo o app funcional imediatamente após o reset.

## ADDED Requirements

### Requirement: Reset completo do banco local em transação única

O sistema SHALL apagar, em uma única transação atômica, todos os produtos, compras, itens de
compra e movimentos de estoque da casa do usuário, preservando ou recriando a `casa`/`usuario`
local necessária para o app continuar funcional.

#### Scenario: Reset apaga todos os dados de estoque

- **WHEN** o usuário confirma o reset
- **THEN** nenhum produto, compra, item de compra ou movimento de estoque permanece no banco

#### Scenario: App continua funcional após o reset

- **WHEN** o reset é concluído
- **THEN** a `casa`/`usuario` local existe e o app pode cadastrar produtos normalmente, sem
  reiniciar

#### Scenario: Falha no meio do reset não deixa estado parcial

- **WHEN** ocorre uma falha durante a operação de reset
- **THEN** nenhuma tabela é alterada — a transação inteira é revertida

### Requirement: Reset é ação destrutiva com confirmação obrigatória

O reset SHALL exigir confirmação explícita do usuário antes de executar, por ser uma ação
irreversível.

#### Scenario: Cancelar a confirmação não apaga nada

- **WHEN** o usuário aciona o reset mas cancela a confirmação
- **THEN** nenhum dado é alterado
