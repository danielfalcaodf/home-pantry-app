**Type:** Bug Fix

## Why

O QA da change `2026-08-03-modo-compra-e-fechamento` (PR #8) encontrou dois bugs médios e três lacunas de teste na tela de modo compra e no fechamento de compra: o aviso de saída com progresso marcado é texto estático em vez de uma confirmação acionada pelo botão de voltar (ACHADO-034); há suspeita, não confirmada, de que toques rápidos consecutivos possam persistir o item errado como comprado (ACHADO-054); e a tela do modo compra, os campos do movimento de estoque gravado no fechamento e os estilos do item marcado não têm teste algum (ACHADO-035, 036, 037). Cinco achados sobre a mesma capability, então corrigir e cobrir juntos evita duas idas à mesma tela.

## What Changes

- `BotaoVoltar` usado em `app/compra/[id].tsx` passa a aceitar uma confirmação opcional: quando há itens marcados (`marcados > 0`) e o usuário aciona voltar, um `Alert.alert` pergunta se ele quer sair, deixando claro que a compra continua aberta com o progresso preservado (mesmo padrão de `confirmarCancelamento`, já usado na mesma tela). Sem itens marcados, o botão volta a se comportar como hoje (`router.back()` direto, sem aviso). O texto estático em `app/compra/[id].tsx:96-98` deixa de ser a única superfície do aviso.
- Investigação determinística da suspeita de corrida de re-render (ACHADO-054): reproduzir via RNTL com dois `fireEvent.press` consecutivos sem aguardar re-render entre eles, marcando dois itens diferentes da lista do modo compra. Se confirmado que o item persistido diverge do item tocado, corrigir a causa raiz (ex.: fechamento de closure sobre estado desatualizado, ausência de otimização por identidade estável na lista). Se não reproduzido deterministicamente após a tentativa, documentar em `tasks.md` a evidência de que o comportamento é estável sob teste automatizado, sem alterar código de produção.
- Teste de composição para `app/compra/[id].tsx` (ACHADO-035): cobre a ausência de navegação ao marcar/ajustar, `useKeepAwake` ativo durante a tela, atualização do rodapé, mensagem de fechamento em linguagem do usuário e retorno à despensa com estado atualizado após sucesso.
- Teste estendido de `sqlite-compra.repository.test.ts` (ACHADO-036): além da contagem de movimentos por `compra_id`, verificar individualmente `usuarioId`, `criadoEm`, `quantidadeDelta` e `quantidadeResultante` de um movimento gerado pelo fechamento.
- Teste de estilo para `item-compra.tsx` (ACHADO-037): asserções de `textDecorationLine`, cor secundária e ausência de preenchimento no item marcado, e das dimensões mínimas do controle de marcação (48×48, quadrado).
- Nenhuma mudança de schema, de rota ou de vocabulário de UI.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `modo-compra`: o requirement "Tela única sem navegação interna", cenário "Sair exige intenção", passa a exigir que o aviso seja condicionado ao acionamento do botão de voltar com itens marcados — não mais um texto sempre visível e desvinculado do gesto.

## Impact

- `src/presentation/components/botao-voltar.tsx` — nova prop opcional de confirmação.
- `app/compra/[id].tsx` — liga `BotaoVoltar` à confirmação quando `marcados > 0`; remove/ajusta o texto estático de aviso.
- `src/presentation/components/item-compra.tsx` — nenhuma mudança de comportamento esperada; só ganha cobertura de teste (a menos que ACHADO-054 se confirme e exija correção aqui ou em `use-modo-compra.ts`).
- `src/application/compra/use-modo-compra.ts` — possível ajuste, só se ACHADO-054 for confirmado.
- `src/infrastructure/repositories/sqlite-compra.repository.test.ts` — teste estendido, sem mudança de implementação.
- Novos arquivos de teste: `app/compra/[id].test.tsx` (ou local equivalente de teste de tela), extensões em `item-compra.test.tsx`.
- Nenhum impacto em `src/domain/` nem em schema/migrations.

Dependencies between changes: esta change depende da `correcao-fuso-horario-testes` (Ordem 01) — o gate `npm test` do repositório tem dois testes falhando por sensibilidade a fuso horário, e o fluxo de Bug Fix desta change (task final `npm run verificar` + `npm test` verdes) precisa desse gate já limpo para não misturar falhas pré-existentes com o resultado desta change. Nenhuma outra change ativa toca `app/compra/[id].tsx`, `botao-voltar.tsx`, `item-compra.tsx` ou `sqlite-compra.repository.ts` nesta ordem (ver `openspec/changes/ORDER.md`).
