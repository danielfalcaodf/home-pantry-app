## Context

`FormularioProduto` é usado em dois contextos diferentes: `app/produto/novo.tsx` (tela cheia,
única coisa na tela) e `app/produto/[id].tsx` (embutido, com irmãos antes/depois: ações rápidas
de consumo/reposição, "Sem uso registrado", "Tirar da despensa"). O componente foi implementado
assumindo o primeiro caso (`flex:1` de ponta a ponta), e o segundo caso herdou o mesmo layout sem
ajuste.

## Goals / Non-Goals

**Goals:**
- Eliminar o vão vazio grande entre "Mais opções" recolhido e "Salvar" quando embutido.
- Eliminar a impressão de corte visual quando "Mais opções" expande.
- Não regredir o caso de tela cheia (`produto/novo.tsx`).

**Non-Goals:**
- Não redesenhar o formulário nem mudar quais campos existem.
- Não mudar o CTA ancorado no rodapé entregue pela change `correcao-acoes-fora-de-alcance`
  (Ordem 5, A-09) — o objetivo é o container do formulário, não a barra de ação.

## Decisions

- Trocar `flex:1` fixo do container do `ScrollView` interno por altura intrínseca ao conteúdo
  quando o componente for usado embutido — provável necessidade de uma prop (`telaCheia?:
  boolean`, default `true` para não quebrar `produto/novo.tsx`) que `produto/[id].tsx` passa como
  `false`.
  Alternativa descartada: duplicar o componente em duas variantes — mais código, mesma lógica de
  campos duplicada, viola SRP do CLAUDE.md sem necessidade real (é só o container que muda).
- Manter o rodapé de ação ("Salvar"/"Adicionar à despensa") ancorado fora do `ScrollView` como já
  está (entregue pela change 5) — só o container do `ScrollView` muda de `flex:1` para altura de
  conteúdo.

## Risks / Trade-offs

- [Risco] Mudar o container pode afetar o layout de `produto/novo.tsx` (tela cheia) se a prop
  não for aplicada corretamente → Mitigação: task de regressão explícita comparando
  `produto/novo.tsx` antes/depois, nos dois temas.
- [Risco] Sem `flex:1`, o rodapé "Salvar" pode deixar de ficar ancorado no fim da tela quando o
  conteúdo é curto (recolhido) — pode parecer "solto" no meio da tela em vez de manter a posição
  correta relativa aos irmãos → Mitigação: task de prova cobre explicitamente o estado
  "recolhido" verificando a posição do "Salvar" em relação aos irmãos antes/depois.
