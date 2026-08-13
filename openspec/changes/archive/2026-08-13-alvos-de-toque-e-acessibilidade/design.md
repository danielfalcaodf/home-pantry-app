## Context

Sete achados de QA (rodadas F6-R2 e F6-R3, `qa/achados/ACHADO-057.md` a `ACHADO-064.md`) apontam a mesma classe de regressão em telas diferentes: elementos tocáveis implementados diretamente com `Pressable` (não com o componente `Botao`, que já cumpre 48×48dp — ver `openspec/specs/componentes-base/spec.md`) foram dimensionados só pelo tamanho visual do texto/ícone, sem `hitSlop` nem `minWidth`/`minHeight`. O padrão de correção já existe no repositório: `src/presentation/components/botao-voltar.tsx` usa `ALVO_TOQUE_MINIMO` (`theme/espaco.ts`, valor 48) em `minWidth`/`minHeight`, mais `hitSlop={8}`, sem mudar o glifo visual "←". Esta change replica esse padrão nos seis pontos identificados e resolve, separadamente, três desvios de acessibilidade/vocabulário (rótulo falado do stepper, agrupamento de linha do histórico, jargão "estoque").

## Goals / Non-Goals

**Goals:**
- Todo elemento tocável apontado pelos sete achados mede pelo menos 48×48dp de área tocável, sem mudar o tamanho visual do ícone/texto.
- O rótulo de acessibilidade do stepper de consumo usa o mesmo verbo ("Usei") do botão visível e do toast.
- Cada linha do histórico do produto é uma unidade acessível única para o TalkBack.
- O botão "Conferência de estoque" passa a se chamar "Conferência da despensa".

**Non-Goals:**
- Não redesenhar visualmente nenhum dos botões afetados — o alvo de toque cresce por `hitSlop`/padding invisível, não por aumento do glifo.
- Não introduzir um componente `BotaoCabecalho` genérico compartilhado entre todas as telas nesta change — cada correção é local ao `Pressable` existente; extrair um componente compartilhado é uma refatoração possível, mas não necessária para fechar os achados (evitar abstração antecipada, CLAUDE.md §Princípios de código).
- Não alterar a ordem, os campos ou a navegação de nenhuma tela — só dimensão de toque, rótulo acessível e um texto de botão.

## Decisions

**1. `hitSlop` como primeira opção, `minWidth`/`minHeight` quando o glifo já ocupa quase 48dp.**
Para os casos com folga grande entre o tamanho visual e 48dp (57/58, 22dp de altura), `hitSlop` sozinho não alcança 48dp de área tocável a partir de um alvo de ~22dp sem também crescer o `paddingVertical`/`paddingHorizontal` do `Pressable` — a mesma técnica do `BotaoVoltar` (`minWidth`/`minHeight` + `hitSlop={8}`) é replicada nesses seis pontos. Alternativa considerada: só `hitSlop` — rejeitada onde a folga excede o que `hitSlop` cobre sem sobrepor elementos vizinhos (ex.: os dois botões lado a lado no cabeçalho da Lista, ACHADO-057).

**2. Rótulo acessível do stepper construído no mesmo lugar do texto visível, não em componente separado.**
`rotuloAcaoConsumo` já é montado em `app/(tabs)/index.tsx:268` e passado como prop para `ItemDespensa`/`StepperConsumo` — a correção troca só o verbo nessa montagem (`Registrar consumo de` → `Usei`), sem tocar a assinatura do componente nem seus testes existentes de comportamento (só o texto esperado nos testes de rótulo).

**3. Linha do histórico agrupada com `accessible` + `accessibilityLabel` no `View` externo, textos internos com `importantForAccessibility="no-hide-descendants"` implícito via `accessible`.**
Mesmo padrão do `ItemDespensa` (`item-despensa.tsx:73`, `accessibilityLabel` combinado no `Pressable` externo). A linha do histórico (`historico.tsx`, função `Linha`) não é um `Pressable` (não navega a lugar nenhum), então recebe `accessible accessibilityLabel={...}` num `View`, combinando verbo + quantidade + data + motivo — o texto visível interno continua fragmentado em `Texto`s (didático visualmente), só a árvore de acessibilidade passa a expor um nó único.

**4. Renomeação de "Conferência de estoque" é só o literal do botão.**
A rota `/conferencia` e o título interno da tela ("O que você quer conferir?", já sem a palavra "estoque") não mudam — confirmado que só o rótulo do botão em `configuracoes.tsx` usa a palavra.

## Risks / Trade-offs

- **[Risco] Seis correções pontuais e independentes, sem componente compartilhado, podem divergir de estilo entre si com o tempo.** → Mitigação: todas usam a mesma constante `ALVO_TOQUE_MINIMO` de `theme/espaco.ts`, então o valor não diverge mesmo sem componente único; se um sétimo caso aparecer, é o gatilho concreto para extrair o componente (regra de "Factory só se repetido", CLAUDE.md §Princípios de código, aplicada aqui por analogia a padrões de toque).
- **[Risco] Aumentar `hitSlop`/padding nos dois botões lado a lado do cabeçalho da Lista (Compartilhar/Agrupar) pode fazer as áreas tocáveis se sobreporem.** → Mitigação: task de verificação manual mede o espaçamento resultante entre os dois antes de fechar a change; se sobrepuser, ajusta o `gap` entre eles no mesmo commit.
