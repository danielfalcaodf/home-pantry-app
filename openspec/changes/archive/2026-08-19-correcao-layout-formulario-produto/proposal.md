**Type:** Correção de Bug

## Why

Usuário relatou em teste manual (screenshot anexado): no formulário de edição de produto, o
botão "Salvar" tem um espaço em branco muito grande abaixo dele antes do próximo conteúdo ("Sem
uso registrado nos últimos 30 dias" / "Tirar da despensa").

Confirmado na sessão de teste de 2026-08-18 em `app/produto/[id].tsx` (produto "Frango"): com a
seção "Mais opções" recolhida, o vão entre o fim dos campos e o topo do botão "Salvar" é de
~350px em tela 1080×2400 (~117dp em 3x) — bem maior que o espaçamento entre os demais campos do
formulário. Achado adicional relacionado: quando "Mais opções" é **expandido**, os campos extras
("Onde guardo", "Marca que prefiro", "Anotação") aparecem visualmente cortados/colados sob o
botão "Salvar" fixo na primeira renderização (um swipe revela que a área é rolável e os campos
são alcançáveis — não é bloqueio de dado, mas passa falsa impressão de sobreposição).

Causa raiz: `FormularioProduto` (`src/presentation/components/formulario-produto.tsx`) foi
desenhado para ocupar a tela inteira sozinho (`flex:1` no container, com `ScrollView` interno
também `flex:1` e barra de ação fixa no rodapé) — mas em `app/produto/[id].tsx` ele é embutido no
meio de uma tela **não rolável** (`TelaBase`, `flex:1`), com irmãos antes ("Usei"/"Repus"/"Outra
quantidade") e depois ("Sem uso registrado...", "Tirar da despensa"). O `flex:1` do formulário
força seu container a absorver todo o espaço vertical restante da tela, empurrando o "Salvar"
para o fundo dessa caixa esticada mesmo com pouco conteúdo (recolhido) — e, no estado expandido,
a altura fixa da `ScrollView` interna faz o oposto: corta visualmente o que não cabe.

## What Changes

- O container do `ScrollView` interno de `FormularioProduto` passa a se adaptar à altura real do
  conteúdo em vez de assumir `flex:1`/altura fixa quando embutido numa tela não rolável — cresce
  com o conteúdo (recolhido = compacto, sem vão grande; expandido = mostra tudo sem cortar).
- Sem mudar o comportamento em telas onde `FormularioProduto` já ocupa a tela inteira
  corretamente (ex.: cadastro de produto novo, se for o caso — confirmar no levantamento).

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `cadastro-de-produto`: o requirement de apresentação do formulário passa a exigir que o
  layout se adapte ao contexto de uso (tela cheia vs. embutido), sem vão vazio nem corte visual
  de conteúdo.

## Impact

- `src/presentation/components/formulario-produto.tsx`
- `app/produto/[id].tsx`
- Verificar se `app/produto/novo.tsx` (formulário em tela cheia) precisa de tratamento
  diferenciado ou se a correção é neutra nesse caso.
