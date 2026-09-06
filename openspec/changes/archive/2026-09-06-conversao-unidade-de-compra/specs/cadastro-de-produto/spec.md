## ADDED Requirements

### Requirement: Campos de embalagem no cadastro de produto indivisível

Quando a unidade selecionada no formulário for `un`, a seção de opções recolhida SHALL oferecer
um controle binário "Vem em pacote fechado?" (default "Não"). Com "Não", o formulário mantém
apenas o campo de preço direto ("Quanto costuma custar"), sem qualquer alteração em relação ao
comportamento anterior a esta change. Com "Sim", o campo de preço direto SHALL ficar oculto e a
seção SHALL oferecer dois campos adicionais: quantas unidades vêm no pacote, e quanto custa o
pacote. Quando a unidade selecionada for `pacote` ou `caixa`, o controle NÃO deve ser exibido —
a própria unidade já significa "vem em pacote fechado", então o formulário mostra direto os dois
campos de embalagem, sem o campo de preço direto. Ao mudar a unidade para uma divisível, o
controle e os campos de pacote NÃO devem ser exibidos, e qualquer valor já informado neles é
ignorado.

#### Scenario: Controle aparece para unidade `un`, com "Não" como padrão

- **WHEN** o usuário seleciona a unidade `un` e expande "Mais opções"
- **THEN** o controle "Vem em pacote fechado?" aparece com "Não" selecionado, e o formulário
  mostra apenas "Quanto costuma custar"

#### Scenario: Controle ausente para unidade divisível

- **WHEN** o usuário seleciona a unidade quilograma
- **THEN** nem o controle nem os campos de pacote aparecem no formulário

#### Scenario: Produto `un` sem embalagem continua igual a hoje (ex.: sabonete)

- **WHEN** o usuário cadastra um produto de unidade `un` e mantém "Não" no controle
- **THEN** o produto é criado sem fator de conversão, com o comportamento de hoje, sem exigir
  nenhum campo de pacote

#### Scenario: "Sim" troca o preço direto pelos campos de pacote

- **WHEN** o usuário marca "Sim" no controle (unidade `un`)
- **THEN** "Quanto costuma custar" deixa de ser exibido e aparecem "Quantas unidades vêm no
  pacote?" e "Quanto custa o pacote?"

#### Scenario: Preenchimento dos dois campos deriva o valor unitário

- **WHEN** o usuário marca "Sim", preenche "12" unidades por pacote e "R$ 12,90" como valor do
  pacote
- **THEN** o produto é salvo com fator de conversão 12 e valor unitário derivado, sem que o
  usuário precise (ou consiga) digitar o valor por unidade diretamente

#### Scenario: Unidade `pacote`/`caixa` vai direto aos campos de embalagem, sem perguntar

- **WHEN** o usuário seleciona a unidade `pacote` (ou `caixa`) e expande "Mais opções"
- **THEN** nem o controle "Vem em pacote fechado?" nem "Quanto costuma custar" aparecem, e o
  formulário mostra direto "Quantas unidades vêm no pacote?" e "Quanto custa o pacote?"

#### Scenario: Trocar para unidade divisível descarta a embalagem e o controle

- **WHEN** um produto tinha "Sim" selecionado (ou unidade `pacote`/`caixa`) com fator de
  conversão cadastrado e o usuário muda a unidade para quilograma antes de salvar
- **THEN** o fator de conversão e o valor do pacote não são salvos, e nem o controle nem os
  campos de embalagem aparecem no formulário
