## Context

Três defeitos que só aparecem quando se olha por onde a informação sai, e não por onde ela é
escrita.

O A-15 foi descoberto por acidente durante a auditoria: um seletor Maestro escrito a partir do
`accessibilityLabel` do código falhou repetidamente. A investigação mostrou que o rótulo não
existe na árvore do Android. O código de `item-compra.tsx:61-64` está aparentemente correto —
`accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`, `accessibilityLabel` — mas
está num `View` filho de um `Pressable` sem rótulo próprio, e o React Native colapsa essa
subárvore, sintetizando o nome a partir dos textos.

O resultado é perverso: o `<Texto>✓</Texto>` de `:87`, que é decoração, é o único fragmento do
estado que sobrevive — vira `"✓, <nome>, <qtd>, <preço>"`. O estado real (`checked`) e o papel
(`checkbox`) somem.

O A-11 é o mesmo tipo de erro em outro eixo: `tipografia.ts:71-78` define `caption` como
micro-rótulo (11pt, +4% de tracking, `uppercase`) — corretamente. O defeito é o consumidor,
`configuracoes.tsx`, passando frases completas por esse papel, inclusive o aviso de que
restaurar backup não pode ser desfeito.

O A-12 é o mais simples: dois nós "Despensa" na mesma tela. Foi o que fez `tapOn: "Despensa"`
acertar o rótulo de seção em vez da aba durante a auditoria.

## Goals / Non-Goals

**Goals:**

- Papel, rótulo e estado do controle de marcação presentes na árvore de acessibilidade.
- Prosa em papel de corpo; micro-rótulo só para etiqueta curta.
- Nenhum nome acessível ambíguo na tela de Configurações.
- Fechar a lacuna de spec que permitiu os três: nada exigia verificar a árvore, nem exigia
  compatibilidade entre papel tipográfico e tipo de conteúdo.

**Non-Goals:**

- Mexer em `tipografia.ts`. O token `caption` está certo; o consumidor é que está errado.
  Mudar o token quebraria os micro-rótulos legítimos.
- Auditoria de acessibilidade do app inteiro. O escopo são os três achados medidos, mais a
  varredura de `accessibilityLabel` em nó interno que a correção de spec torna obrigatória
  (grupo 1) — isso é fechar a causa, não expandir escopo.
- Mudar a aparência visual do item de compra. Tachado, tom secundário e visto continuam como
  estão — eles funcionam para quem enxerga. O que muda é o que sai pela árvore.
- Renomear a aba "Despensa". Ver decisão 3.

## Decisions

### 1. Os atributos sobem para o `Pressable`; o visto desce para decorativo

`item-compra.tsx`: `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}` e o
rótulo passam para o `Pressable` de `:49-59`, que é quem recebe o toque. O `View` de `:61-70`
perde os atributos e fica só como caixa visual, e o `<Texto>✓</Texto>` de `:85-89` é marcado
como irrelevante para acessibilidade, para não vazar para o nome.

Isto é a correção na raiz: o atributo passa a viver no elemento que o RN **não** colapsa,
porque é o próprio tocável.

Alternativa descartada: `accessible={true}` no `View` interno para forçá-lo a virar nó próprio.
Cria dois nós tocáveis aninhados para um único toque, e o leitor de tela passa a anunciar a
linha duas vezes.

Alternativa descartada: manter o `✓` no nome como está, já que "funciona". Funciona por
acidente, depende de um glifo decorativo e não sobrevive à primeira pessoa que trocar o visto
por um ícone SVG.

Consequência colateral aceita: o nome acessível da linha muda de forma. Os dois flows Maestro
já foram ajustados para os rótulos reais durante a auditoria e vão precisar de ajuste de novo
quando esta change entrar — está nas tasks.

### 2. `caption` → papel de corpo nos três textos de Configurações

`configuracoes.tsx:104`, `:116` e `:129` passam a usar papel de corpo. Nenhuma outra mudança:
mesmo texto, mesma posição, mesma cor de tom secundário.

O `:116` (aviso de que restaurar não pode ser desfeito) é o que motiva o requisito novo em
`tela-de-configuracoes`: a informação que a pessoa precisa ler antes de decidir não pode ser a
mais difícil de ler da tela.

### 3. O rótulo de seção é que muda, não a aba

Entre "Despensa" (seção de Configurações) e "Despensa" (aba), quem cede é a seção. A aba é um
destino fixo do app, presente em toda tela, e nomeada no vocabulário do produto — renomeá-la
teria alcance muito maior que o defeito.

A seção agrupa "Conferência da despensa"; um nome que descreva a seção sem colidir resolve.
O nome exato é decisão de conteúdo e segue o vocabulário de `FRONTEND-DESIGN` §11 — fica como
questão em aberto.

### 4. A verificação é sobre a árvore, e vira regra

Todos os critérios de aceite de acessibilidade desta change são medidos por
`inspect_screen`/`uiautomator`, nunca por leitura de código. Essa é a lição do A-15 e já virou
regra de trabalho registrada; o requisito novo em `componentes-base` a torna verificável.

### 5. A varredura do grupo 1 é parte da correção, não escopo extra

Se `accessibilityLabel` num nó interno colapsado aconteceu uma vez, o padrão pode estar
repetido. `grep` por `accessibilityLabel`/`accessibilityRole` em `View` dentro de tocável, e
conferência na árvore. Sem isso, corrigimos uma instância e deixamos a causa de pé — que é
exatamente o erro que `correcao-teclado-em-sheets` está tendo que reparar.

## Risks / Trade-offs

- **[Mudar o nome acessível da linha de compra quebra os seletores dos flows Maestro]** →
  Certeza, não risco. Os dois `.yaml` usam hoje `"<nome>, <qtd>, <preço>"` e
  `"✓, <nome>, <qtd>, <preço>"`. Atualizar os seletores faz parte da change, e o novo rótulo
  precisa ser confirmado na árvore antes de ser escrito — o erro que originou o achado.

- **[Toca `item-compra.tsx`, também alvo de `correcao-agrupamento-modo-compra` (Ordem 7)]** →
  Linhas diferentes (atributos da linha vs. composição da lista), mas mesmo arquivo e mesmo
  flow de regressão. Por isso esta vem depois da 7 no `ORDER.md`.

- **[Trocar `caption` por papel de corpo aumenta a altura dos três textos em Configurações]** →
  Corpo tem altura de linha maior que 11pt, e as frases deixam de ser caixa alta (que é mais
  larga). O layout da tela precisa ser reconferido nos dois temas.

- **[Renomear o rótulo de seção muda vocabulário visível]** → Segue `FRONTEND-DESIGN` §11 e é
  uma palavra numa tela secundária. Menor custo possível entre as opções.

## Migration Plan

Sem migração de dados nem de schema. Só `presentation/` e `app/`.

## Open Questions

- Qual o novo nome do rótulo de seção "Despensa" em Configurações? Precisa descrever o grupo
  que contém "Conferência da despensa" sem colidir com a aba, dentro do vocabulário de
  `FRONTEND-DESIGN` §11. Decidir antes de implementar; se exigir discussão de conteúdo, volta
  como `/opsx:update`.
