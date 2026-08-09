## Why

As regras que decidem se o app mente ou não — arredondamento de quantidade a comprar, conversão milésimos/centavos, clamp da fração do medidor, baixa que cruzaria zero — são todas cálculo puro. Escrevê-las **antes** de qualquer tela ou query é o que torna a meta de 90% de cobertura barata: o domínio roda em Node puro, em segundos, sem emulador.

É também a defesa mais eficiente contra o modo de falha específico deste projeto: código gerado por IA acerta a forma e erra a regra sutil. O teste é o contrato que pega isso. DATABASE §12 é explícito — os helpers de milésimos e centavos vêm **antes de qualquer query**, porque `quantidade_atual × valor_unitario` produz centavos × 1000, e esse é o tipo de detalhe que vira um valor 1000× errado na tela sem nenhum erro aparecer.

## What Changes

- Cria `src/domain/shared/unidade.ts`: as sete unidades (`un`, `kg`, `g`, `L`, `ml`, `pacote`, `caixa`) e a classificação de divisível/indivisível.
- Cria `src/domain/shared/quantidade.ts`: representação em milésimos, conversão para exibição, e **arredondamento para cima em unidades indivisíveis**.
- Cria `src/domain/shared/dinheiro.ts`: representação em centavos, formatação BRL, e a conversão única de `milésimos × centavos → centavos`.
- Cria `src/domain/produto/produto.ts` (tipo) e `src/domain/produto/estoque.rules.ts`: `estadoDoItem`, `emFalta`, `quantidadeAComprar`, `custoReposicao`, `valorEmEstoque`, `alturaDoNivel` (fração clampada em `[0,1]`), `rotuloDoItem`.
- Cria `src/domain/produto/categoria.ts`: normalização de categoria na escrita (trim, colapso de espaços, capitalização).
- Cria `src/domain/movimento/movimento.ts`: tipo do movimento e as regras de coerência de sinal (`baixa` reduz, `reposicao` aumenta, `ajuste` livre) e de saldo resultante nunca negativo.
- Cria `src/domain/compra/compra.ts` e `compra.rules.ts`: total pago, reposição por item, decisão de atualizar preço de referência.
- Cria `src/domain/produto/validacao.ts`: validação de cadastro conforme US-01, retornando `Result`.
- Testes para tudo acima, com cobertura mínima de 90% em `src/domain/`.

## Capabilities

### New Capabilities

- `unidades-e-valores`: representação inteira de quantidade (milésimos) e dinheiro (centavos), suas conversões de exibição e o arredondamento por tipo de unidade.
- `regras-de-estoque`: classificação de estado do item, cálculo de falta, quantidade a comprar, custo de reposição, valor em estoque e fração do medidor visual.
- `regras-de-movimento`: coerência de um movimento de estoque, saldo resultante e movimento inverso para desfazer.
- `regras-de-compra`: cálculo do total pago de uma compra e do efeito de reposição de cada item marcado.

### Modified Capabilities

_Nenhuma._

## Impact

- **Cria**: toda a árvore `src/domain/` com testes co-localizados.
- **Depende de**: `bootstrap-projeto-expo` (runner de teste do domínio, `Result`, gerador de UUID v7).
- **Bloqueia**: `persistencia-sqlite` (os repositórios usam os tipos do domínio) e todas as changes de UI.
- **Não toca**: banco, telas, componentes, Expo. Zero import externo — é o que o script de verificação de fronteiras garante.
