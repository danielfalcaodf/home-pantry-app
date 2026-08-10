## MODIFIED Requirements

### Requirement: Tela única sem navegação interna

O modo compra SHALL ser uma tela única. Navegação para subtelas durante a compra NÃO deve existir.

#### Scenario: Sem subtelas

- **WHEN** o usuário está no modo compra e marca itens
- **THEN** nenhuma navegação para outra tela ocorre

#### Scenario: Ajuste sem sair da tela

- **WHEN** o usuário ajusta a quantidade comprada ou o preço pago de um item
- **THEN** o ajuste acontece na própria tela ou em painel sobreposto, sem trocar de rota

#### Scenario: Sair exige intenção com itens marcados

- **WHEN** o usuário aciona o botão de voltar durante uma compra com pelo menos um item marcado
- **THEN** uma confirmação pergunta se ele quer sair, informando que a compra continua aberta e o progresso é preservado, e a navegação só ocorre se ele confirmar

#### Scenario: Voltar sem itens marcados não pede confirmação

- **WHEN** o usuário aciona o botão de voltar durante uma compra sem nenhum item marcado
- **THEN** o app volta para a tela anterior direto, sem exibir confirmação

#### Scenario: Cancelar a confirmação preserva o progresso

- **WHEN** o usuário aciona voltar com itens marcados e opta por não sair na confirmação
- **THEN** ele permanece no modo compra e nenhuma marcação é perdida
