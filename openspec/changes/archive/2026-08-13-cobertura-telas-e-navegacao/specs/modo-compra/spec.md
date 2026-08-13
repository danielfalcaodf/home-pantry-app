## MODIFIED Requirements

### Requirement: Rodapé de acompanhamento

O modo compra SHALL exibir, em rodapé fixo, quantos itens foram marcados de quantos, e o total corrente do que já está no carrinho, em família monoespaçada. O rodapé SHALL aparecer imediatamente acima do botão "Fechar compra", na mesma região inferior da tela.

#### Scenario: Contador atualiza a cada marcação

- **WHEN** o oitavo item de quinze é marcado
- **THEN** o rodapé indica oito de quinze

#### Scenario: Total corrente atualiza

- **WHEN** um item com preço é marcado
- **THEN** o total corrente é acrescido do valor daquele item

#### Scenario: Total sem contagem progressiva

- **WHEN** o total corrente muda
- **THEN** ele troca diretamente para o novo valor, sem animação de contagem

#### Scenario: Números não deslocam o layout

- **WHEN** o total muda de largura de dígitos
- **THEN** nenhum elemento adjacente se desloca

#### Scenario: Posição do rodapé

- **WHEN** o modo compra é exibido com o rodapé visível
- **THEN** o rodapé de acompanhamento aparece imediatamente acima do botão "Fechar compra", nessa ordem visual (rodapé, depois botão)
