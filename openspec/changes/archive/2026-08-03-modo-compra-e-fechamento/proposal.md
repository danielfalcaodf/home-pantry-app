## Why

Esta change fecha o ciclo. Sem ela, o app registra consumo e gera lista, mas o estoque só desce — nunca volta a subir, e o usuário teria que repor item a item na mão. É o que transforma o "Repor" em um ciclo completo: consome → falta → lista → compra → repõe.

O contexto de uso é específico e define o desenho: a pessoa está **de pé no corredor do mercado**, com o carrinho, uma mão ocupada. FRONTEND §8.3 responde a isso com uma tela só, sem navegação interna, **com a tela travada acordada**, checkbox grande, e o total corrente atualizando a cada item marcado.

É também onde K5 (desvio do custo estimado ≤ 15%) se corrige na prática: ao registrar o preço realmente pago, o app pergunta se atualiza o preço de referência, e a estimativa da próxima lista fica melhor.

## What Changes

- Implementa a tela **modo compra** (`app/compra/[id].tsx`): tela única, sem navegação interna, com a tela mantida acordada.
- Implementa o item de compra: checkbox quadrado de 28px, e a linha perdendo toda a tinta ao ser marcada — a lista esvazia conforme se anda pelo mercado (FRONTEND §7.7).
- Permite **ajustar a quantidade realmente comprada** e o **preço pago** ao marcar.
- Implementa a pergunta de **atualizar o preço de referência** quando o pago difere do cadastrado.
- Implementa o rodapé fixo com contador (`8 de 15`) e total corrente em monoespaçada.
- Implementa **Fechar compra**: aplica todas as reposições, movimentos, atualizações de preço confirmadas e o total pago, **em uma única transação**.
- Mantém os itens não marcados pendentes, fora da reposição.
- Implementa `use-modo-compra` e `use-finalizar-compra`.

## Capabilities

### New Capabilities

- `modo-compra`: a tela de corredor de mercado, sua marcação item a item, o ajuste de quantidade e preço, e o rodapé de acompanhamento.
- `fechamento-de-compra`: a finalização atômica que repõe o estoque, grava os movimentos, atualiza preços confirmados e registra o total pago.
- `atualizacao-de-preco-referencia`: a detecção de divergência de preço e a atualização mediante confirmação explícita.

### Modified Capabilities

- `lista-derivada`: a lista ganha a ação de iniciar a compra, convertendo seus itens em itens de compra planejados.

## Impact

- **Cria**: `app/compra/[id].tsx`, `src/application/compra/{use-modo-compra,use-finalizar-compra}.ts`, `src/presentation/components/ItemCompra.tsx`.
- **Modifica**: `app/(tabs)/lista.tsx` (botão de iniciar a compra).
- **Depende de**: `lista-de-compras`, `fundacao-dominio` (efeitos da finalização), `persistencia-sqlite` (transação de finalização).
- **Bloqueia**: `resumo-valores-e-historico` — o gasto mensal vem das compras finalizadas.
- **Risco central**: estoque parcialmente reposto por falha no meio é o pior estado possível para a confiança no app (ARQUITETURA §5.3). A atomicidade não é otimização, é requisito.
