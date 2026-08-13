## Context

"Faltando" é vocabulário do usuário e aparece em duas telas com cálculos diferentes: `agrupar-despensa.ts:65` soma `critico + emFalta` (referência, testada), enquanto `app/(tabs)/resumo.tsx:24,107` lê `contagensPorEstado['emFalta']` bruto. No pior caso real (37 itens zerados, 0 em falta parcial) o Resumo zera o chip. Já `chip-estado.tsx:31` pinta o estado ativo com `tema.bg.raised` em vez de `cor` + `tema.fillOpacity`, divergindo do spec `componentes-base`.

## Goals / Non-Goals

**Goals:**
- Um único cálculo para "Faltando" em todo o app.
- Chip ativo conforme o spec (cor do estado + opacidade do tema).
- Testes dos cenários já especificados e nunca testados (ativo, reatividade, contagem zero).

**Non-Goals:**
- Mudar o enum de estados do domínio ou `estadoDoItem()`.
- Redesenhar os chips ou as telas.

## Decisions

- **Reusar `agrupar-despensa.ts` no Resumo** em vez de somar inline: um só ponto de verdade para a semântica de "Faltando"; se a regra mudar, muda num lugar. Alternativa rejeitada: somar `critico + emFalta` direto em `resumo.tsx` (duplicaria a regra que o QA acabou de flagrar divergindo).
- **Seguir o spec no chip ativo**: o spec `componentes-base` é o documento de referência e o CLAUDE.md manda atualizar o documento antes de divergir — como não há registro de decisão contrária, a implementação é que se alinha (`cor` com `fillOpacity` de fundo, texto na cor cheia).
- Cores derivadas com opacidade continuam vindo dos tokens (`fillOpacity` 0.12/0.10) — nenhum hex novo fora de `tokens.ts`.

## Risks / Trade-offs

- [Contraste do fundo com opacidade reduzida nos dois temas] → validar visualmente em Despensa e Porcelana; os tokens de `fillOpacity` já são usados no medidor com contraste aprovado.
- [Resumo passar a depender de `agrupar-despensa.ts` cria acoplamento entre telas] → aceitável: é um formatador de `presentation/format/`, compartilhamento é o uso previsto.
