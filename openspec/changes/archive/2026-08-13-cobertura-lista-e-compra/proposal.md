**Type:** Bug Fix

## Why

A auditoria de qualidade F3 (`qa/achados/ACHADO-029`, `030`, `031`, `032`, `033`, `046`, `047`) encontrou sete pontos das capabilities `itens-avulsos`, `lista-derivada`, `custo-estimado`, `gasto-mensal` e `historico-de-compras` sem teste automatizado, apesar de o comportamento exigido já estar integralmente descrito nos specs correspondentes. `SheetAvulso` concentra a validação de nome obrigatório do requisito "Adicionar item avulso sem cadastrar no estoque" e nunca é exercitado; `agruparListaPorCategoria`/`listaContinua` implementam a regra de agrupamento e ordenação e só são testados indiretamente via exportação de texto; a agregação mensal (`gastoPorMes`) e o detalhe de compra nunca são testados no caso de borda que o próprio spec já nomeia ("compra finalizada com total zero", "itens não comprados distinguíveis"). O "bug" é a lacuna de cobertura, não uma divergência de comportamento — a "correção" é escrever os testes que faltam, incluindo os casos de borda que a auditoria já nomeou junto de cada achado.

## What Changes

- Adicionar `sheet-avulso.test.tsx` cobrindo salvar com nome válido, nome vazio (erro, sem `onSalvar`), preço em branco (`null`) e modo de edição (`inicial` preenchido) (`ACHADO-029`).
- Adicionar `agrupar-lista.test.ts` cobrindo `agruparListaPorCategoria` (grupos alfabéticos, "Sem categoria" por último) e `listaContinua` (ordenação única por nome) (`ACHADO-030`).
- Adicionar `use-preferencia-agrupamento.test.ts` com repositório fake, cobrindo leitura inicial e persistência ao alternar (`ACHADO-031`).
- Adicionar `rodape-total.test.tsx` cobrindo o rótulo "estimado" e a contagem condicional de itens sem preço (`ACHADO-032`).
- Adicionar `item-lista.test.tsx` cobrindo o prefixo "+ " de item avulso e a indicação de "sem preço" (`ACHADO-033`).
- Estender a cobertura de `gastoPorMes`/`useGastoMensal` com o caso de compra finalizada com total zero (`ACHADO-046`).
- Estender `use-detalhe-compra.test.ts` com um item `comprado: false` (`ACHADO-047`).

Nenhum comportamento de produto muda — todo o trabalho é adicionar prova automatizada ao comportamento já especificado. Os deltas de spec desta change apenas tornam explícitos, no texto normativo, os pontos de verificação (função, arquivo, campo) que os novos testes passam a exercitar diretamente.

## Capabilities

### New Capabilities

(nenhuma — nenhum comportamento novo é introduzido)

### Modified Capabilities

- `itens-avulsos`: requisito "Adicionar item avulso sem cadastrar no estoque" passa a exigir explicitamente que a validação de nome obrigatório seja verificável na interface de `SheetAvulso`, não apenas na camada de hooks com dados já válidos.
- `lista-derivada`: requisito "Ordenação e agrupamento por categoria" passa a nomear as funções puras responsáveis (`agruparListaPorCategoria`, `listaContinua`) e a preferência persistida (`usePreferenciaDeAgrupamento`) como pontos de verificação diretos, não apenas indiretos via exportação de texto.
- `custo-estimado`: requisitos "Rodapé com totais" e "Marcação de item sem preço" passam a exigir explicitamente a verificação da renderização (`RodapeTotal`, `ItemLista`), não apenas do cálculo de domínio subjacente.
- `gasto-mensal`: requisito "Apenas compras finalizadas entram no gasto" ganha critério de aceite explícito sobre o cenário de compra finalizada com total pago zero na agregação (`gastoPorMes`).
- `historico-de-compras`: requisito "Detalhe de uma compra" ganha critério de aceite explícito sobre a distinção de itens não comprados no hook `use-detalhe-compra`, não apenas na tela.

## Impact

- `src/presentation/components/sheet-avulso.tsx` (novo teste)
- `src/presentation/format/agrupar-lista.ts` (novo teste)
- `src/application/lista/use-preferencia-agrupamento.ts` (novo teste)
- `src/presentation/components/rodape-total.tsx` (novo teste)
- `src/presentation/components/item-lista.tsx` (novo teste)
- `src/infrastructure/repositories/sqlite-compra.repository.ts` (`gastoPorMes`, extensão de teste)
- `src/application/resumo/use-gasto-mensal.test.ts` (extensão)
- `src/application/resumo/use-detalhe-compra.test.ts` (extensão)
- Nenhum arquivo de `src/domain/` ou schema é alterado.

## Dependencies between changes

- Depende de `correcao-fluxo-modo-compra` (Ordem 05): os testes de lista/compra precisam cobrir o comportamento já corrigido do modo compra (bugs médios ACHADO-034/054), não o comportamento divergente que a correção substitui.
- Depende de `alvos-de-toque-e-acessibilidade` (Ordem 06): componentes como `sheet-avulso.tsx` e `item-lista.tsx` podem ter alvos de toque e rótulos de acessibilidade tocados por essa change; os testes desta change devem asserir o estado pós-correção.
