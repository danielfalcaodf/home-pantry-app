## ADDED Requirements

### Requirement: Feedback explícito no campo de correção
O campo "Corrigir para" SHALL distinguir visualmente um placeholder (sugestão da quantidade registrada) de um valor realmente digitado pelo usuário, e a ação "Corrigir" NÃO SHALL resultar em no-op silencioso: sem valor digitado, o estado desabilitado do botão é perceptível e o campo comunica que espera um valor.

#### Scenario: Placeholder não aparenta valor preenchido
- **WHEN** o item atual da conferência é exibido e o usuário ainda não digitou nada no campo "Corrigir para"
- **THEN** o campo comunica visualmente que está vazio (placeholder em estilo distinto de valor real), e o botão "Corrigir" aparece perceptivelmente desabilitado

#### Scenario: Tocar em Corrigir sem digitar não é silencioso
- **WHEN** o usuário toca em "Corrigir" sem ter digitado um valor
- **THEN** nada é gravado e o estado do botão/campo deixa claro por que a ação não avançou — o percurso nunca fica em estado ambíguo sem resposta

#### Scenario: Valor digitado habilita a correção
- **WHEN** o usuário digita um valor no campo "Corrigir para"
- **THEN** o botão "Corrigir" fica habilitado e o toque grava a correção e avança o percurso
