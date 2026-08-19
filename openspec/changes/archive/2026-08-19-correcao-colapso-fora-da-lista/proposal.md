**Type:** Correção de Bug

## Why

Usuário relatou em teste manual (screenshot anexado): na aba Lista, a seção "Fora da lista por
agora" (itens removidos temporariamente da lista de compras) sobrepõe/empurra a lista de compras
principal quando há muitos itens fora da lista — a lista principal fica pequena ou "some", mesmo
tendo itens ativos.

Confirmado na sessão de teste de 2026-08-18, com evidência de dois ângulos diferentes:

1. Direto: com 1 item ativo ("Arroz") e 9+ itens em "Fora da lista por agora", a seção
   desativados ocupa praticamente toda a tela abaixo do único item ativo visível.
2. Incidental, achado ao testar duas changes diferentes (`correcao-agrupamento-modo-compra` e
   `correcao-affordance-busca-e-lista`): a `ScrollView`/lista de itens ativos (`rid="lista-de-
   compras"`) renderiza com altura colapsada (~155px, só 1 item visível por vez, com rolagem
   isolada) sempre que a seção "Fora da lista por agora" está presente — mesma tela, mesmo
   sintoma, mesma causa raiz (a seção desativados, sem limite de altura nem colapso, consome o
   espaço que deveria ir para a lista rolável principal).

A seção "Fora da lista por agora" hoje é `View` + `.map()` simples, sempre expandida, sem
`useState` de colapso e sem altura limitada.

## What Changes

- A seção "Fora da lista por agora" passa a iniciar **colapsada por padrão**, com um cabeçalho
  tocável mostrando a contagem (ex.: "Fora da lista por agora (25)") e um indicador de
  expandir/recolher — reaproveitando o mesmo padrão já usado em `formulario-produto.tsx`
  ("Mais opções"/"Menos opções": `useState<boolean>` + `accessibilityState={{expanded}}` +
  ícone de chevron rotacionado).
- A `ScrollView`/lista de itens ativos ganha altura que cresce com o conteúdo (não mais uma
  altura mínima herdada que a espreme a ~155px) — a lista principal volta a ser a área rolável
  dominante da tela, com a seção desativados (agora colapsável) não competindo por espaço quando
  fechada.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `lista-derivada`: a apresentação da seção "Fora da lista por agora" passa a ser colapsável por
  padrão, sem alterar a regra de derivação da lista em si (query/critério de quais itens entram
  em cada seção não muda).

## Impact

- `app/(tabs)/lista.tsx` — componente/seção da lista de itens desativados e o container da lista
  ativa.
- Sem mudança de domínio, repositório ou schema — puramente apresentação.
