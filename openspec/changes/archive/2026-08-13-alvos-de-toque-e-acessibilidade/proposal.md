**Type:** Bug Fix

## Why

Sete achados de QA (F6, rodadas R2 e R3) encontraram alvos de toque abaixo do mínimo de 48×48dp exigido pelo CLAUDE.md em seis telas diferentes — de 22dp (menos da metade do mínimo) a 40dp — além de três desvios de acessibilidade/vocabulário: o rótulo falado do stepper de consumo usa o verbo de sistema "Registrar consumo" em vez de "Usei" (documentado ponta a ponta no CLAUDE.md), o histórico do produto fragmenta cada linha em três nós soltos para o TalkBack em vez de um contêiner acessível único, e um botão em Configurações reintroduz o jargão "estoque" onde o resto do app já usa "despensa". Nenhum desses é uma falha de lógica de negócio — todos são regressões de acessibilidade que tornam o app mais difícil ou mais lento de usar com uma mão (o contexto de uso documentado: corredor de mercado) ou com leitor de tela.

## What Changes

- Aumentar o alvo de toque (via `hitSlop`/padding, sem alterar o visual) dos botões "Compartilhar lista" e "Agrupar por categoria" no cabeçalho de `app/(tabs)/lista.tsx` (ACHADO-057), de 22dp para ≥48dp.
- Aumentar o alvo de toque do botão "Configurações" no cabeçalho de `app/(tabs)/resumo.tsx` (ACHADO-058), de 22dp para ≥48dp.
- Aumentar a altura de toque dos três botões de seleção de tema em `app/(tabs)/configuracoes.tsx` (ACHADO-059), de 40dp para ≥48dp.
- Aumentar o alvo de toque de "Corrigir quantidade atual", "Ver histórico completo" (`app/produto/[id].tsx:185-194,238-244`) e "Mais opções" (`formulario-produto.tsx`, compartilhado entre cadastro e detalhe) (ACHADO-063), para ≥48dp em todos os três.
- Trocar o verbo do `accessibilityLabel` do botão de decremento do stepper de "Registrar consumo de X" para "Usei X" (`app/(tabs)/index.tsx:268`), alinhando o que é falado com o vocabulário visível do botão (ACHADO-061).
- Agrupar cada linha do histórico do produto (`app/produto/[id]/historico.tsx`) num contêiner `accessible` com `accessibilityLabel` combinado (ação + quantidade + data + motivo), no mesmo padrão já usado pelo `ItemDespensa` (ACHADO-064).
- Renomear o botão "Conferência de estoque" para "Conferência da despensa" em `app/(tabs)/configuracoes.tsx` (ACHADO-060).

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `componentes-base`: o requisito "Botão com alvo de toque mínimo" passa a valer explicitamente para qualquer elemento tocável interativo (não só o componente `Botao`), incluindo botões de cabeçalho, seletores e ações secundárias implementados com `Pressable` cru.
- `lista-derivada`: o requisito de ordenação/agrupamento por categoria passa a exigir alvo de toque ≥48dp no controle que alterna o agrupamento.
- `exportacao-em-texto`: o requisito de exportar a lista como texto passa a exigir alvo de toque ≥48dp no controle que aciona o compartilhamento.
- `resumo-de-valores`: novo requisito formalizando o atalho de cabeçalho para Configurações e seu alvo de toque mínimo.
- `tela-de-configuracoes`: o requisito de escolha de tema passa a exigir alvo de toque ≥48dp por opção; novo requisito de vocabulário sem jargão de sistema cobrindo o rótulo "Conferência da despensa".
- `cadastro-de-produto`: os requisitos de campos essenciais em primeiro plano e de detalhe/edição do produto passam a exigir alvo de toque ≥48dp nos controles "Mais opções", "Corrigir quantidade atual" e "Ver histórico completo".
- `registro-de-consumo`: o requisito de vocabulário consistente do começo ao fim passa a cobrir explicitamente o rótulo de acessibilidade (falado), não só o texto visível.
- `historico-do-produto`: o requisito de conteúdo de cada linha passa a exigir que ação, quantidade, data e motivo sejam anunciados como uma única unidade acessível, não como nós soltos.

## Impact

- `app/(tabs)/lista.tsx`, `app/(tabs)/resumo.tsx`, `app/(tabs)/configuracoes.tsx`, `app/(tabs)/index.tsx`, `app/produto/[id].tsx`, `app/produto/[id]/historico.tsx`, `src/presentation/components/formulario-produto.tsx`.
- Nenhuma mudança em `src/domain/`, `src/infrastructure/` ou schema — puramente `presentation/`/`app/` (estilo, `hitSlop`, rótulo de acessibilidade, texto de botão).

## Dependencies between changes

Depende de `correcao-autofoco-detalhe-produto` (Ordem 02) e `botao-voltar-conferencia` (Ordem 03), por tocarem o mesmo arquivo `app/produto/[id].tsx` e telas próximas — ver `openspec/changes/ORDER.md`, Ordem 06. Esta change deve ser aplicada depois que ambas estiverem arquivadas, para evitar conflito no mesmo arquivo sem isolamento de branch.
