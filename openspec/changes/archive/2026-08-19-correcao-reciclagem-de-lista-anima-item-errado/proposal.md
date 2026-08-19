# Correção: linha da Despensa anima com o valor do item anterior ao rolar

**Type:** Correção de Bug

## Why

Usuária de teste relatou duas falhas visuais na Despensa: (1) ao adicionar itens acima de um
campo em edição, aparecem "duas barras verdes" sobrepostas por um instante; (2) ao rolar a
lista, itens no estado crítico/em falta (vermelho/amarelo) mostram a linha d'água e o texto se
sobrepondo ou "cortando", dando a impressão de que o app quebrou.

Causa raiz única, confirmada no código e documentada pela própria biblioteca de lista: a
`FlashList` (`app/(tabs)/index.tsx:237`) recicla views ao rolar — a mesma instância de
`ItemDespensa`/`MedidorNivel` é reaproveitada para um item diferente, sem desmontar. Mas
`MedidorNivel` (`medidor-nivel.tsx:37-41`) guarda a altura da linha d'água num
`useSharedValue(fracao)` que só é atualizado por um `useEffect` disparado por
`[fracao, animar, nivel]` — **sem nenhuma chave pelo id do item**. Quando a view é reciclada
para um item com `fracao` diferente, esse `useEffect` dispara a mesma mola
(`molar(fracao)`, `movimento.ts`) usada para o gesto de consumir — animando visivelmente da
altura do item antigo até a do novo, em vez de aparecer já no valor certo.

A própria documentação oficial do `@shopify/flash-list` (guia "React Native Reanimated",
`shopify.github.io/flash-list/docs/guides/reanimated`) descreve exatamente este cenário e
prescreve a correção: resetar o `useSharedValue` num `useEffect` chaveado pelo **id do item**,
ou usar o hook `useRecyclingState` que a própria lib exporta para esse fim — nenhuma das duas
coisas é feita hoje. Agravante: `animar` (pensado para suprimir animação na primeira pintura,
`item-despensa.tsx:29`) nunca é passado em `app/(tabs)/index.tsx:256` — fica sempre `true`, e
toda reciclagem anima.

## What Changes

- `MedidorNivel` passa a resetar o valor compartilhado quando o item por trás da célula
  reciclada muda, seguindo o padrão oficial do `@shopify/flash-list` — sem mola perceptível
  nessa troca, só na mudança real de quantidade do mesmo item.
- `ItemDespensa`/`MedidorNivel` ganham a informação de identidade do item (id do produto) para
  poder distinguir "mesmo item, quantidade mudou" (anima) de "célula reciclada para outro item"
  (não anima).
- `app/(tabs)/index.tsx` passa a repassar essa identidade ao renderizar cada linha.

## Capabilities

### Modified Capabilities

- `medidor-linha-dagua`: o requisito de animação da linha d'água passa a exigir que a
  animação ocorra apenas quando a fração muda para o **mesmo** item, nunca quando a célula é
  reciclada para um item diferente durante a rolagem.

## Impact

- **Código**: `src/presentation/components/medidor-nivel.tsx`,
  `src/presentation/components/item-despensa.tsx`, `app/(tabs)/index.tsx` (passagem do id na
  chamada de `ItemDespensa` dentro do `renderItem` da `FlashList`).
- **Dependências**: nenhuma nova — a correção usa API que `@shopify/flash-list` 2.0.2 (já
  instalada) já exporta (`useRecyclingState` ou padrão equivalente com `useEffect` chaveado por
  id), conforme a documentação oficial da lib.
- **Camadas**: só `presentation/`.
- **KPI**: não afeta K4 diretamente, mas atinge a percepção de confiabilidade do app inteiro —
  é o feedback textual de uma usuária de teste real ("dá sensação que quebrou algo do app").

### Dependências entre changes

Sobreposição de arquivo com `correcao-affordance-busca-e-lista` (Ordem 6): ambas tocam
`app/(tabs)/index.tsx`, em regiões diferentes (a 6 mexe no cabeçalho de busca/chips/estado
vazio; esta mexe no `renderItem` da `FlashList` mais abaixo no arquivo). Sequenciada depois da
6 para evitar edição paralela do mesmo arquivo. Sem sobreposição com as demais changes ativas.
