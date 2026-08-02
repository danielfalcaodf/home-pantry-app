## Why

Esta é a primeira change que entrega algo utilizável. Ela materializa o **elemento-assinatura** do produto — a linha d'água — e a tela que responde à pergunta única do app: *"o que está acabando?"*, em uma olhada (FRONTEND §1).

Também resolve o risco de produto listado como **Alto** no PRD: cadastro inicial pesado. O estado vazio da despensa não é uma tela morta — é o convite para adotar a lista base de ~40 itens, com adoção parcial. O usuário sai da primeira abertura com uma despensa real, não com um formulário em branco.

## What Changes

- Implementa `ItemDespensa`: a linha de 68px, raio 0, com o medidor vertical preenchendo a fração `atual/necessária` de baixo para cima, régua de 2px na superfície na cor do estado, e o rótulo textual — os **três canais redundantes** de FRONTEND §3.4.
- Implementa a tela **Despensa** (`app/(tabs)/index.tsx`): lista ordenada crítico → em falta → ok, alfabética dentro do grupo, com cabeçalho de categoria fixo no filtro "Tudo".
- Implementa os chips de filtro por estado com contagem (`Tudo` · `Acabou (3)` · `Faltando (12)`) e o filtro por categoria.
- Implementa a busca por nome.
- Implementa **cadastro de produto** (`app/produto/novo.tsx`): 4 campos na tela inicial, demais em "Mais opções" recolhido (US-01), com autocomplete de categoria a partir do que já existe.
- Implementa **detalhe/edição de produto** (`app/produto/[id].tsx`) com a quantidade grande em display, campos de edição e o rodapé de histórico.
- Implementa a **remoção lógica** de produto.
- Implementa o **estado vazio com adoção da lista base**, com marcar/desmarcar por item.
- Implementa os hooks de `application/`: `use-produtos` (consulta reativa), `use-cadastrar-produto`, `use-editar-produto`, `use-remover-produto`.
- Trata o conflito de nome duplicado conforme decidido no design — o índice único do banco vence o texto do PRD.

## Capabilities

### New Capabilities

- `medidor-linha-dagua`: o componente de linha que comunica o nível do item por altura de preenchimento, cor de régua e rótulo textual, simultaneamente.
- `tela-despensa`: a listagem da despensa com ordenação por estado, agrupamento por categoria, filtros por estado e busca.
- `cadastro-de-produto`: criação, edição e remoção lógica de produto, com validação, autocomplete de categoria e tratamento de nome duplicado.
- `adocao-da-lista-base`: o estado vazio que oferece os itens comuns de mercado, com escolha item a item.

### Modified Capabilities

_Nenhuma._

## Impact

- **Cria**: `app/(tabs)/index.tsx`, `app/produto/{novo,[id]}.tsx`, `src/presentation/components/{ItemDespensa,MedidorNivel,BarraFiltros,ListaBase}.tsx`, `src/application/estoque/use-*.ts`.
- **Modifica**: `app/(tabs)/_layout.tsx` (barra de abas).
- **Depende de**: `fundacao-dominio` (estado, fração, rótulo), `persistencia-sqlite` (consultas e escritas), `design-system-tema` (tokens e componentes-base).
- **Bloqueia**: `dar-baixa-caminho-critico` (o stepper vive dentro do `ItemDespensa`) e `lista-de-compras`.
- **Ainda não entrega**: o botão de consumo funcional. A linha reserva o espaço do stepper, mas a ação chega na change seguinte, que tem iteração de UX própria por ser o KPI que decide o produto.
