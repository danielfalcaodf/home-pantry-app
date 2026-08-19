## Context

`correcao-usabilidade-campos-e-botoes` (Ordem 1) padronizou affordance e estado na base de
componentes: `CampoTexto`, `Botao`, chevron de expansão, erro em texto. O `Impact` daquela
change não incluía `app/(tabs)/index.tsx` nem o cabeçalho de `app/(tabs)/lista.tsx`, e é
exatamente ali que sobraram os quatro achados desta.

O projeto já tem o padrão certo para o caso mais grave. `ChipEstado` expressa estado por
borda + cor + contagem + `accessibilityState` — quatro canais. O toggle "Agrupar"
(`lista.tsx:141-152`) tem um só, e ele é invisível: `accessibilityState={{ selected }}` num
`Pressable` cujo `Texto` renderiza igual nos dois estados. Os dois screenshots da auditoria
(`qa/audit-05-lista-agrupada` e `qa/audit-05-lista-sem-agrupar`) são a evidência — foram
tirados justamente para provar que são indistinguíveis.

Os outros três são menores e independentes entre si, mas moram nas mesmas duas telas e
compartilham a natureza: o que a tela mostra e o que os controles dizem não batem.

## Goals / Non-Goals

**Goals:**

- Estado do agrupamento visível sem leitor de tela, pelos canais redundantes que o design
  system já usa em outros controles.
- Contagem dos chips coerente com o que a lista mostra.
- Estado vazio da busca legível com o teclado aberto, sem folga que encolhe.
- Campo de busca sem corretor ortográfico.

**Non-Goals:**

- Redesenhar o cabeçalho da Lista ou a barra de chips. A correção do A-05 é de estado, não de
  layout — a reorganização do cabeçalho é `correcao-acoes-fora-de-alcance` (Ordem 5).
- Introduzir um componente de switch. Ver decisão 1.
- Mudar a semântica do filtro `Faltando` (`critico + emFalta`), que é composto por design e já
  está documentado em `agrupar-despensa.ts:57-74`. Foi verificado como conforme na auditoria.
- Tratar o teclado dentro de `<Modal>` — é `correcao-teclado-em-sheets` (Ordem 4). A busca não
  é Modal; o problema dela é centralização, não isolamento de janela.

## Decisions

### 1. O toggle "Agrupar" ganha os canais do `ChipEstado`, não vira um switch novo

`ChipEstado` já resolve "controle com estado" neste app, e é o vocabulário visual que a pessoa
já leu na barra de filtros da mesma tela anterior. Reaproveitar os canais dele — mudança de
cor de fundo/borda mais o `selected` que já existe — resolve o A-05 e resolve de quebra a
confusão com "Compartilhar": a ação sem estado continua sendo texto azulejo, o interruptor
passa a ter contorno.

Alternativa descartada: um componente `Switch`. Não existe no design system, e a direção
"linha d'água" não tem esse elemento. Introduzir um só para este controle é inventar
vocabulário para um problema que o vocabulário existente cobre.

Alternativa descartada: inverter o rótulo ("Agrupar" ↔ "Desagrupar"). Rótulo que inverte é
canal legítimo, mas sozinho é ambíguo — a pessoa não sabe se o rótulo descreve o estado atual
ou a ação que o toque vai executar. Pode entrar **junto** dos canais visuais, nunca no lugar
deles.

### 2. A contagem dos chips passa a ser função do conjunto exibido

Hoje a contagem é calculada sobre a despensa inteira. Passa a ser calculada sobre o conjunto
que já sofreu a busca — o mesmo conjunto que alimenta a lista. Isso mantém a única fonte de
verdade e faz a contradição ser impossível por construção, em vez de exigir um caso especial
para "busca sem resultado".

O cálculo vive em `src/presentation/format/agrupar-despensa.ts`, que é formatação de
apresentação, não domínio — a regra de dependência não é tocada.

Alternativa descartada: esconder os chips durante a busca. Remove a contradição escondendo
informação, e tira da pessoa a capacidade de filtrar dentro do resultado da busca.

### 3. O estado vazio da busca desconta o teclado, não é ancorado

A causa é centralização calculada sem descontar a altura do teclado. A correção é a
compensação de teclado que o resto do app já usa fora de Modal (`formulario-produto.tsx:100`),
aplicada à tela de busca.

Note que este é o caso **fácil** do teclado: a tela de busca não é `<Modal>`, então o
`KeyboardProvider` da raiz a alcança e `EvitaTeclado` funciona — comprovado no formulário. Não
depende de `correcao-teclado-em-sheets`.

Alternativa descartada: ancorar o bloco vazio no topo. Resolve a colisão e perde a
centralização, que é intencional no design de estado vazio.

### 4. A-02 é uma propriedade, e é assim que deve ficar

`spellCheck={false}` e `autoCorrect={false}` no campo de busca. Duas props. A decisão que vale
registrar é **onde**: no consumidor de busca, não como padrão do `CampoTexto` — campos de
anotação e de marca são prosa e devem manter o corretor.

### 5. O A-05 se prova por comparação de screenshots

O defeito é "os dois estados são idênticos", então a prova é que deixaram de ser: capturar os
dois estados e verificar que diferem. É o mesmo par de screenshots que a auditoria usou para
demonstrar o defeito, agora como critério de aceite invertido.

## Risks / Trade-offs

- **[Dar contorno ao toggle "Agrupar" adiciona peso visual a um cabeçalho que a Ordem 5 vai
  reorganizar]** → Por isso esta change vem depois da 5. Se a 5 mudar a composição do
  cabeçalho, o contorno se acomoda ao layout final em vez de ser refeito.

- **[Contar sobre o conjunto filtrado muda o número que a pessoa vê nos chips sem busca ativa]**
  → Não deve mudar: sem busca, o conjunto exibido é a despensa inteira e o resultado é
  idêntico. O teste de que a contagem sem busca permanece a mesma é obrigatório, justamente
  para provar isso.

- **[Recalcular contagem a cada tecla digitada numa despensa grande]** → A despensa de teste
  tem 40 itens e o requisito "Desempenho da lista longa" de `tela-despensa` existe. Medir com a
  massa de teste antes de assumir que é irrelevante.

- **[`EvitaTeclado` na tela de busca pode afetar o layout da lista principal, não só o estado
  vazio]** → Aplicar a compensação ao bloco de estado vazio, não à tela toda; a lista com
  resultados rola e não precisa de compensação.

## Migration Plan

Sem migração de dados nem de schema. Só `presentation/` e `app/`.

## Open Questions

- O contorno do toggle deve usar exatamente os tokens do `ChipEstado` ou uma variante mais
  discreta, já que ele convive com texto simples no cabeçalho? A régua é
  `FRONTEND-DESIGN-app-estoque-de-casa.md` §7; se a resposta exigir um token novo, isso volta
  como `/opsx:update` antes do código.
