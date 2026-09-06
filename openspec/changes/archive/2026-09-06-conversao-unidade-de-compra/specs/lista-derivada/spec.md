## MODIFIED Requirements

### Requirement: Quantidade a comprar calculada pelo domínio

Cada item da lista SHALL exibir a quantidade a comprar calculada pela regra de domínio, com
arredondamento para cima em unidade indivisível. A consulta SHALL entregar apenas a diferença
bruta, e NÃO deve replicar o arredondamento. Quando o produto tiver fator de conversão de
embalagem, a lista SHALL exibir a quantidade em pacotes ("compre N pacotes") e, se houver
excedente de unidades após a compra, SHALL comunicá-lo de forma convidativa (por exemplo "dá
para 18"), nunca em tom de aviso ou desperdício.

#### Scenario: Arredondamento em unidade indivisível

- **WHEN** um item em pacotes tem quantidade atual 2,5 e necessária 3
- **THEN** a lista exibe a quantidade a comprar de 1 pacote

#### Scenario: Fração preservada em unidade divisível

- **WHEN** um item em quilogramas tem quantidade atual 0,5 e necessária 2
- **THEN** a lista exibe a quantidade a comprar de 1,5 kg

#### Scenario: Regra não duplicada na consulta

- **WHEN** a consulta de faltantes é inspecionada
- **THEN** ela não contém nenhuma expressão de arredondamento por unidade

#### Scenario: Item com fator de conversão exibe pacotes e excedente convidativo

- **WHEN** um produto com fator de conversão 12 tem 6 unidades faltando (necessária 12, atual 6)
- **THEN** a lista exibe "compre 1 pacote (dá para 18)", sem nenhum termo que soe a aviso ou
  desperdício

#### Scenario: Item com fator de conversão sem excedente

- **WHEN** um produto com fator de conversão 12 tem exatamente 12 unidades faltando
- **THEN** a lista exibe "compre 1 pacote", sem menção a excedente
