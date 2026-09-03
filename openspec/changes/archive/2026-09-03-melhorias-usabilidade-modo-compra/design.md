## Context

O Modo Compra foi desenhado para uso contínuo no mercado: é uma única tela, mantém o aparelho
acordado e grava as marcações diretamente no rascunho de compra. A implementação atual preserva
uma compra aberta quando a pessoa volta à Lista, mas o botão “Iniciar compra” a reutiliza sem
deixar essa retomada explícita. O ajuste da quantidade real e do preço pago existe em
`SheetAjusteCompra`, porém é acessado por ícone/toque longo; a decisão de atualizar o preço de
referência aparece dentro de cada linha marcada.

A jornada real em atacadista expõe três necessidades relacionadas: retomar ou substituir
conscientemente um rascunho; mudar rapidamente de “2” para “3” quando um desconto por volume
compensa; e decidir quais preços pagos representam referência futura sem interromper a marcação.
A compra aberta é um rascunho materializado em `compra_item`; `quantidadeComprada`,
`valorPagoUnitario` e `atualizarPreco` já são persistidos. O fechamento aplica reposições,
movimentos, preços confirmados e status em uma transação.

## Goals / Non-Goals

**Goals:**

- Tornar visível a existência de uma compra em andamento e proteger seu progresso.
- Permitir iniciar uma nova compra baseada na lista atual, mediante intenção explícita e sem
  possibilidade de duas compras abertas.
- Reduzir o ajuste frequente de quantidade inteira a um toque por incremento/decremento, com
  retorno háptico e alvos de toque de ao menos 48dp.
- Separar a coleta de dados durante a compra da decisão de atualizar preços de referência no
  fechamento.
- Permitir uma decisão rápida por todos os preços e uma revisão seletiva para promoções ou
  exceções.
- Preservar a atomicidade de fechamento e as fronteiras de camadas existentes.

**Non-Goals:**

- Não criar tabela nova, migration, histórico de preços ou detecção automática de promoção.
- Não alterar a regra de lista derivada, a forma de calcular total pago ou a regra de reposição.
- Não introduzir swipe, nova rota, biblioteca de UI ou sincronização remota.
- Não alterar os preços de referência automaticamente, mesmo quando o preço pago divergir.
- Não reconciliar parcialmente uma compra aberta com mudanças da Lista; a pessoa escolhe manter o
  rascunho ou começar outro.

## Decisions

### 1. Compra aberta recebe uma entrada explícita, não atualização silenciosa

A Lista consulta a compra aberta e exibe uma faixa persistente com o progresso (por exemplo,
“Compra em andamento · 3 de 8”). A ação de compra, ao haver rascunho aberto, abre um
`PainelInferior` com “Continuar compra” como ação principal, “Começar nova lista” como ação
secundária e “Cancelar” como saída neutra.

“Continuar compra” abre a compra existente sem rematerializá-la. “Começar nova lista” apresenta
uma confirmação quando a compra possuir itens marcados ou ajustes: a confirmação explica que o
rascunho anterior será cancelado, sem reposição, e que a lista nova usará o estado atual da
Despensa. Sem progresso, a confirmação pode ser omitida. A operação cancelar a aberta + abrir e
materializar a nova deve ser um caso de uso transacional ou uma operação repositório que garanta a
unicidade de compra aberta.

**Alternativas consideradas:** reutilizar a compra aberta automaticamente (estado ambíguo e
surpresa); sincronizar somente itens não marcados (regras complexas para itens removidos,
quantidades e promoções); apagar o rascunho sem confirmação (perda de trabalho).

### 2. Reutilizar o par de controles já existente para ajuste rápido

`StepperConsumo` (`−`) e `BotaoReporRapido` (`+`) já fornecem alvo de toque, háptico e rótulos de
acessibilidade. Eles serão compostos em `ItemCompra`, substituindo o ícone único de ajuste. O
toque simples em `−`/`+` altera `quantidadeComprada` em uma unidade operacional e não marca ou
desmarca o item. O controle funciona antes e depois da marcação; se ainda não houver quantidade
comprada, a alteração começa da quantidade planejada.

Para unidades indivisíveis, o decremento não fica abaixo de uma unidade. Para unidades
fracionáveis, o passo rápido deve usar a unidade operacional já definida pelo produto; valores
fora desse passo e preço pago continuam no `SheetAjusteCompra`, aberto pelo toque longo nos
controles e por uma affordance textual/semântica que não dependa apenas de gesto invisível. O
sheet preserva seu foco confiável via `PainelInferior.onAberto`.

