---
id: ACHADO-007
pr: 12
change: correcao-navegacao-nativa
capability: chrome-de-navegacao
severidade: critica
fase: F2
estado: aberto
---
## O que quebra

`app/_layout.tsx:1` importa `react-native-get-random-values` (polyfill de `crypto.getRandomValues`, tipicamente necessário para geração de UUID funcionar em React Native), mas o pacote **não está declarado em `package.json`** — nem em `dependencies` nem em `devDependencies`. `npm run verificar` falha com erro de lint (`import/no-unresolved`), e qualquer `npm ci` limpo (como o desta rodada de QA) não instala o pacote porque ele nunca foi declarado.

## Como reproduzir

```bash
git worktree add ../qa-pr12 feat/correcao-navegacao-nativa
cd ../qa-pr12 && npm ci
npm run verificar
# error: Unable to resolve path to module 'react-native-get-random-values' — import/no-unresolved
# app/_layout.tsx:1:8
grep -n "react-native-get-random-values" package.json
# nenhuma ocorrência
npm ls react-native-get-random-values
# (empty)
```

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`CLAUDE.md`, tabela de Comandos: `npm run verificar` deve rodar limpo e é o gate obrigatório "antes de qualquer merge". Toda dependência importada em código de produção precisa estar declarada em `package.json` — caso contrário, um `npm ci` limpo (o único jeito confiável de reproduzir o ambiente de CI/outro colaborador) quebra a build, mesmo que funcione na máquina de quem escreveu o código (porque o pacote pode ter sido instalado manualmente em algum momento e nunca commitado no `package.json`).

## Observado (saída real, caminho:linha)

```
/home/devdaniel/repos/qa-pr12/app/_layout.tsx
  1:8  error  Unable to resolve path to module 'react-native-get-random-values'  import/no-unresolved
✖ 1 problem (1 error, 0 warnings)
```
`npm run verificar` retorna exit code 1 nesta PR isolada.

**Nota de rastreamento**: a confirmar nas PRs seguintes (13) se esse import ainda existe e se o pacote foi adicionado depois, ou se o problema persiste até o topo da cadeia — o baseline da F1 (topo) não reportou esse erro, então algo entre a PR 12 e a 13 resolve, ou o import foi removido, ou o pacote foi declarado. Atualizar este achado ao confirmar.

## Change sugerida (slug proposto, escopo de uma frase)

`declarar-dependencia-get-random-values` — adicionar `react-native-get-random-values` ao `package.json` (`dependencies`) com a versão realmente usada, ou remover o import de `app/_layout.tsx` se o polyfill não for mais necessário (confirmar se a geração de UUID v7 do domínio ainda depende dele em runtime real, não só em testes Jest onde Node já tem `crypto.getRandomValues` nativo).
