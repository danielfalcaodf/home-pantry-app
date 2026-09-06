## Context

O app hoje modela cada produto com uma única unidade, usada para estoque, necessidade e compra
(decisão consciente do MVP, `PRD-app-estoque-de-casa.md` linha 294). Teste prático em mercado
revelou um caso comum: produto de unidade indivisível (`un`, `pacote`, `caixa`) consumido/contado
em uma granularidade (rolo) mas vendido em embalagem fechada de outra (pacote de N rolos), com
preço no rótulo por embalagem, não por unidade. O usuário confirmou, ao longo da exploração, que
o escopo fica restrito a unidades indivisíveis — unidades divisíveis (`kg`, `g`, `L`, `ml`) ficam
de fora, resolvidas "no olhômetro" sem necessidade de conversão.

## Goals / Non-Goals

**Goals:**
- Produto de unidade indivisível pode declarar, opcionalmente, quantas unidades vêm em um
  pacote fechado e quanto custa o pacote.
- Lista de compras arredonda a quantidade a comprar para o múltiplo do fator, comunicando o
  excedente de forma convidativa.
- No modo compra, marcar um item com fator pergunta pacotes comprados, tamanho real do pacote
  (editável, pois o mercado pode divergir do cadastrado) e valor total pago — nunca preço por
  unidade direto.
- Divergência de tamanho de pacote encontrada no mercado é pontual: não atualiza a referência do
  cadastro automaticamente.
- Preço pago por unidade, derivado do total pago dividido pelo fator usado, reaproveita o fluxo
  já existente de revisão de divergência de preço no fechamento — nenhuma tela nova para isso.

**Non-Goals:**
- Conversão entre unidades divisíveis (kg comprado em saco de 5kg, por exemplo) — fora de
  escopo, decisão explícita do usuário.
