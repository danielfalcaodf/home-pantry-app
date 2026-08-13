## Context

As PRs 12/13 estenderam o `BotaoVoltar` (componente já existente, alvo de 48×48dp, `accessibilityLabel="Voltar"`) a todas as telas fora das tabs — a conferência ficou de fora por descuido, apesar do cenário "Voltar da Conferência de estoque" já constar no spec `chrome-de-navegacao`. O campo "Corrigir para" usa o valor registrado como `placeholder`, indistinguível de valor digitado, e o botão "Corrigir" desabilitado sem valor não tem sinal perceptível.

## Goals / Non-Goals

**Goals:**
- Saída visível da conferência, consistente com as demais 11 telas.
- Campo de correção sem ambiguidade placeholder×valor.

**Non-Goals:**
- Mudar o percurso, a retomada ou as regras de gravação da conferência.
- Redesenhar o layout da tela.

## Decisions

- **Reusar `BotaoVoltar` como está** (mesma posição-padrão das outras telas, topo do conteúdo). Sair preserva o progresso por construção — a retomada já é coberta por `use-conferencia.test.ts:112` — então não há diálogo de confirmação (coerente com "sem etapas de confirmação adicionais").
- **Placeholder distinto**: manter a sugestão como placeholder mas em estilo visivelmente "vazio" (cor de placeholder do tema, sem peso tabular de valor real), e botão "Corrigir" com estado desabilitado perceptível (opacidade/token de estado). Alternativa rejeitada: pré-preencher o campo com o valor — mudaria a semântica de "Confirmar" vs "Corrigir" do percurso.

## Risks / Trade-offs

- [Voltar no meio do percurso pode parecer perda de progresso] → o requisito de retomada já cobre; o texto de conclusão parcial permanece o mesmo.
- [Mexer no estilo do campo pode conflitar com a change de alvos de toque (ORDER.md 06)] → esta change vem antes; a 06 opera sobre o estado final desta.
