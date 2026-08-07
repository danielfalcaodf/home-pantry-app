---
id: ACHADO-003
pr: "n/a"
change: bootstrap-projeto-expo
capability: ferramental-de-build
severidade: baixa
fase: F0
estado: aberto
---
## O que quebra

O repositório tem dois gerenciadores de pacotes em uso simultâneo e inconsistente: `pnpm-lock.yaml` e `pnpm-workspace.yaml` estão presentes (hoje untracked) na raiz, mas todos os scripts de `package.json` e o `CLAUDE.md` documentam o fluxo com `npm run` (`npm start`, `npm test`, `npm run verificar`, etc.) e os 611 testes existentes rodam sob `npm`.

## Como reproduzir

```bash
ls pnpm-lock.yaml pnpm-workspace.yaml package.json
cat CLAUDE.md | grep -A1 '| Comando |'
```

Os três arquivos coexistem; não há `package-lock.json` commitado, mas o fluxo documentado assume `npm`.

## Esperado (citar o requisito do spec ou a regra do CLAUDE.md)

`CLAUDE.md`, seção "Comandos": toda a tabela de comandos usa `npm run <script>` / `npm test` / `npm start` como interface oficial do projeto. Não há menção a `pnpm` em nenhum documento-fonte (`PRD`, `ARQUITETURA`, `DATABASE`, `FRONTEND-DESIGN`).

## Observado (saída real, caminho:linha)

- `pnpm-lock.yaml` (raiz, untracked antes desta PR).
- `pnpm-workspace.yaml` (raiz, untracked antes desta PR).
- `package.json:6-16` — todos os scripts (`start`, `test`, `test:domain`, `test:cov`, `typecheck`, `lint`, `verificar:fronteiras`, `verificar`) chamados via `npm run`/`npm test`.

## Change sugerida (slug proposto, escopo de uma frase)

`decidir-gerenciador-de-pacotes` — decidir entre manter `npm` (e remover os artefatos pnpm untracked) ou migrar formalmente para `pnpm` (regerando lockfile e atualizando `CLAUDE.md`/scripts), evitando que o próximo colaborador rode `npm install` e `pnpm install` alternadamente sobre o mesmo `node_modules`.
