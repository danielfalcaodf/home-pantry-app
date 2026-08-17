## Context

`GraficoBarras` (`src/presentation/components/grafico-barras.tsx`) renderiza um container de
altura fixa (`altura`, 96px por padrão) com `alignItems: 'flex-end'`; cada barra tem
`height: Math.max(altura * fracao, 2)`, onde `fracao = dado.valor / maior`. A barra do mês com
maior gasto pode chegar a `fracao = 1`, ou seja, altura igual a `altura` — ocupando o container
inteiro, de baixo a cima.

Em `app/(tabs)/resumo.tsx:131-163`, o cabeçalho "Gasto por mês" / "Ver histórico" e o
`<GraficoBarras>` estão no mesmo `View` pai, separados só por `gap: espaco.sm` (8px). Esse gap é
um espaço fixo *entre* os dois blocos, mas não limita o quanto a barra pode crescer *dentro* do
seu próprio bloco — então uma barra na fração máxima usa os 96px completos, e o resultado visual
(confirmado no emulador) é a barra tocando/cobrindo o texto acima.

## Goals / Non-Goals

**Goals:**
- Garantir que nenhuma barra, em nenhuma distribuição de valores (incluindo um único mês com
  dado), alcance visualmente o cabeçalho acima do gráfico.
- Manter a leitura proporcional das barras entre si (a barra mais alta continua sendo
  visivelmente a maior, só não pode encostar no elemento acima).

**Non-Goals:**
- Não redesenhar o gráfico, não trocar de biblioteca, não mudar espaçamento em outras telas.
- Não mudar a agregação de `useGastoMensal` nem o cálculo de `totalPago`.

## Decisions

**Reservar uma margem interna fixa dentro da altura do `GraficoBarras`, em vez de só confiar no
`gap` do container pai.** Duas formas equivalentes de implementar, escolhida a mais simples:

- Trocar a fração máxima de `1` para um teto abaixo de `1` (ex.: a barra na fração 1 do dado usa
  no máximo `altura - margemMinima` em vez de `altura` inteira), calculado dentro do próprio
  `GraficoBarras`. Isso resolve o problema onde a causa está (o componente que decide a altura
  da barra), sem exigir que toda tela que usa `GraficoBarras` saiba compensar manualmente.

Alternativa considerada e descartada: aumentar só o `gap` em `resumo.tsx` (ex.: de `espaco.sm`
para `espaco.lg`). Descartada porque o `gap` fica *fora* da altura reservada ao gráfico — ele
empurra o gráfico inteiro para baixo, mas não limita o crescimento da própria barra; qualquer
`gap`, por maior que seja, ainda pode ser "alcançado" se um consumidor futuro do componente
passar uma `altura` maior ou usar menos espaço acima. Reservar a margem dentro do próprio
`GraficoBarras` corrige a causa raiz no componente compartilhado, não em cada tela que o usa —
mesma lógica já seguida no achado do `ChipEstado` (change irmã `correcao-chip-invisivel-em-sheet`).

Valor da margem mínima: `espaco.xs` (4px) de folga garantida no topo da caixa de 96px é
insuficiente por já ter sido tratado como bug em outro ponto da auditoria (`espaco.xs` no topo
do `BotaoVoltar`, change 11); usar `espaco.sm` (8px) como margem mínima reservada dentro do
componente, empilhada com o `gap: espaco.sm` já existente no pai — resultando em 16px reais de
clearance entre o texto "Ver histórico" e o topo de qualquer barra, mesmo na fração máxima.

## Risks / Trade-offs

- [Risco] Reduzir a altura útil da barra pode fazer diferenças pequenas entre meses parecerem
  menores do que são → Mitigação: a redução é proporcional e pequena (8px em 96px, ~8%); a
  leitura relativa entre barras não muda, só o teto absoluto.
- [Risco] Outros consumidores futuros de `GraficoBarras` com uma `altura` customizada muito
  pequena (ex.: `altura < 16`) podem ficar com barra quase invisível → Mitigação: fora do escopo
  desta correção (hoje só `resumo.tsx` usa o componente, com `altura=96`); não introduzir guarda
  para cenário que não existe no código atual (regra do projeto contra tratamento de erro para
  cenário que não pode acontecer).

## Migration Plan

Mudança pura de `presentation/`, sem estado persistido nem schema. Deploy é o build normal do
app; não há passo de migração nem rollback especial além de reverter o commit.
