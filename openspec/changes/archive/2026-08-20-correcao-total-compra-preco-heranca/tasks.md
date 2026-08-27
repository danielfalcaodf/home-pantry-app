## 1. Correção do bug

- [x] 1.1 Em `src/application/compra/use-modo-compra.ts`, alterar `marcar()` para gravar
      `valorPagoUnitario: item.valorPagoUnitario ?? item.valorEstimadoUnit` (mesmo padrão já
      usado para `quantidadeComprada`).

## 2. Prova do cenário do bug

- [x] 2.1 Teste (application, fake repository): item com `valorEstimadoUnit` preenchido e
      `valorPagoUnitario` null → `marcar(item)` → `editarItem` chamado com `valorPagoUnitario`
      igual ao estimado. Rodar antes do fix (falha) e depois (passa).

## 3. Casos de borda do mesmo contexto (obrigatório para Correção de Bug)

- [x] 3.1 Teste: item sem `valorEstimadoUnit` nem `valorPagoUnitario` → `marcar(item)` →
      `valorPagoUnitario` gravado como 0 (Centavos não é nulável; comportamento atual preservado).
- [x] 3.2 Teste: item já com `valorPagoUnitario` ajustado manualmente antes de marcar → `marcar`
      não sobrescreve o valor ajustado.
- [x] 3.3 Teste de regressão em `compra.rules.test.ts`: `totalPago()` soma corretamente quando
      `valorPagoUnitario` já veio preenchido do fluxo de `marcar()` (sem mudar a função).
- [x] 3.4 Teste: `ajustarPreco` chamado depois de `marcar` continua sobrescrevendo o preço
      herdado assumido por padrão.

## 4. Regressão

- [x] 4.1 `npm run test:domain` e suíte de application completa passando.
- [x] 4.2 `npm run verificar` sem violação.

## 5. Reabertura — causa raiz nova (2026-08-20, bug ainda reproduzido pelo usuário)

O fix das seções 1-4 corrigiu o caso em que `compra_item.valorEstimadoUnit` já estava correto
no momento de marcar, mas `marcar()` não caía nele. O bug que persistia era **anterior**:
`valorEstimadoUnit` fica **obsoleto** quando a linha de `compra_item` já existia (compra aberta
residual, ou linha de exclusão criada sem preço) ANTES de o preço do produto ter sido editado —
"Iniciar compra" reaproveita a linha (dedup por `produtoId`) sem nunca atualizar esse campo. Ver
`design.md` para a cadeia completa de causa raiz.

- [x] 5.1 Em `src/application/compra/use-iniciar-compra.ts` (`iniciar`), ao encontrar um item já
      materializado e não comprado, sincronizar `valorEstimadoUnit` com o preço atual do produto
      quando divergir.
- [x] 5.2 Em `src/application/lista/use-remover-item-lista.ts` (`remover`), gravar
      `valorEstimadoUnit` a partir do preço atual do produto ao criar a linha de exclusão, em vez
      de deixar cair no default 0 do schema.
- [x] 5.3 Rede de segurança em `src/application/compra/use-modo-compra.ts` (`marcar`): usar o
      preço vivo do produto (`ItemComProduto.produto.valorUnitario`, já trazido na mesma
      consulta) como último fallback quando `valorEstimadoUnit` está zerado. Precisou mudar a
      assinatura de `marcar` de `CompraItem` para `ItemComProduto` — ajustado o site de uso em
      `app/compra/[id].tsx` e os mocks em `app/compra/[id].test.tsx`/
      `app/compra/toques-consecutivos.test.tsx`.
- [x] 5.4 Testes Jest cobrindo 5.1-5.3: `use-iniciar-compra.test.ts` (sincronização ao reabrir
      compra, e não-regressão de item já comprado), `use-remover-item-lista.test.ts` (linha de
      exclusão nasce com preço correto), `use-modo-compra.test.ts` (rede de segurança do
      fallback pro preço vivo do produto).
- [x] 5.5 `npm test` completo (977/977) e `npm run verificar` sem violação nova.

## 6. QA E2E (Maestro) — MÚLTIPLOS CENÁRIOS, PENDENTE DE EXECUÇÃO REAL

Escritos como parte desta rodada (não executados — sessão dedicada de Maestro com
device/emulador fica para depois). Cobrem o bug por ângulos diferentes (repro exata do relato,
entrada alternativa pela Despensa, a causa raiz real de compra residual, reativação de item
excluído, edição de preço já existente, agregação de total com múltiplos itens, persistência
real no histórico, e persistência entre sessões do app) — pensados como QA (o que quebra?) e
Dev (por que quebraria, dado o que sei do código?) ao mesmo tempo, não um script único.

