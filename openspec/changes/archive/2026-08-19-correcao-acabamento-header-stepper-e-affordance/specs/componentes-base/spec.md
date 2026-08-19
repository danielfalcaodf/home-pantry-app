## MODIFIED Requirements

### Requirement: Botão com alvo de toque mínimo

O sistema SHALL fornecer um componente de botão cuja área tocável tem no mínimo 48 por 48 pontos independentes, e que expressa os estados normal, pressionado e desabilitado. O mínimo de 48×48dp SHALL valer para **qualquer** elemento tocável interativo da interface — inclusive botões de cabeçalho, seletores e ações secundárias implementados diretamente com `Pressable`, não apenas instâncias do componente `Botao`.

Dois botões que representam ações pareadas e igualmente frequentes (como consumir e repor um item) SHALL ter peso visual equivalente — mesmo nível de preenchimento, contraste e destaque. Nenhum dos dois SHALL depender apenas de contorno fino sobre cor secundária quando o par usa preenchimento sólido.

Um rótulo de botão renderizado dentro de um grupo de largura igual (`flex` compartilhado) SHALL permanecer legível e alinhado com os demais botões do grupo quando o tamanho de fonte do sistema é ampliado — sem quebrar o alinhamento vertical do grupo nem cortar o texto sem indicação.

#### Scenario: Alvo mínimo respeitado

- **WHEN** um botão visualmente menor que 48 pontos é renderizado
- **THEN** sua área tocável ainda mede no mínimo 48 por 48

#### Scenario: Estado desabilitado é perceptível sem cor

- **WHEN** o botão está desabilitado
- **THEN** ele é anunciado como desabilitado ao leitor de tela, além da mudança visual

#### Scenario: Alvo mínimo vale para `Pressable` fora do componente `Botao`

- **WHEN** um elemento tocável é implementado diretamente com `Pressable` (por exemplo, um botão de cabeçalho ou um seletor de opção), sem usar o componente `Botao`
- **THEN** sua área tocável, incluindo `hitSlop` quando aplicável, ainda mede no mínimo 48 por 48 pontos independentes

#### Scenario: Par de ações pareadas tem peso visual equivalente

- **WHEN** os botões de consumir ("−") e repor ("+") de um item são renderizados lado a lado
- **THEN** os dois têm o mesmo nível de preenchimento e contraste — nenhum aparece como simples contorno enquanto o outro é um círculo preenchido

#### Scenario: Rótulo longo com fonte ampliada não desalinha o grupo

- **WHEN** um grupo de botões de largura igual é renderizado com o tamanho de fonte do sistema ampliado e um dos rótulos é significativamente mais longo que os demais
- **THEN** o texto permanece legível e o botão continua alinhado com os demais do grupo, sem quebra de layout perceptível
