## MODIFIED Requirements

### Requirement: Itens sem preço não corrompem o total

Itens sem valor unitário cadastrado SHALL entrar na lista com custo zero e SHALL ser marcados visualmente como sem preço. Eles NÃO devem impedir nem distorcer o total. A marcação visual SHALL ser verificável diretamente no componente de linha (`ItemLista`, em `src/presentation/components/item-lista.tsx`).

#### Scenario: Marcação de item sem preço

- **WHEN** um item tem valor unitário zero
- **THEN** ele exibe a indicação de sem preço no lugar do valor

#### Scenario: Total permanece calculável

- **WHEN** a lista contém itens com e sem preço
- **THEN** o total é a soma apenas dos custos conhecidos, e é exibido normalmente

#### Scenario: Contagem de itens sem preço

- **WHEN** três itens da lista estão sem preço
- **THEN** o rodapé informa quantos itens estão sem preço cadastrado

#### Scenario: Lista inteiramente sem preço

- **WHEN** nenhum item da lista tem preço
- **THEN** o total exibido é zero e a contagem de itens sem preço iguala o número de itens

#### Scenario: `ItemLista` renderiza a indicação de sem preço

- **WHEN** `ItemLista` recebe um item com `semPreco` verdadeiro
- **THEN** o texto de "sem preço" é renderizado no lugar do valor formatado

### Requirement: Rodapé com totais

A lista SHALL exibir, em rodapé, a contagem de itens e o total estimado da compra, em família monoespaçada. `RodapeTotal` SHALL renderizar essa contagem e esse total a partir das props recebidas, e a linha de itens sem preço SHALL aparecer apenas quando a contagem correspondente for maior que zero.

#### Scenario: Contagem e total exibidos

- **WHEN** a lista tem quinze itens somando R$ 189,40
- **THEN** o rodapé exibe a contagem de itens e o total estimado

#### Scenario: Total inclui avulsos

- **WHEN** a lista contém itens em falta e itens avulsos com preço
- **THEN** o total considera ambos

#### Scenario: Total atualiza sem contagem progressiva

- **WHEN** um item é removido da lista
- **THEN** o total muda diretamente para o novo valor, sem animação de contagem

#### Scenario: Linha de itens sem preço só aparece quando há algum

- **WHEN** `RodapeTotal` recebe `contagemSemPreco` igual a zero
- **THEN** nenhuma linha de "itens sem preço" é renderizada; com `contagemSemPreco` maior que zero, a linha aparece com o número correto
