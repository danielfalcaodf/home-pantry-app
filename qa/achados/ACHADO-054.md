---
id: ACHADO-054
pr: 8
change: 2026-08-03-modo-compra-e-fechamento
capability: modo-compra
severidade: media
fase: F5
estado: virou-change
change-correcao: correcao-fluxo-modo-compra
---
## O que quebra

Ao marcar dois itens em sequência rápida (dois `tapOn` consecutivos, sem pausa entre eles) na lista de itens do modo compra, o **segundo toque de uma sequência aparentou marcar o item correto na UI** (o contador do rodapé foi de "0 de 37" para "2 de 37", sem erro), mas o **item efetivamente persistido como comprado não correspondeu ao item tocado**: toquei em "Arroz, 2 pacotes, sem preço" (primeiro item da lista) seguido de "Aveia, 1 caixa, sem preço", e ao fechar a compra, a consulta direta ao banco do dispositivo mostrou que os itens marcados como `comprado=1` foram **"Aveia" e "Farinha de trigo"** — não "Arroz". O produto Arroz permaneceu com `quantidade_atual=0` (não recebeu a reposição), enquanto Farinha de trigo (que eu nunca toquei) foi reposto.

Esse comportamento **não se repetiu** numa segunda tentativa, tocando em Arroz isoladamente (um único `tapOn`, com `inspect_screen` antes e depois para confirmar visualmente o estado): o item certo foi marcado (`"✓, Arroz, 2 pacotes, sem preço"`, contador "1 de 35") e, ao fechar, `quantidade_atual` foi corretamente atualizado para `2000` (2 pacotes, batendo com `quantidade_necessaria`).

**Causa não confirmada** — duas hipóteses, nenhuma verificada em código nesta rodada:
1. Corrida de re-render na lista (`FlashList`) do modo compra: o primeiro toque pode disparar uma reordenação/reflow da lista (ex.: item marcado sobe/desce de posição) antes do segundo toque ser resolvido, fazendo o Maestro (ou um usuário real tocando rápido) acertar coordenadas que já correspondem a outro item.
2. Particularidade do ambiente de automação (Maestro resolve o toque por texto, então normalmente é imune a isso — mas o efeito só ocorreu em toques consecutivos sem espera, nunca em toque isolado).

Como o contador do rodapé mostrou "2 de 37" (número correto) mas o item persistido divergiu do item tocado, a hipótese 1 (rendering) é a mais provável — o contador é derivado do estado, então "2 itens marcados" está certo, só a **associação de qual produto foi marcado** que saiu errada.

## Como reproduzir

1. Garantir uma compra recém-materializada com pelo menos 5 itens em falta, nenhum ainda marcado.
2. Sem esperar entre os toques, executar dois `tapOn` consecutivos por texto em dois itens da lista (ex.: 1º e 4º item visíveis).
3. Fechar a compra.
4. Consultar `compra_item` no banco do dispositivo (`adb shell run-as com.triasoftware.repor sqlite3 files/SQLite/estoque.db "SELECT p.nome, ci.comprado FROM compra_item ci JOIN produto p ON p.id=ci.produto_id JOIN compra c ON c.id=ci.compra_id WHERE ci.comprado=1;"`) e comparar com os dois itens realmente tocados.

Não reproduzido de forma determinística nesta rodada — só uma ocorrência registrada, e uma segunda tentativa com toque único não reproduziu o problema. Fica como suspeita fundamentada, não confirmação.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-03-modo-compra-e-fechamento/specs/modo-compra/spec.md` — "Item marcado muda de aparência" e o próprio caminho crítico do app (CLAUDE.md, "dar baixa: ≤ 3 toques") pressupõem que cada toque afeta exatamente o item tocado, sem ambiguidade, mesmo sob toques rápidos consecutivos — comportamento esperado em qualquer app de lista com estado por item.

## Observado (saída real, caminho:linha)

Efeito observado via banco (`compra_item.comprado`, `produto.quantidade_atual`) após uma sequência de dois `tapOn`; não localizado no código-fonte nesta rodada (não investiguei `item-compra.tsx` nem a keyExtractor da lista do modo compra em profundidade — fica como próximo passo caso o achado seja confirmado).

## Change sugerida (slug proposto, escopo de uma frase)

`investigar-marcacao-toques-rapidos`: antes de qualquer correção, reproduzir de forma determinística (manual, tocando rápido de propósito, ou com um teste RNTL que dispara dois `fireEvent.press` sem aguardar re-render) para confirmar se é bug de produção ou artefato do Maestro; só then decidir se é keyExtractor/memoização da lista ou outra causa.
