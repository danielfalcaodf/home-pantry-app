**Type:** Nova Feature

## Why

O Modo Compra preserva corretamente uma compra aberta, mas não comunica essa retomada nem oferece
uma forma explícita de recomeçar com a lista atualizada. No mercado — especialmente no atacado —
ajustar a quantidade real comprada exige abrir um painel, e a decisão de transformar preços pagos
em referência futura interrompe a marcação item a item. Essas fricções tiram atenção do carrinho e
dificultam registrar o que foi realmente comprado.

## What Changes

- Quando existir compra aberta, a Lista passa a indicar que há uma compra em andamento e oferece
  uma escolha explícita: continuar o rascunho preservado ou cancelar o rascunho e começar uma nova
  lista a partir do estado atual da despensa. Recomeçar exige confirmação quando houver progresso
  registrado.
- Itens do Modo Compra ganham controles visíveis de ajuste rápido de quantidade (`−` e `+`),
  disponíveis antes e depois da marcação, com o painel de ajuste detalhado preservado para
  quantidade exata e preço pago.
- A pergunta de atualização do preço de referência deixa de aparecer em cada item marcado. No
  fechamento, somente os itens marcados cujo preço pago diverge do salvo são revisados juntos,
  permitindo atualizar todos, manter todos ou escolher exceções por produto.
- A decisão de preço continua explícita e as atualizações escolhidas permanecem na mesma transação
  atômica do fechamento; promoções podem ser excluídas da atualização por produto.

## Capabilities

### New Capabilities

(nenhuma — a change melhora jornadas de capacidades já existentes)

### Modified Capabilities

- `modo-compra`: torna a compra aberta descobrível e retomável com escolha explícita, introduz
  ajuste rápido de quantidade por item e remove a pergunta inline de preço.
- `atualizacao-de-preco-referencia`: transfere a confirmação explícita de preços divergentes para
  uma revisão agrupada no fechamento, com decisão global e exceções por produto.
- `fechamento-de-compra`: passa a apresentar a revisão de preços divergentes antes de executar o
  fechamento, sem alterar a atomicidade de seus efeitos.

## Impact

- **Telas**: `app/(tabs)/lista.tsx` e `app/compra/[id].tsx`.
- **Apresentação**: reutilização dos controles já existentes `StepperConsumo`,
  `BotaoReporRapido` e `PainelInferior`; evolução de `ItemCompra`, `SheetAjusteCompra` e novo
  painel de retomada/revisão somente se a composição atual não bastar.
- **Aplicação/domínio**: `use-iniciar-compra`, `use-modo-compra`, `use-finalizar-compra`,
  `use-cancelar-compra` e regras de preço de referência. O novo fluxo cancelar + iniciar deve ser
  atômico para nunca deixar duas compras abertas.
- **Dados**: sem schema ou migration previstos; `compra_item.atualizar_preco` já persiste a
  escolha por produto.
- **Qualidade**: TDD, testes de integração dos fluxos de compra/preço e jornada Maestro completa
  para retomar ou reiniciar, ajustar quantidade no atacado e revisar preços no fechamento.

## Dependencies between changes

Esta change ocupa a próxima posição da fila e será planejada antes do fechamento administrativo
 das changes reabertas que já tiveram código e testes manuais concluídos. Há sobreposição funcional
com `correcao-baixa-produto-excluido-da-lista` no Modo Compra; a implementação desta change deve
revisar ou substituir o cenário E2E pendente que depende do fluxo antigo de retorno à compra aberta.
