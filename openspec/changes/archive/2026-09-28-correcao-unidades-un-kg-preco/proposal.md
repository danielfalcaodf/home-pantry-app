**Type:** Bug Fix

## Why

Produto cadastrado em `g` tem o preço interpretado como centavos **por grama**: um queijo com
falta de 500 g e preço digitado "5,19" (o usuário pensa em R$/100 g, ou "51,90" pensando em
R$/kg) vira custo de R$ 2.595,00 na lista. Mesmo digitando o preço por grama "certo", ele não
cabe em centavos inteiros (R$ 51,90/kg = 5,19 centavos/g → arredonda para 5 → R$ 50,00/kg). O
mesmo defeito existe em `ml`. Na exploração com o usuário, concluiu-se que `g`, `ml`, `L`,
`pacote` e `caixa` não refletem como produtos de casa são comprados: ou é por unidade
(garrafa, lata, pacote), ou a granel por peso (kg). Remover essas unidades elimina a classe
inteira do bug em vez de remendar o preço de cada uma.

## What Changes

- **BREAKING** — conjunto de unidades passa de 7 para 2: `un` e `kg`. `g`, `ml`, `L`, `pacote`
  e `caixa` deixam de existir no domínio, no schema (`CHECK ck_produto_unidade`) e na UI.
- `ehIndivisivel` passa a ser só `un`; arredondamento para cima vale só para `un`.
- Migration nova (forward-only) converte os dados já gravados no aparelho:
  - `g` → `kg`: quantidades ÷ 1000 em `produto`, `movimento_estoque` e `compra_item`; **preço
    do produto zerado** (fica "sem preço", o usuário redigita — o valor salvo é ambíguo entre
    R$/kg e R$/100 g).
  - `pacote`/`caixa` → `un`: quantidades, preço e fator de embalagem mantidos.
  - `ml`/`L` → `un` (saída de segurança; o usuário não tem dados nessas unidades):
    quantidade arredondada para cima, preço zerado.
- Backup JSON sobe de versão (v5 → v6) com conversor que aplica as mesmas regras, para que
  backups antigos continuem restauráveis.
- Preço de produto em `kg` é sempre gravado em R$/kg; os campos de preço oferecem a base
  "por kg · por 100 g" (por 100 g multiplica por 10 antes de gravar) e exibem `R$ 51,90/kg` —
  no formulário de produto, no sheet de preço da Lista e no ajuste do Modo Compra.
- Controle de embalagem passa a ser a única entrada para "vem em pacote", e o texto muda de
  "Vem em pacote fechado?" para "É vendido em pacote fechado?" com exemplo
  ("ex.: papel higiênico em pacote de 12 rolos").

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `unidades-e-valores`: conjunto fechado de unidades vira `un`/`kg`; classificação e
  arredondamento só para `un`; novo requisito de entrada/exibição de preço por kg em duas bases.
- `cadastro-de-produto`: controle de embalagem com novo texto e sem o ramo `pacote`/`caixa`.
- `conversao-de-embalagem`: fator restrito a `un` (antes `un`/`pacote`/`caixa`).
- `regras-de-estoque`: cenários que usavam a unidade `pacote` passam a usar `un`.
- `banco-local`: migration de conversão de unidades com dados existentes.
- `restauracao-de-backup`: backup v5 com unidades removidas é convertido na restauração.

## Impact

- Domínio: `src/domain/shared/unidade.ts`, `quantidade.ts` (formatação), nova função pura de
  conversão de preço por 100 g → por kg; `conversao-embalagem.rules.ts` (`validarFatorConversao`);
  `src/domain/backup/backup.schema.ts` (`VERSAO_SCHEMA_BACKUP_ATUAL = 6`, `converterV5ParaV6`).
- Infra: `src/infrastructure/db/schema.ts` + migration `0005_*` gerada por `drizzle-kit` e
  complementada com o `UPDATE` de dados; recriação da tabela `produto` com FK ligada — revisão
  manual do `.sql` obrigatória.
- Apresentação: `formulario-produto.tsx`, `sheet-preco-produto.tsx`, `sheet-ajuste-compra.tsx`,
  `app/produto/[id].tsx`, `app/(tabs)/lista.tsx`, `teclado-quantidade.tsx`, sheets que listam
  unidades.
- Testes Jest (domínio, infra com migration desde cada versão, restauração de backup v5, RNTL
  do formulário) e flows Maestro que citam `pacote`/`caixa`/"Vem em pacote fechado?".
- Achados do `/opsx:test` corrigidos aqui (tasks 6.x): testes de tela movidos de `app/` para
  `__tests__/app/` (o Expo Router tratava `app/_layout.test.tsx` como layout raiz e zerava os
  tipos de rota); 10 flows Maestro desatualizados antes desta change; e, por decisão do
  usuário, um bug anterior da Lista — produto removido e devolvido entrava na compra com a
  quantidade reservada da marcação de exclusão (`src/application/compra/use-iniciar-compra.ts`
  passa a ressincronizar a quantidade planejada, como já fazia com o preço).
- Operacional: gerar **backup JSON** em Configurações antes de instalar a versão com a migration.

### Dependências entre changes

Sobreposição de arquivo com `correcao-sheets-ajuste-sem-autofoco` (ordem 5:
`sheet-ajuste-compra.tsx`, `sheet-preco-produto.tsx`, `teclado-quantidade.tsx`). O código daquela
change já está em `develop`; a pendência dela é só executar flows E2E. **Sem dependência real de
ordem** — seguem em paralelo; se esta change for mergeada antes, os flows `.maestro/bug-autofoco-*`
podem precisar de ajuste de texto/unidade ao rodar.
