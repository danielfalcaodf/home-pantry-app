---
id: ACHADO-056
pr: 10
change: 2026-08-03-ajuste-e-conferencia-estoque
capability: cadastro-de-produto
severidade: critica
fase: F6
estado: virou-change
change-correcao: correcao-autofoco-detalhe-produto
---
## O que quebra

Ao abrir o detalhe de um produto (`app/produto/[id].tsx`), o campo de texto "O que é" recebe **foco automático** e o teclado do Android sobe sozinho em menos de ~300ms — cobrindo fisicamente os botões "Usei" e "Repus", que são a ação primária da tela. Consequências reproduzidas no emulador (tema Despensa, itens "Arroz" e "Feijão"):

1. Um toque na posição onde "Usei" deveria estar acerta um botão do IME (numa das reproduções, abriu o seletor de emoji do teclado).
2. O usuário pode digitar sem querer no nome do produto (risco de corromper `produto.nome` — o mesmo quase-incidente já tinha ocorrido na autoria do flow de conferência, quando um swipe de adb virou swipe-typing e alterou "Aveia" para "Aveia GT" antes de ser revertido).
3. Tentar fechar o teclado com Voltar (botão ou gesto) **não fecha só o teclado — navega de volta à Despensa**, expulsando o usuário da tela (reproduzido 2x). A única saída encontrada foi o botão "✓"/Done do próprio IME.

Isso torna o caminho secundário do KPI K4 (abrir detalhe → "Usei", 2 toques) **não confiável em uso real**, e injeta navegação extra exatamente onde o CLAUDE.md proíbe.

## Como reproduzir

1. Na Despensa, tocar em qualquer item para abrir o detalhe.
2. Observar o teclado subir sozinho (~300ms) sobre "Usei"/"Repus" (sequência de screenshots a cada 150ms confirma).
3. Tocar onde "Usei" estaria → acerta o IME.
4. Pressionar Voltar → sai da tela inteira em vez de fechar só o teclado.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

CLAUDE.md §Design de UI: "O caminho crítico é dar baixa: ≤ 3 toques, ≤ 10s (KPI K4). **Nenhum elemento de UI pode competir com esse gesto** — sem confirmação, sem navegação extra, sem spinner nele." O teclado auto-invocado é um elemento de UI competindo diretamente com o gesto, e o Voltar-que-sai-da-tela é navegação extra imposta.

## Observado (saída real, caminho:linha)

Autofoco do campo "O que é" do `FormularioProduto` quando montado pela tela de detalhe (`app/produto/[id].tsx` — mesma composição notada na F5 durante a autoria de `editar-produto.yaml`: "campo 'O que é' recebe autofoco e o teclado cobre 'Quanto quero ter em casa'"). Evidência de runtime: screenshots da rodada F6-R1 (teclado sobre os botões a ~150-300ms da abertura; emoji picker aberto por toque em "Usei"; Voltar saindo da tela).

## Change sugerida (slug proposto, escopo de uma frase)

`remover-autofoco-detalhe-produto`: remover o foco automático do campo nome quando o `FormularioProduto` é montado pela tela de detalhe (autofoco faz sentido no cadastro de produto novo, não ao abrir um item existente para consumir/repor) e garantir que Voltar com teclado aberto feche primeiro o teclado, não a tela.
