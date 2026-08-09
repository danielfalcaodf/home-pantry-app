---
id: ACHADO-053
pr: 13
change: 2026-08-06-ajuste-visual-telas-design-system
capability: tela-despensa / resumo-de-valores
severidade: media
fase: F5
estado: aberto
---
## O que quebra

O chip "Faltando" da tela Resumo mostra um número **diferente e menor** do que o chip "Faltando" da tela Despensa para o mesmo conjunto de dados, no mesmo instante. Despensa soma corretamente `critico + emFalta` (regra fixada na PR-13, `agrupar-despensa.ts:65`, testada em `agrupar-despensa.test.ts`); Resumo usa o valor bruto do estado `emFalta` isolado, sem somar `critico`.

Reproduzido ao vivo no emulador (fluxo F5 de ciclo de compra): após fechar uma compra que deixou 37 produtos em `critico` (zero estoque, "Acabou") e nenhum em `emFalta` (estoque parcial), a Despensa mostrou corretamente **"Faltando, 37"**, enquanto o Resumo — consultado a poucos segundos de distância, sem nenhuma mutação de dado entre as duas telas — mostrou **"Faltando, 0"**. O próprio bloco "Falta comprar" da mesma tela Resumo (acima do chip) mostra corretamente "37 itens sem preço", provando que o dado certo (37) está disponível no mesmo componente — só o chip "Sua despensa" da Resumo ignora `critico` ao rotular "Faltando".

## Como reproduzir

```
grep -n "valor:\|rotulo:" "app/(tabs)/resumo.tsx" "app/(tabs)/index.tsx"
grep -n "contagensPorEstado" src/application/resumo/use-resumo-valores.ts
grep -n "faltando" src/presentation/format/agrupar-despensa.ts
```

- `app/(tabs)/resumo.tsx:24` — `{ valor: 'emFalta', rotulo: 'Faltando' }`, e a contagem vem de `resumo.contagensPorEstado['emFalta']` (linha 107), um `Record<EstadoItem, number>` com os 3 estados sempre mutuamente exclusivos (`use-resumo-valores.ts:23`, `CONTAGENS_VAZIAS = { critico: 0, emFalta: 0, ok: 0 }`).
- `app/(tabs)/index.tsx:40` — `{ valor: 'faltando', rotulo: 'Faltando' }`, um filtro **distinto** de `emFalta`, que via `agrupar-despensa.ts:65` soma `critico + emFalta` antes de exibir.
- Ou seja: as duas telas usam o mesmo rótulo "Faltando" para dois cálculos diferentes — uma soma (Despensa, correto) e um valor bruto de um único estado (Resumo, incorreto).

No dispositivo de teste (massa de dados após o primeiro fechamento de compra real da campanha de QA): `critico=37`, `emFalta=0` — o pior caso possível para expor a divergência, já que ela zera completamente o chip da Resumo em vez de só subestimá-lo.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-06-ajuste-visual-telas-design-system/` introduziu o requisito de que o chip "Faltando" some `critico + emFalta` (testado em `agrupar-despensa.test.ts:11,40` e confirmado como comportamento correto na auditoria F3 da PR-13). O rótulo "Faltando" é vocabulário do usuário (CLAUDE.md §Vocabulário) e precisa significar a mesma coisa em qualquer tela que o exiba — a tela Resumo já usa esse mesmo rótulo (linha 24), então deve seguir a mesma semântica, não uma leitura literal do enum de estado.

## Observado (saída real, caminho:linha)

`app/(tabs)/resumo.tsx:24` (`valor: 'emFalta'`) e `:107` (`contagem={resumo.contagensPorEstado[valor]}`) — nenhuma soma com `critico`, ao contrário de `src/presentation/format/agrupar-despensa.ts:65` (`faltando: critico + emFalta`), que é a implementação de referência já testada e usada pela Despensa.

## Change sugerida (slug proposto, escopo de uma frase)

`unificar-contagem-faltando`: fazer `app/(tabs)/resumo.tsx` reusar a mesma função de agrupamento (`agrupar-despensa.ts`) ou somar explicitamente `contagensPorEstado.critico + contagensPorEstado.emFalta` para o chip "Faltando", eliminando a divergência entre as duas telas.
