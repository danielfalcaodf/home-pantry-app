**Type:** Correção de Bug

## Why

Na tela Resumo, o botão "Ver histórico" (navega para `/compra/historico`) fica na mesma linha do
rótulo "Gasto por mês", diretamente acima do gráfico de barras (`GraficoBarras`). Quando um mês
concentra o gasto — cenário comum logo nos primeiros meses de uso do app, quando só há uma ou
poucas compras fechadas — a barra desse mês cresce até a altura máxima do gráfico e cobre
visualmente o texto "Ver histórico", tornando o botão parcial ou totalmente inacessível
visualmente. Confirmado ao vivo no emulador: fechar uma única compra de R$ 100,00 já produz esse
overlap (screenshot em anexo à change).

## What Changes

- `GraficoBarras` passa a reservar clearance real entre o topo da área útil das barras e o que
  estiver acima dela, de forma que nenhuma fração de barra (mesmo a máxima, com um único mês de
  dado) encoste ou cubra o cabeçalho "Gasto por mês / Ver histórico" na tela Resumo.
- Não há mudança de comportamento de agregação, cálculo ou navegação — só do espaço reservado
  para a barra mais alta.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `gasto-mensal`: novo requirement garantindo que a exibição do gasto mensal (gráfico de barras)
  nunca sobrepõe o controle "Ver histórico" acima dele, independentemente da distribuição de
  valores entre os meses exibidos.

## Impact

- `app/(tabs)/resumo.tsx` — layout do cabeçalho "Gasto por mês / Ver histórico" acima do gráfico.
- `src/presentation/components/grafico-barras.tsx` — altura útil reservada para as barras.
- Sem mudança de schema, repositório ou caso de uso; puramente `presentation/`.
