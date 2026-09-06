**Type:** Nova Feature

## Why

Teste prático em mercado (2026-09-04): um produto cadastrado em unidade indivisível (ex: "rolo",
unidade `un`) e com necessidade de 12, faltando 6, gera na lista de compras a instrução "compre
6 rolos" — mas o mercado só vende em pacote fechado de N unidades (ex: 12), e o preço no rótulo
é do pacote, não do rolo avulso. O usuário precisa fazer a conversão de cabeça (quantos pacotes
levar, quanto custa por unidade) toda vez que compra esse tipo de produto, e o app não tem
nenhum conceito de "embalagem de compra" — hoje uma única unidade serve para estoque,
necessidade e compra (decisão consciente do MVP, `PRD-app-estoque-de-casa.md` linha 294, que já
registrava esse risco como aceito para revisão futura).

## What Changes

- Produto com unidade indivisível (`un`, `pacote`, `caixa`) ganha dois campos opcionais no
  cadastro: quantas unidades vêm no pacote (fator de conversão, inteiro) e quanto custa o
  pacote (valor de referência). Produtos sem embalagem fechada deixam os campos vazios e nada
  muda para eles.
- `valorUnitario` (preço de referência por unidade de estoque) passa a ser calculado a partir do
  valor do pacote dividido pelo fator, quando o fator está cadastrado.
- A lista de compras, para produto com fator cadastrado, arredonda a quantidade a comprar para o
  múltiplo do fator (não mais para 1 unidade) e comunica o excedente de forma convidativa (ex:
  "compre 1 pacote — dá pra 18", nunca em tom de desperdício).
- No modo compra, ao marcar um item com fator cadastrado como comprado, o app pergunta quantos
  pacotes foram comprados, quantas unidades tem o pacote encontrado no mercado (pré-preenchido
  com a referência do cadastro, mas editável) e quanto foi pago no total — porque a embalagem
  real pode divergir da cadastrada (ex: cadastrado 12, mercado tinha 16).
- Divergência de tamanho de pacote encontrada no mercado é **pontual**: não atualiza a
  referência do cadastro automaticamente. O preço pago por unidade (derivado do total pago
  dividido pelo fator usado naquela compra) continua alimentando o fluxo já existente de revisão
  de preço divergente no fechamento (`atualizacao-de-preco-referencia`), sem mudança de
  requisito ali.
- Fora de escopo: unidades divisíveis (`kg`, `g`, `L`, `ml`) não recebem conversão — decisão
  consciente confirmada com o usuário, que já resolve estoque fracionário "no olhômetro" e não
  precisa de precisão de conversão entre elas. Também fora de escopo: mudar o passo do stepper
  de +/- do modo compra (feature recente, PR #39) — continua ajustando unidade a unidade.

## Capabilities

### New Capabilities
- `conversao-de-embalagem`: regras de domínio para produto com fator de conversão
  pacote→unidade — cálculo do rótulo ("vem em pacotes de N"), arredondamento da quantidade a
  comprar para o múltiplo do fator, derivação de `valorUnitario` a partir do valor do pacote, e
  derivação do preço pago por unidade a partir do total pago e do fator realmente usado numa
  compra.

### Modified Capabilities
- `cadastro-de-produto`: novos campos opcionais (fator de conversão, valor do pacote), visíveis
  apenas quando a unidade selecionada é indivisível.
- `regras-de-estoque`: a regra de "quantidade a comprar" passa a arredondar para o múltiplo do
  fator de conversão do produto quando ele existir, em vez de sempre arredondar para 1 unidade.
- `lista-derivada`: exibição da quantidade a comprar passa a considerar o fator de conversão
  (texto "compre N pacotes" e comunicação do excedente).
- `modo-compra`: marcar um item com fator cadastrado como comprado coleta pacotes comprados,
  tamanho real do pacote (editável) e valor total pago, em vez de quantidade/preço por unidade
  direto.
- `regras-de-compra`: o item de compra passa a registrar a quantidade em pacotes e o fator
  usado naquela compra (rastreabilidade), além de derivar o preço pago por unidade a partir
  desses dois valores.

## Impact

- Schema (`src/infrastructure/db/schema.ts`): novas colunas opcionais em `produto`
  (fator de conversão, valor do pacote) e em `compra_item` (quantidade em pacotes, fator usado
  na compra) — migration aditiva, forward-only, sem tocar em `movimento_estoque`.
- Domínio: nova função/arquivo em `domain/produto/` para as regras de conversão de embalagem;
  extensão de `estoque.rules.ts` (arredondamento) e `shared/dinheiro.ts` ou equivalente
  (derivação de preço por unidade a partir do valor do pacote).
- Presentation: `FormularioProduto` (campos novos condicionados à unidade), sheet de marcação de
  item comprado no modo compra (novos campos de pacotes/tamanho real/valor total), texto da
  lista de compras.
- Application: casos de uso de cadastro/edição de produto e de marcar item comprado passam a
  lidar com os campos novos.
- Sem sobreposição de arquivo com as outras changes ativas do repositório (ver ORDER.md). Há
  sobreposição de área (mesmo sheet de ajuste no modo compra) com
  `correcao-sheets-ajuste-sem-autofoco`, sem dependência real — decisão do usuário de tratar em
  paralelo.
