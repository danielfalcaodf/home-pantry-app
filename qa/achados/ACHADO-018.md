---
id: ACHADO-018
pr: 4
change: design-system-tema
capability: tema-e-tokens
severidade: media
fase: F3
estado: aberto
---
## O que quebra

`usePreferenciaDeTemaPersistida` (`src/application/tema/use-preferencia-de-tema.ts`) implementa a persistência da escolha de tema — leitura na montagem, gravação via `escolher()` — e já foi desenhado com repositório injetável (`repositorio: ConfiguracaoRepository = configuracaoRepository`) especificamente para ser testável com um fake. Apesar disso, não existe `use-preferencia-de-tema.test.ts`. Os cenários "Escolha sobrevive ao fechamento" e "Automático acompanha mudança do sistema" ficam sem teste no nível do hook — só a função pura `resolverTema` (chamada pelo `ThemeProvider`, não pelo hook) tem teste, em `resolver.test.ts`.

## Como reproduzir

```
find src/application/tema -name "*.test.*"
```
Retorna vazio.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`openspec/changes/archive/2026-08-02-design-system-tema/specs/tema-e-tokens/spec.md`, requisito "Preferência de tema persistida", cenários "Escolha sobrevive ao fechamento" e "Automático acompanha mudança do sistema".

## Observado (saída real, caminho:linha)

`src/application/tema/use-preferencia-de-tema.ts:23-36` aceita `repositorio` como parâmetro com valor padrão, mas nenhum teste usa essa injeção.

## Change sugerida (slug proposto, escopo de uma frase)

`teste-hook-preferencia-tema`: teste RTL (`renderHook`) com repositório fake em memória, confirmando que `escolher('claro')` grava no fake e que uma segunda montagem do hook lê o valor gravado (simula "sobrevive ao fechamento").
