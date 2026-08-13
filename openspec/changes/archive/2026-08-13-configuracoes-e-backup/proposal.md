**Type:** Bug Fix

## Why

O QA da change `2026-08-03-backup-restore-json` (PR #9) encontrou um bug médio de UX e duas lacunas de teste: o toast pós-restauração com divergência só informa a contagem, sem oferecer o caminho até o Diagnóstico onde a correção realmente acontece — o spec de `restauracao-de-backup` exige "informa... e oferece corrigir" (ACHADO-039); a tela de Configurações não tem teste de composição (ACHADO-038); e o adaptador real `ExpoSistemaDeArquivos`, que fala com `expo-sharing`/`expo-document-picker`/`expo-file-system`, nunca é exercitado por teste — só o dublê de teste é (ACHADO-040). Três achados na mesma tela/capability de dados, corrigidos e cobertos juntos.

## What Changes

- O toast de divergência pós-restauração em `app/(tabs)/configuracoes.tsx:191-199` ganha uma ação (`Toast` já suporta a prop `acao: { titulo, onPress }`) que navega para `/diagnostico`, fechando o encadeamento restaurar → divergência informada → correção acessível exigido pelo spec. O toast sem divergência (`'Backup restaurado.'`) continua sem ação, por não haver nada a corrigir.
- Teste de composição para `app/(tabs)/configuracoes.tsx` (ACHADO-038): agrupamento das três ações de dados (backup, restaurar, exportar) sob "Seus dados", distinção visual/textual da ação destrutiva de restaurar, e ausência de diálogo de confirmação ao exportar.
- Teste do encadeamento completo do ACHADO-039: restaurar com divergência exibe o toast com a ação, e tocar nela navega para `/diagnostico`.
- Teste do adaptador real `ExpoSistemaDeArquivos` (ACHADO-040): `expo-sharing`, `expo-document-picker` e `expo-file-system` mockados, cobrindo `gravarECompartilhar`, `selecionarArquivo` (incluindo cancelamento retornando `null`) e `lerTexto`.
- Nenhuma mudança de schema, de rota nova ou de vocabulário de UI além da ação do toast.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `restauracao-de-backup`: o requirement "Reconciliação após restaurar", cenário "Divergência é informada", passa a exigir que o app não só informe a contagem de produtos divergentes, mas ofereça uma ação concreta que leva à correção (tela de Diagnóstico) — hoje o toast é apenas informativo.

## Impact

- `app/(tabs)/configuracoes.tsx` — toast de divergência ganha `acao` navegando para `/diagnostico`.
- Novos arquivos de teste: `app/(tabs)/configuracoes.test.tsx` (ou local equivalente de teste de tela), `src/infrastructure/sistema-de-arquivos/expo-sistema-de-arquivos.test.ts`.
- Nenhum impacto em `src/domain/`, schema ou migrations.

Dependencies between changes: esta change depende da `alvos-de-toque-e-acessibilidade` (Ordem 06) — ambas tocam `app/(tabs)/configuracoes.tsx` (a Ordem 06 corrige alvos de toque e acessibilidade nessa mesma tela, ACHADO-059 e 060) e rodar depois dela evita que o teste de composição criado aqui precise ser reescrito assim que os alvos de toque forem ajustados. Nenhuma outra change ativa toca `expo-sistema-de-arquivos.ts` (ver `openspec/changes/ORDER.md`).