- [x] 6.1 Rodar `.maestro/bug-preco-editado-lista-modo-compra.yaml` — repro exata do relato:
      editar preço de item "sem preço" na Lista, iniciar compra, marcar, conferir preço e total.
      Executado em 2026-08-20 no emulador local (item real do seed usado no lugar de "Arroz",
      que não existe na massa de dados atual — ver nota abaixo). **PASSOU.**
- [x] 6.2 Rodar `.maestro/bug-preco-editado-despensa-modo-compra.yaml` — mesmo bug, editando o
      preço pelo Detalhe do Produto (Despensa → "Mais opções") em vez da Lista. **PASSOU**
      (validado também manualmente: Farinha de trigo, R$12,50, refletiu certo no Modo Compra).
- [x] 6.3 Rodar `.maestro/bug-preco-compra-residual-reabrir.yaml` — reprodução direta da causa
      raiz: materializa sem preço, edita o preço, reabre a MESMA compra aberta residual (é o
      cenário que mais garante que o fix 5.1 está ativo, não só coincidência de fluxo).
      **PASSOU** — cenário mais crítico, total fechou certo (R$25,38 = R$15,38 residual +
      R$10,00 do item).
- [x] 6.4 Rodar `.maestro/bug-preco-item-reativado-fora-da-lista.yaml` — remove item da lista,
      dá preço ao produto, reativa o item, confirma preço no Modo Compra (cobre o fix 5.2).
      **PASSOU.**
- [x] 6.5 Rodar `.maestro/bug-preco-editar-existente-antes-compra.yaml` — item que já tinha
      preço, troca de valor antes de iniciar a compra, confirma que mostra o preço NOVO.
      **PASSOU.**
- [x] 6.6 Rodar `.maestro/bug-preco-total-multiplos-itens.yaml` — vários itens (com e sem
      preço), confirma soma correta do rodapé e que item sem preço não trava o fechamento.
      **PASSOU.**
- [x] 6.7 Rodar `.maestro/bug-preco-persistencia-apos-fechar-compra.yaml` — fecha a compra,
      confirma que o histórico de compras grava o total correto (não só a tela antes de fechar).
      **PASSOU** (Resumo → "Gasto este mês" e Histórico de compras gravaram R$49,78 certo; não
      existe aba "Compras" separada como o rascunho do YAML assumia — o equivalente real é
      Resumo/Histórico).
- [x] 6.8 Rodar `.maestro/bug-preco-apos-reiniciar-app.yaml` — mata e reabre o app
      (`stopApp`/`launchApp`) entre a edição do preço e o início da compra, descartando qualquer
      hipótese de cache em memória mascarar o bug. **PASSOU** — preço sobrevive ao restart do
      processo.
- [x] 6.9 Todos os 8 cenários confirmados na execução real em 2026-08-20 — a change está pronta
      pra arquivar quanto ao bug de herança de preço.

      **Nota de execução**: nenhum YAML rodou literal — todos assumiam o produto "Arroz" da
      `lista-base.json`, que não está materializado como item de despensa na massa de dados do
      emulador (seed de dev com 40 produtos diferentes). Cada cenário foi adaptado para um item
      real do seed atual (Macarrão, Condicionador, Papel toalha, Feijão, Carne moída, Sabonete),
      sem alterar a intenção/asserções originais — os próprios comentários dos YAMLs já prediziam
      essa necessidade.

      **Bug adicional encontrado e corrigido (fora do escopo original desta change)**: o campo
      "Quanto costuma custar" do `SheetPrecoProduto` (editado pela Lista) não resetava ao trocar
      de produto sem desmontar o componente — o sheet fica montado o tempo todo em `lista.tsx`,
      só `visivel` alterna. Depois de salvar o preço de um produto, abrir o sheet de outro
      produto herdava o texto do anterior (ou pior, concatenava dígitos sobre o valor antigo),
      chegando a gerar um valor inválido que a gravação em `produto.valor_unitario` (coluna
      `NOT NULL`) rejeitava com um erro não tratado. Causa raiz: estado local `useState` sem
      reset no caminho de sucesso do `salvar()` (só o `fechar()`/cancelamento resetava). Corrigido
      com `key={produtoEmEdicaoDePreco?.produtoId}` em `app/(tabs)/lista.tsx` — força o React a
      remontar o sheet a cada produto diferente, sem precisar de `useEffect` sincronizando estado
      (abordagem rejeitada pelo lint `react-hooks/set-state-in-effect`). Teste de regressão
      adicionado em `app/(tabs)/lista.test.tsx` ("editar e salvar o preço de um produto não vaza
      para o sheet do próximo produto aberto"). `npm test` completo (978/978) e `npm run
      verificar` sem violação nova (os erros de typed routes do `tsc` são dívida pré-existente,
      confirmada via `git stash`, sem relação com esta mudança).
