**Type:** Correção de Bug

## Why

A exploração de UX (`/opsx:explore`) mapeou três falhas de usabilidade que se repetem em todos os pontos de entrada de dados do app, porque a causa é comum: todo `TextInput` passa por `CampoTexto` (ou pelo `TextInput` de `TecladoQuantidade`), e todo botão passa por `Botao`/`ChipEstado`/`BotaoVoltar`. O mesmo defeito de base aparece em 6 telas/sheets:

1. **Keyboard Overlap** — nenhuma tela usa `KeyboardAvoidingView` (confirmado por grep, zero ocorrências no projeto). Nos 4 modais (`TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque`, `SheetAjusteCompra`), que já nascem ancorados na base da tela, o teclado sobe e cobre o próprio campo em foco e o botão de confirmar.
2. **Error Prevention com correção silenciosa** — `SheetAvulso` e `SheetAjusteCompra` descartam entrada inválida sem avisar: quantidade não numérica vira um valor padrão, preço inválido vira `null`, e o dado salvo é diferente do que a pessoa digitou, sem nenhum erro em texto. `SheetAjusteEstoque` já faz o certo (valida e mostra erro) e serve de referência. O formulário principal (`FormularioProduto`) também aceita qualquer valor sem teto de sanidade (ex.: "26666 pacotes" foi salvo sem confirmação).
3. **Affordance** — "Mais opções" no formulário não tem indicação visual de que é expansível; os 4 modais não têm "X"/Cancelar visível (só fecham por toque fora ou back); sugestões de categoria só aparecem depois que a pessoa já digitou um prefixo, sem pista prévia do que já existe.

Corrigir isso na base (`CampoTexto`, `Botao`, e o padrão de `Modal` repetido nos 4 sheets) resolve os 6 pontos de uma vez, em vez de seis correções pontuais divergentes.

## What Changes

- `CampoTexto` passa a expor máscara de entrada por tipo de valor (quantidade decimal, dinheiro em R$) e placeholder padrão explicando o formato esperado, sem alterar a representação em milésimos/centavos do domínio (a máscara formata só a borda de exibição, igual já documentado em `domain/shared/`).
- `CampoTexto` ganha um modo de "feedback" mais consistente: todo campo que valida (não só os que já usam `erro` hoje) passa a mostrar mensagem de erro em texto quando a entrada é rejeitada, nunca uma correção silenciosa.
- Um wrapper de teclado (`KeyboardAvoidingView` + rolagem/ajuste ao campo focado) é adicionado uma vez na base — usado pelo `ScrollView` do `FormularioProduto` e pelo padrão comum dos 4 `Modal` (`TecladoQuantidade`, `SheetAvulso`, `SheetAjusteEstoque`, `SheetAjusteCompra`) — para que o campo em foco e o botão de ação nunca fiquem atrás do teclado.
- `SheetAvulso` e `SheetAjusteCompra` passam a validar quantidade e preço como `SheetAjusteEstoque` já faz: rejeitar com mensagem em texto em vez de substituir o valor digitado em silêncio.
- `FormularioProduto` ganha um teto de sanidade configurável para `quantidadeNecessaria` (e demais campos numéricos), rejeitando com mensagem em vez de aceitar qualquer magnitude.
- "Mais opções" ganha um ícone de chevron que gira conforme o estado expandido/colapsado.
- Os 4 `Modal` ganham um controle de fechar visível (botão "X" ou "Cancelar"), mantendo o fechamento por toque fora e back como está hoje.
- Sugestões de categoria (`FormularioProduto`) passam a aparecer também antes de digitar (ex.: ao focar o campo), não só depois de já ter digitado um prefixo.

## Capabilities

### New Capabilities

(nenhuma — esta change corrige comportamento de capacidades já existentes, não introduz uma nova)

### Modified Capabilities

- `componentes-base`: o requisito "Campo de texto com rótulo persistente" ganha cenários novos — máscara de entrada, placeholder padrão por tipo, feedback de erro obrigatório para toda validação (não silenciosa), e compensação de teclado (`KeyboardAvoidingView`) para o campo em foco nunca ficar coberto. O requisito de botão/chip ganha o cenário de affordance do controle de fechar nos modais e do chevron de "Mais opções".
- `cadastro-de-produto`: `FormularioProduto` ganha teto de sanidade em `quantidadeNecessaria` e nos demais campos numéricos, e sugestão de categoria visível antes de digitar prefixo.
- `itens-avulsos`: `SheetAvulso` deixa de aceitar quantidade/preço inválidos em silêncio — passa a rejeitar com erro em texto.
- `ajuste-de-estoque`: `SheetAjusteEstoque` ganha compensação de teclado e controle de fechar visível (o comportamento de validação já está correto e serve de referência para as outras).
- `modo-compra`: `SheetAjusteCompra` deixa de aceitar quantidade/preço inválidos em silêncio — passa a rejeitar com erro em texto, e ganha compensação de teclado.

## Impact

- **Componentes de apresentação**: `src/presentation/components/campo-texto.tsx`, `botao.tsx`, `formulario-produto.tsx`, `teclado-quantidade.tsx`, `sheet-avulso.tsx`, `sheet-ajuste-estoque.tsx`, `sheet-ajuste-compra.tsx`.
- **Telas**: `app/produto/novo.tsx`, `app/produto/[id].tsx` (via `FormularioProduto`); o Detalhe do produto, a Lista de compras e o Modo compra herdam o comportamento via os sheets.
- **Domínio**: nenhuma regra de domínio muda — máscara e teto de sanidade são só borda de exibição/validação; conversão milésimos/centavos continua em `domain/shared/`.
- **Sem mudança de schema, sem mudança de rota, sem BREAKING.**
