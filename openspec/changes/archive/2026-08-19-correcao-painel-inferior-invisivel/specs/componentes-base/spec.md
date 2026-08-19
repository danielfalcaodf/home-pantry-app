## ADDED Requirements

### Requirement: Painel inferior só intercepta toque quando visível

O `PainelInferior` (bottom sheet compartilhado) SHALL só aceitar toque de fechamento no backdrop
depois que o conteúdo do painel foi efetivamente pintado na tela. Enquanto o painel estiver
montado mas ainda não visivelmente renderizado, o backdrop NÃO SHALL interceptar toque.

#### Scenario: Toque durante a janela de montagem não fecha um painel que o usuário nunca viu

- **WHEN** o `PainelInferior` acabou de montar e o conteúdo ainda não foi pintado na Surface
- **THEN** um toque na área do backdrop não dispara o fechamento do painel

#### Scenario: Abrir e fechar o mesmo painel repetidamente não deixa painel fantasma

- **WHEN** o usuário abre e fecha o mesmo sheet em sequência rápida (pelo menos 10 vezes)
- **THEN** nenhuma abertura resulta em um painel invisível que bloqueia toque na tela por trás
