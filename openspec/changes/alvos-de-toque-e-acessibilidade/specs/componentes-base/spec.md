## MODIFIED Requirements

### Requirement: Botão com alvo de toque mínimo

O sistema SHALL fornecer um componente de botão cuja área tocável tem no mínimo 48 por 48 pontos independentes, e que expressa os estados normal, pressionado e desabilitado. O mínimo de 48×48dp SHALL valer para **qualquer** elemento tocável interativo da interface — inclusive botões de cabeçalho, seletores e ações secundárias implementados diretamente com `Pressable`, não apenas instâncias do componente `Botao`.

#### Scenario: Alvo mínimo respeitado

- **WHEN** um botão visualmente menor que 48 pontos é renderizado
- **THEN** sua área tocável ainda mede no mínimo 48 por 48

#### Scenario: Estado desabilitado é perceptível sem cor

- **WHEN** o botão está desabilitado
- **THEN** ele é anunciado como desabilitado ao leitor de tela, além da mudança visual

#### Scenario: Alvo mínimo vale para `Pressable` fora do componente `Botao`

- **WHEN** um elemento tocável é implementado diretamente com `Pressable` (por exemplo, um botão de cabeçalho ou um seletor de opção), sem usar o componente `Botao`
- **THEN** sua área tocável, incluindo `hitSlop` quando aplicável, ainda mede no mínimo 48 por 48 pontos independentes
