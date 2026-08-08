---
id: ACHADO-026
pr: 6
change: dar-baixa-caminho-critico
capability: movimento-do-gesto
severidade: media
fase: F3
estado: aberto
---
## O que quebra

O requisito "Coreografia do gesto de registrar" exige uma sequência específica: retorno tátil imediato, contração do botão a 0,92, descida do nível com mola, troca de números em esmaecimento cruzado, entrada da confirmação. `stepper-consumo.tsx:47-50` chama `Haptics.impactAsync` e `withTiming` para a contração; `medidor-nivel.tsx` usa `molar()` (spring). Nenhum teste verifica que `Haptics.impactAsync` é de fato chamado ao tocar o botão, nem a ordem/timing da coreografia — `registro-e-desfazer.test.tsx:129` só confirma que o callback de dados (`onRegistrar`) é chamado, não a orquestração visual.

## Como reproduzir

```
grep -n "Haptics" src/presentation/components/registro-e-desfazer.test.tsx
```
Não retorna nada — o mock de `expo-haptics` (se existir em `jest.setup.app.js`) nunca é verificado por uma asserção `expect(Haptics.impactAsync).toHaveBeenCalled()`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-dar-baixa-caminho-critico/specs/movimento-do-gesto/spec.md`, requisito "Coreografia do gesto de registrar", cenários "Retorno tátil imediato" e "Nível desce com física de mola".

## Observado (saída real, caminho:linha)

`src/presentation/components/stepper-consumo.tsx:47` chama `Haptics.impactAsync(...)`; nenhum teste em `registro-e-desfazer.test.tsx` faz `jest.mock('expo-haptics')` seguido de uma asserção de chamada.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-coreografia-gesto`: mockar `expo-haptics` e `react-native-reanimated` (ou usar o mock já presente no preset de teste do Expo) para confirmar, no teste de `StepperConsumo`, que `Haptics.impactAsync` é chamado no toque e que a animação de contração é disparada antes do callback de registro retornar.
