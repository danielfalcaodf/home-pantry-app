# Correção das ações fora de alcance

**Type:** Correção de Bug

## Why

Três ações do app estão fora de alcance de jeitos diferentes, mas pela mesma raiz: foram
escritas como texto clicável no fluxo do conteúdo, em vez de botão numa posição garantida.
Duas delas foram apontadas pelo usuário durante a auditoria — "o botão de add fica lá embaixo,
usabilidade horrível" e "o add da lista de compra também fica no fim da lista grande".

Duas das três violam um requisito que **já existe**: `componentes-base` exige 48×48dp para
qualquer elemento tocável, e tem cenário explícito para `Pressable` fora do componente `Botao`.
O que faltou foi o requisito alcançar a forma que essas ações tomaram — um `<Texto onPress>`,
que não é `Pressable` nem `Botao` e por isso passou despercebido em toda revisão anterior.

A terceira (o botão do formulário) não é coberta por requisito nenhum hoje: nada especifica
**onde** a ação primária de uma tela deve ficar.

## What Changes

- **A-09 — o botão do formulário foge conforme a pessoa usa a tela.** "Adicionar à despensa"
  está no fluxo do `ScrollView`, não fixo no rodapé, então a posição depende do tamanho do
  formulário:

  | Estado | Onde fica o botão |
  |---|---|
  | Recolhido, sem teclado | visível abaixo de "Mais opções" (≈ y940 de 2400) — OK |
  | Expandido, sem teclado | no rodapé, encostado na faixa de gestos |
  | Expandido, com teclado — o estado real de quem está digitando | **abaixo da dobra**: exige rolar 4 campos para submeter |

  "Mais opções" empurra o botão para longe justamente de quem preencheu mais campos.

- **A-10 — "Adicionar item avulso" é rodapé de lista, não é botão.** `app/(tabs)/lista.tsx:204-210`,
  três defeitos nas mesmas 6 linhas:
  1. entra como `ListFooterComponent`, isto é, **depois do último item** — com 41 itens são
     ~3200px de rolagem até a única forma de adicionar algo à lista;
  2. é um `<Texto onPress>`: sem `accessibilityRole="button"`, sem
     `minHeight: ALVO_TOQUE_MINIMO`, sem `hitSlop`. Alvo real ≈ 20dp contra os 48dp exigidos;
     o `padding: espaco.lg` está na `View` externa, não no elemento tocável;
  3. **é incoerente com o próprio arquivo**: em `lista.tsx:113-114` a MESMA ação é oferecida
     como `acao` do `EstadoVazio` — um botão de verdade. Lista vazia = botão; lista cheia =
     link escondido no fim. A ação piora de forma exatamente quando a lista cresce.

- **A-13 — "Ver histórico" do Resumo tem 22dp de alvo.** `app/(tabs)/resumo.tsx:138-144`,
  bounds medidos `[813,1235][1038,1293]` = **58px (22dp)**. Não aparece nem como `clickable` na
  árvore de acessibilidade — é `android.view.View`, não `Button`. E o gêmeo dele já está
  corrigido: `app/produto/[id].tsx:254-263` usa `Pressable` + `accessibilityRole="button"` +
  `hitSlop` + `minHeight: ALVO_TOQUE_MINIMO`, com teste de regressão dedicado em
  `app/produto/[id].test.tsx:82`. O padrão certo está escrito, testado e a poucos arquivos de
  distância; `resumo.tsx` simplesmente não foi alcançado.

## Capabilities

### New Capabilities

- `alcance-das-acoes`: onde a ação primária de uma tela pode ficar. Cobre a posição da ação em
  telas roláveis e em listas de tamanho variável, e a exigência de que a mesma ação não mude de
  forma conforme o estado da tela.

### Modified Capabilities

- `componentes-base`: o requisito "Botão com alvo de toque mínimo" ganha cenário para a forma
  concreta que os defeitos tomaram — texto com `onPress`. O requisito já cobre "qualquer
  elemento tocável", mas os dois cenários existentes falam de `Botao` e de `Pressable`, e foi
  exatamente pela terceira forma que A-10 e A-13 escaparam.

## Impact

- **Código**: `app/(tabs)/lista.tsx:113-114` e `:204-210`, `app/(tabs)/resumo.tsx:138-144`,
  `src/presentation/components/formulario-produto.tsx` (posição do CTA). Provável extração de
  um componente de ação secundária em `src/presentation/components/`, com
  `app/produto/[id].tsx:254-263` como referência do padrão já correto.
- **Dependências**: nenhuma nova.
- **Camadas**: só `presentation/` e `app/`.
- **Testes**: `app/produto/[id].test.tsx:82` é o modelo do teste de alvo de toque a replicar.

### Dependências entre changes

Depende de `correcao-bordas-do-sistema` (Ordem 3): fixar a ação primária num rodapé só faz
sentido depois que o inset inferior existir, senão o rodapé fixo nasce dentro da faixa de
gestos — trocaria um defeito por outro. As duas tratam a borda inferior de ângulos
complementares: a 3 garante que a ação não caia **na faixa de gestos**, esta garante que ela
seja **alcançável e tocável**.

Toca `app/(tabs)/lista.tsx`, que também é território de `correcao-lista-de-compras` (Ordem 2) —
mas aquela change está 100% concluída e mergeada em `develop`, e tocou `item-lista.tsx` e
`item-compra.tsx`, não o rodapé nem o `EstadoVazio` da Lista. Sem conflito vivo.
