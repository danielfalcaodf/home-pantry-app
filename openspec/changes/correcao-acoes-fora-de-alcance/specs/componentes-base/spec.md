## MODIFIED Requirements

### Requirement: Botão com alvo de toque mínimo

O sistema SHALL fornecer um componente de botão cuja área tocável tem no mínimo 48 por 48 pontos independentes, e que expressa os estados normal, pressionado e desabilitado. O mínimo de 48×48dp SHALL valer para **qualquer** elemento tocável interativo da interface — inclusive botões de cabeçalho, seletores e ações secundárias implementados diretamente com `Pressable`, não apenas instâncias do componente `Botao`.

O mínimo SHALL valer também para elementos tocáveis que não são `Botao` nem `Pressable` — em particular, texto com `onPress`. Um `<Texto onPress>` é um elemento interativo e SHALL, portanto, declarar papel acessível de botão e garantir o alvo mínimo, ou ser substituído por um componente que já o faça. Padding aplicado a um contêiner externo NÃO conta: o alvo é a área do próprio elemento tocável.

#### Scenario: Alvo mínimo respeitado

- **WHEN** um botão visualmente menor que 48 pontos é renderizado
- **THEN** sua área tocável ainda mede no mínimo 48 por 48

#### Scenario: Estado desabilitado é perceptível sem cor

- **WHEN** o botão está desabilitado
- **THEN** ele é anunciado como desabilitado ao leitor de tela, além da mudança visual

#### Scenario: Alvo mínimo vale para `Pressable` fora do componente `Botao`

- **WHEN** um elemento tocável é implementado diretamente com `Pressable` (por exemplo, um botão de cabeçalho ou um seletor de opção), sem usar o componente `Botao`
- **THEN** sua área tocável, incluindo `hitSlop` quando aplicável, ainda mede no mínimo 48 por 48 pontos independentes

#### Scenario: Alvo mínimo vale para texto com `onPress`

- **WHEN** uma ação é implementada como texto clicável (`<Texto onPress>`), sem `Botao` e sem `Pressable`
- **THEN** ela declara `accessibilityRole="button"` e sua área tocável mede no mínimo 48 por 48 pontos independentes

#### Scenario: Padding do contêiner externo não conta como alvo

- **WHEN** um elemento tocável está dentro de uma `View` com padding, mas o próprio elemento tem altura menor que 48 pontos
- **THEN** o alvo é considerado insuficiente, porque a área tocável é a do elemento e não a do contêiner