- Mudar o passo do stepper de +/- do modo compra (feature da PR #39) — continua ajustando
  unidade a unidade; o fluxo de pacotes vive só no ajuste detalhado.
- Atualizar automaticamente o fator de conversão do produto quando o mercado usa um tamanho de
  pacote diferente — fica sempre como edição manual do usuário no cadastro, se ele quiser.
- Suportar mais de um "tipo de pacote" por produto (ex.: pacote de 12 e fardo de 6 pacotes) —
  um único fator por produto.

## Decisions

**Onde vive o fator de conversão**: como dois campos opcionais no schema de `produto`
(`fatorConversaoEmbalagem: integer`, `valorReferenciaEmbalagem: integer` centavos), nunca uma
tabela nova. Segue o padrão do resto do schema (colunas opcionais, sem normalizar em tabela à
parte) e mantém a lista de compras uma consulta simples sobre `produto`.
- Alternativa considerada: tabela `embalagem_produto` separada, para suportar múltiplos tipos de
  pacote por produto. Rejeitada — não pedida, YAGNI, e o app já tem o hábito de "campo opcional
  no produto" para casos similares (ver `valorUnitario`, `marcaPreferida`).

**Onde vive o fator usado numa compra específica**: dois campos novos em `compra_item`
(`quantidadePacotes: integer`, `fatorUsadoNaCompra: integer`), preenchidos apenas quando o
produto tem fator cadastrado. A quantidade comprada em unidades continua sendo o campo já
existente (`quantidadeComprada`), calculada como `quantidadePacotes × fatorUsadoNaCompra` — não
duplicamos a fonte da verdade, só guardamos os dois fatores que a compuseram para rastreabilidade
(auditoria de "por que esse item ficou com 16 unidades e não 12").

**Divisão de preço por embalagem é sempre derivada, nunca persistida como fórmula**: segue o
princípio já estabelecido no projeto (campos derivados são função pura de domínio). O preço
pago por unidade é calculado a partir de `valorPagoTotal / (quantidadePacotes ×
fatorUsadoNaCompra)` no momento do fechamento, e só o resultado (centavos por unidade) é
persistido em `compra_item.valorPagoUnitario` — campo que já existe, sem mudança de schema
adicional para ele.
- Arredondamento de centavos: ao centavo mais próximo (`Math.round`), aceitando a pequena perda
  de precisão (~R$0,005/unidade) documentada na exploração — é valor de referência, não
  contabilidade fiscal.

**Divergência de tamanho de pacote não retroalimenta o cadastro**: decisão explícita do usuário
na exploração. Contraste deliberado com o preço, que já pergunta ("atualizar todos os preços
divergentes, manter, ou escolher individualmente") — o tamanho do pacote não entra nesse fluxo de
revisão porque o usuário definiu como pontual, não como parâmetro que deva mudar por confirmação.
Se o usuário quiser corrigir o cadastro (16 em vez de 12), ele edita o produto manualmente depois.

**Preço pago por unidade deságua no fluxo de revisão existente sem mudança de requisito ali**: em
vez de criar uma segunda tela de revisão de preço "para produtos com pacote", o valor derivado é
comparado ao `valorUnitario` cadastrado exatamente pela regra já implementada
(`atualizacao-de-preco-referencia`/decisão de divergência em `regras-de-compra`). Isso evita
duplicar UI e mantém uma única fonte de verdade para "o preço mudou, quer atualizar?".

**Especialização por ADDED, não MODIFIED, nas specs de `modo-compra` e `regras-de-compra`**: o
comportamento de pacotes só se aplica a produtos com fator cadastrado; produtos sem fator seguem
exatamente como hoje. Modelar como requisito novo evita reescrever/arriscar os requisitos
existentes que continuam válidos para a maioria dos produtos.

**Campo de preço unitário e campos de pacote nunca coexistem visíveis** (correção pós-exploração,
2026-09-05): unidade indivisível não implica que o produto seja comprado em pacote fechado —
sabonete e papel higiênico são ambos `un`, mas só o segundo tem fator de conversão. Mostrar
"Quanto costuma custar" ao lado dos dois campos de pacote confundia o usuário (dois campos de
preço, granularidades diferentes) e o valor do pacote sobrescrevia silenciosamente o valor
unitário digitado. Decisão: chip binário "Vem em pacote fechado? [Não]/[Sim]" dentro de "Mais
opções", visível só quando a unidade é indivisível, reaproveitando o `ChipEstado` já usado em
"Medida" (sem novo tipo de controle). Default "Não" (formulário igual ao de hoje: só "Quanto
costuma custar"). Com "Sim", "Quanto costuma custar" fica oculto (valor sempre derivado) e
aparecem "Quantas unidades vêm no pacote?" e "Quanto custa o pacote?".
- Alternativa considerada: usar a própria unidade indivisível como sinal implícito de "compra em
  pacote" (esconder sempre o preço direto quando indivisível) — rejeitada, quebra o caso
  sabonete/unidade avulsa, forçando fator/pacote mesmo quando não existe.

**Chip "Vem em pacote fechado?" só para unidade `un`; `pacote`/`caixa` vão direto aos campos de
embalagem** (refinamento pós-exploração, 2026-09-05): a ambiguidade que motiva a pergunta
(sabonete vs. papel higiênico) só existe pra `un` — é a única unidade indivisível que descreve a
granularidade de *consumo/contagem* sem já dizer nada sobre embalagem de compra. `pacote` e
`caixa`, ao contrário, são a própria unidade de embalagem escolhida pelo usuário: se ele mediu o
produto em "pacote", a resposta a "vem em pacote fechado?" já está embutida na escolha da
unidade (é sempre "sim", trivialmente) — perguntar de novo é redundante. Decisão: o chip
(`ChipEstado` Não/Sim) só aparece quando `unidade === 'un'`; para `pacote`/`caixa`, a seção
"Mais opções" mostra direto os dois campos de embalagem, sem o chip nem "Quanto costuma custar".
Escopo só de apresentação — `validarFatorConversao` no domínio continua aceitando fator como
opcional para qualquer unidade indivisível (`ehIndivisivel`), sem mudança de regra; na prática,
para `pacote`/`caixa` o fator tende a ser sempre preenchido, mas isso é fricção natural do
formulário, não uma obrigatoriedade imposta pelo domínio (evita reabrir `conversao-de-embalagem`
como requisito à parte por uma distinção que hoje é só de UI).
- Alternativa considerada: também tornar o fator obrigatório no domínio para `pacote`/`caixa`
  (rejeitar unidade sem fator) — rejeitada por ora: mudaria requisito validado em
  `conversao-de-embalagem`/`cadastro-de-produto` por uma inconsistência que hoje só aparece na
  tela; revisitar se um caso real pedir a validação mais forte.

**Passo rápido "+/-" do Modo Compra anda de pacote em pacote quando o item tem fator** (achado
pós-exploração, 2026-09-05): `passoRapido()` decidia o incremento só pela `unidade` do produto,
sem olhar se ele tem `fatorConversaoEmbalagem` — um produto vendido em pacote fechado de 6
(unidade `un`) incrementava 1 em 1 (6→7→8...), uma quantidade que não corresponde a nenhuma
compra real possível. Rompe a mesma regra que `quantidadeAComprarComFator` já impõe na lista
(sempre múltiplo do fator) e contradiz a decisão já registrada acima de nunca pedir preço por
unidade direto pra produto com fator. Decisão: quando o item tem fator (usa
`item.fatorUsadoNaCompra ?? produto.fatorConversaoEmbalagem` — prioriza o tamanho de pacote já
confirmado numa compra em andamento sobre o cadastrado, mesma precedência do ajuste detalhado),
o passo do `+`/`-` vira `fator` unidades inteiras, não 1; o piso de "não descer abaixo de 1 passo"
já existente em `ajustarQuantidadeRapida` passa a ser 1 pacote inteiro, não 1 unidade. O
`custoTotal` exibido reaproveita `custoEstimadoComFator` (mesma função da correção de
arredondamento desta sessão) em vez de `quantidade × valorEstimadoUnit`, já que a quantidade após
o passo continua múltiplo do fator.
- Alternativa considerada: esconder o `+`/`-` pra produto com fator e forçar sempre o ajuste
  detalhado (que já pergunta pacotes corretamente) — rejeitada por ora: usuário preferiu manter
  o toque rápido disponível: um "+1 pacote" continua sendo uma ação de um toque só, sem abrir o
  sheet, para o caso comum de "comprei mais um pacote igual ao de sempre".

## Risks / Trade-offs

- **[Risco] Usuário confunde "fator cadastrado" com "fator usado na última compra"** ao ver o
  produto depois → Mitigação: a tela de cadastro sempre mostra o fator cadastrado como
  referência fixa; o fator usado numa compra específica só aparece no histórico daquela compra,
  nunca sobrescreve a exibição do cadastro.
- **[Risco] Arredondamento de centavos acumula divergência pequena ao longo de várias compras**
  → Mitigação: aceito conscientemente (mesma tolerância que já existe hoje em
  `multiplicarQuantidadePorPreco`); é valor de referência para planejamento, não fechamento
  fiscal.
- **[Trade-off] Sem tabela de embalagem, um produto só pode ter um tipo de pacote configurado**
  → Aceito: não há pedido de múltiplos tipos de pacote simultâneos; se surgir, é extensão
  aditiva futura (nova coluna ou tabela), não retrabalho do que está sendo construído agora.
- **[Risco] Overlap de área com `correcao-sheets-ajuste-sem-autofoco`** (mesmo sheet de ajuste no
  modo compra) → Mitigação: usuário confirmou tratar em paralelo, sem dependência real; a
  mudança de autofoco é um atributo isolado, não deve conflitar estruturalmente com os novos
  campos.

## Migration Plan

1. Migration Drizzle aditiva: novas colunas nullable em `produto`
   (`fator_conversao_embalagem`, `valor_referencia_embalagem`) e em `compra_item`
   (`quantidade_pacotes`, `fator_usado_na_compra`). Sem default, sem backfill — produtos e itens
   existentes ficam `NULL`, comportamento inalterado.
2. Revisar o `.sql` gerado manualmente antes do commit (padrão do projeto).
3. Nenhuma migração de dados existentes é necessária — a feature é opt-in por produto.
4. Rollback: não há rollback executável no aparelho (forward-only); se necessário reverter o
   comportamento, uma migration nova torna os campos não utilizados pela camada de aplicação,
   sem apagar dados já gravados.

## Open Questions

- Nome final das colunas/campos de domínio (`fatorConversaoEmbalagem` vs. algo mais curto) —
  decidir na implementação, sem impacto de comportamento.
- Texto exato do excedente convidativo na lista ("dá para 18" vs. outra formulação) — validar
  com o padrão de vocabulário do design de frontend (§11) na fase de tasks/QA visual.
