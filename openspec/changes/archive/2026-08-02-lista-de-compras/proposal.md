## Why

O PRD define o problema em duas metades: comprar o que já tinha em casa, e chegar ao mercado sem lembrar do que faltava. A change anterior resolveu a primeira. Esta resolve a segunda — e é a que transforma o registro de consumo em valor percebido: quem registra passa a receber a lista pronta, sem montá-la na mão.

O ponto arquitetural que não pode ser violado: **não existe tabela de lista**. A lista é derivada por consulta dos produtos abaixo do mínimo, unida aos itens avulsos da compra aberta (DATABASE §2). Materializá-la criaria a mesma verdade em dois lugares e o bug clássico de lista divergente do estoque.

## What Changes

- Implementa a tela **Lista** (`app/(tabs)/lista.tsx`): itens em falta com quantidade a comprar e custo estimado, mais os avulsos.
- Implementa o rodapé com **total estimado** e a contagem de itens sem preço cadastrado.
- Implementa **item avulso**: adicionar algo à lista sem cadastrá-lo no estoque permanente (churrasco do fim de semana).
- Implementa **remover item da lista** sem alterar o estoque.
- Implementa **agrupar por categoria** (modo corredor de mercado).
- Implementa **exportar como texto** para compartilhar.
- Implementa os hooks `use-lista-compras`, `use-adicionar-avulso`, `use-remover-item-lista`.
- Garante que o arredondamento e a conversão de moeda vêm do domínio — a consulta entrega valor bruto (DATABASE §6.2).

## Capabilities

### New Capabilities

- `lista-derivada`: a composição da lista a partir dos produtos abaixo do mínimo e dos itens avulsos da compra aberta, sem tabela materializada.
- `itens-avulsos`: adicionar, editar e remover itens que existem só para esta compra.
- `custo-estimado`: cálculo do total da lista, tratamento de itens sem preço e sua sinalização.
- `exportacao-em-texto`: geração do texto compartilhável da lista.

### Modified Capabilities

_Nenhuma._

## Impact

- **Cria**: `app/(tabs)/lista.tsx`, `src/application/lista/*`, `src/presentation/components/{ItemLista,RodapeTotal,SheetAvulso}.tsx`.
- **Modifica**: barra de abas (a aba Lista deixa de ser marcador).
- **Depende de**: `fundacao-dominio` (quantidade a comprar, custo, total), `persistencia-sqlite` (consulta de faltantes e a compra aberta), `design-system-tema`, `despensa-e-cadastro-produto`.
- **Bloqueia**: `modo-compra-e-fechamento` — a lista é o que vira compra.
- **Cria a compra aberta**: adicionar um item avulso exige uma compra em situação aberta; no máximo uma por casa, garantido por índice único.