**Alternativas consideradas:** novo componente “super-stepper” (duplicação); editar só no sheet
(teclado demais para ajuste de atacado); stepper dentro do checkbox (mistura marcação com edição).

### 3. Revisar preços divergentes apenas no momento de fechar

Enquanto compra, o app grava a quantidade e o preço realmente pagos, mas não pergunta se o preço
vira referência. Ao pressionar “Fechar compra”, a tela filtra apenas itens marcados, associados a
produto e com `divergenciaDePreco`. Se não houver divergência, fecha direto.

Se houver divergências, um `PainelInferior` apresenta quantidade de preços e explica que atualizar
muda estimativas de compras futuras, não a compra atual. Há três caminhos:

1. **Atualizar N preços**: seleciona todos e confirma o fechamento.
2. **Manter preços salvos**: seleciona nenhum e confirma o fechamento.
3. **Escolher quais atualizar**: mostra a lista curta de produto, preço salvo e preço pago, com
   seleção acessível por item e confirmação do número selecionado.

Produtos sem preço salvo usam texto de primeiro registro (“Sem preço salvo → R$ X”), e itens
avulsos nunca entram. O conjunto final de produtos selecionados é gravado em
`compra_item.atualizarPreco` antes de chamar o fechamento; o domínio continua recebendo o conjunto
confirmado e aplica os efeitos na transação existente. Ao desmarcar um item, sua decisão pendente
de atualização de preço é limpa para evitar estado residual; de qualquer modo, item não marcado
nunca é aplicado pelo domínio.

**Alternativas consideradas:** manter chips “Sim/Não” em cada linha (interrompe a tarefa de
compra); confirmar todos em um `Alert` (informação e exceções não cabem bem); atualizar todos
automaticamente (promoção temporária viraria preço de referência).

### 4. Painel inferior para escolhas com explicação; Alert apenas para confirmação curta

A escolha de retomar/recomeçar e a revisão de preços são conteúdo de decisão com contexto,
progresso e até lista de exceções; ficam em `PainelInferior`, que já é o padrão do app. Alert
nativo é reservado para confirmar o descarte da compra aberta, ação curta e destrutiva.

Todo painel define rótulo/título acessível, isola a interação modal, respeita voltar do Android e
possui ações de largura total e mínimo de 48dp. A seleção por produto tem papel e estado acessível
explícitos; atualizações de estado relevantes devem ser anunciadas ao leitor de tela quando o
painel abrir.

## Risks / Trade-offs

- **Cancelar e abrir uma nova compra em operações separadas pode deixar rascunho cancelado sem
  substituto após falha** → executar como operação transacional e manter a compra anterior aberta
  se a materialização falhar.
- **Preço promocional pode contaminar estimativa futura** → “Escolher quais atualizar” permite
  excluir promoções sem sacrificar a ação rápida para a maioria.
- **Stepper pode ficar visualmente denso em telas estreitas** → usar os componentes de 48dp e
  reorganizar metadados/preço em segunda linha; validar em aparelho Android estreito e com fontes
  ampliadas.
- **Ajustar um item não marcado pode confundir a relação entre planejado e comprado** → rótulo
  acessível e texto de quantidade deixam claro que o valor é “comprar”; a marcação ainda é a ação
  que inclui o item no total e no estoque.
- **Cenário E2E antigo pressupõe retorno automático à compra aberta** → revisar/substituir o flow
  pendente de `correcao-baixa-produto-excluido-da-lista` ao introduzir a escolha explícita.

## Migration Plan

1. Não há migration de dados: compras abertas existentes continuam legíveis.
2. Ao atualizar o app, uma compra aberta existente é apresentada como “Compra em andamento”; a
   pessoa escolhe continuar ou começar outra.
3. Itens com `atualizarPreco` já persistido permanecem seguros: a revisão de fechamento mostra a
   decisão atual e permite substituí-la antes de fechar.
4. Se a versão nova falhar antes do fechamento, o rascunho continua aberto e nenhuma reposição ou
   preço de referência é aplicado; não há rollback de schema necessário.

## Open Questions

- Passo rápido definido por unidade: `1.000` milésimos para `un`, `pacote` e `caixa`; `100`
  milésimos para `kg`, `g`, `L` e `ml`. A quantidade exata continua no sheet.
- Confirmar em teste manual se o texto da faixa deve dizer “3 de 8 itens anotados” ou “3 de 8 no
  carrinho”; a decisão deve respeitar o vocabulário fechado da UI.
