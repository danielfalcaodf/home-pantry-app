## MODIFIED Requirements

### Requirement: Campo de texto com rótulo persistente

O componente de campo SHALL exibir o rótulo **sempre acima** do campo. Texto de exemplo NÃO deve ser usado como rótulo. Quando o campo recebe um `tipo` de valor (`quantidade` ou `dinheiro`), ele SHALL formatar o texto digitado nesse formato em tempo real e SHALL exibir um placeholder padrão descrevendo o formato esperado quando nenhum outro placeholder for passado explicitamente. Toda rejeição de entrada inválida SHALL ser comunicada por mensagem de erro em texto — o campo NUNCA deve substituir silenciosamente o valor digitado por um valor padrão.

#### Scenario: Rótulo permanece durante a digitação

- **WHEN** o usuário digita no campo
- **THEN** o rótulo continua visível acima

#### Scenario: Foco é indicado

- **WHEN** o campo recebe foco
- **THEN** seu divisor inferior passa a 2 pontos na cor de ação

#### Scenario: Erro é descrito em texto

- **WHEN** o campo está em erro
- **THEN** a mensagem de erro é exibida em texto, e não apenas por cor

#### Scenario: Máscara de quantidade formata em tempo real

- **WHEN** o campo tem `tipo="quantidade"` e o usuário digita
- **THEN** o valor exibido segue o formato decimal com vírgula usado no domínio (`formatarNumero`), sem alterar o valor em milésimos gravado ao salvar

#### Scenario: Máscara de dinheiro formata em tempo real

- **WHEN** o campo tem `tipo="dinheiro"` e o usuário digita
- **THEN** o valor exibido segue o formato de reais com vírgula (reaproveitando `formatarBRL`/`deTextoDigitado` do domínio), sem alterar o valor em centavos gravado ao salvar

#### Scenario: Placeholder padrão por tipo

- **WHEN** um campo com `tipo="quantidade"` ou `tipo="dinheiro"` não recebe placeholder explícito
- **THEN** ele exibe um placeholder padrão descrevendo o formato esperado (ex.: "0,000" para quantidade, "0,00" para dinheiro)

#### Scenario: Entrada inválida nunca é substituída em silêncio

- **WHEN** o usuário digita um valor que não pode ser interpretado como número no campo e tenta salvar
- **THEN** o campo exibe erro em texto e o valor gravado permanece o que o usuário digitou (ou a operação é bloqueada), nunca um valor padrão diferente do digitado

### Requirement: Botão com alvo de toque mínimo

O sistema SHALL fornecer um componente de botão cuja área tocável tem no mínimo 48 por 48 pontos independentes, e que expressa os estados normal, pressionado e desabilitado. O mínimo de 48×48dp SHALL valer para **qualquer** elemento tocável interativo da interface — inclusive botões de cabeçalho, seletores e ações secundárias implementados diretamente com `Pressable`, não apenas instâncias do componente `Botao`. Controles com estado expansível/colapsável (como "Mais opções") SHALL expor um indicador visual do seu estado, além do texto do rótulo. Painéis modais que abrem sobre o conteúdo (sheets) SHALL expor um controle de fechar visível, além do fechamento por toque fora ou pelo botão físico/gesto de voltar.

#### Scenario: Alvo mínimo respeitado

- **WHEN** um botão visualmente menor que 48 pontos é renderizado
- **THEN** sua área tocável ainda mede no mínimo 48 por 48

#### Scenario: Estado desabilitado é perceptível sem cor

- **WHEN** o botão está desabilitado
- **THEN** ele é anunciado como desabilitado ao leitor de tela, além da mudança visual

#### Scenario: Alvo mínimo vale para `Pressable` fora do componente `Botao`

- **WHEN** um elemento tocável é implementado diretamente com `Pressable` (por exemplo, um botão de cabeçalho ou um seletor de opção), sem usar o componente `Botao`
- **THEN** sua área tocável, incluindo `hitSlop` quando aplicável, ainda mede no mínimo 48 por 48 pontos independentes

#### Scenario: Controle expansível mostra seu estado visualmente

- **WHEN** um controle como "Mais opções"/"Menos opções" é renderizado
- **THEN** ele exibe um indicador visual (ex.: chevron) que muda de orientação conforme o estado expandido ou colapsado

#### Scenario: Sheet modal tem controle de fechar visível

- **WHEN** um painel modal (sheet) é aberto sobre o conteúdo
- **THEN** um controle de fechar (ícone ou texto) está visível dentro do próprio painel, além de continuar aceitando toque fora e voltar

## ADDED Requirements

### Requirement: Campo em foco nunca fica coberto pelo teclado

Toda tela ou painel modal com campos de texto SHALL manter o campo em foco e o botão de ação principal visíveis quando o teclado do sistema está aberto.

#### Scenario: Campo em foco permanece visível

- **WHEN** o teclado do sistema abre sobre um campo em foco, em qualquer tela ou sheet com `TextInput`
- **THEN** o campo em foco não fica coberto pelo teclado

#### Scenario: Botão de ação permanece acessível com o teclado aberto

- **WHEN** o teclado do sistema está aberto em uma tela ou sheet que tem um botão de ação principal (salvar, adicionar, corrigir)
- **THEN** esse botão continua alcançável sem precisar fechar o teclado primeiro
