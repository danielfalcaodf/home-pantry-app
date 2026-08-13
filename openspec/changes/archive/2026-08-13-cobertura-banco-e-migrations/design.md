## Context

A auditoria de QA (`qa/achados/`) encontrou sete lacunas na camada de banco/migrations, todas em código já implementado e correto — nenhuma delas é um bug de comportamento observável hoje. O risco é regressão silenciosa: qualquer alteração futura em `client.ts`, `backup-pre-migration.ts`, `observador.ts`, `migrations/`, ou no fluxo de abertura do app, pode quebrar uma dessas garantias sem que `npm test` acuse nada, porque nada as exercita hoje. Como o tipo desta change é Bug Fix (a "correção" é a cobertura em si), o fluxo é: escrever o teste que prova o comportamento correto atual, rodá-lo, e cobrir bordas do mesmo contexto — sem alterar comportamento de produção, exceto nos dois pontos triviais de limpeza (import morto) e alinhamento de código (ACHADO-014, se confirmado).

## Goals / Non-Goals

**Goals:**
- Cobrir os sete achados (004, 005, 011, 012, 013, 014, 044) com teste automatizado ou correção trivial, sem alterar comportamento observável do app (exceto ACHADO-005 e, condicionalmente, ACHADO-014).
- Todo teste novo roda sob o gate padrão do projeto: `infrastructure/` com Jest + SQLite em memória, `app/`/`src/composicao/` com RTL.
- Resolver a ambiguidade de ACHADO-014 com uma decisão explícita, documentada no spec de `repositorios`.

**Non-Goals:**
- Não implementar cobertura de UI, telas ou Maestro E2E — fora do escopo de banco/migrations (fase QA correspondente já tratada por outras changes na ORDEM).
- Não alterar o schema, criar migration nova, ou mudar qualquer PRAGMA — a change só prova o que já existe.
- Não revisitar o mecanismo de backup em si (formato, local do arquivo) além de testar o comportamento já implementado.

## Decisions

**1. ACHADO-014 é confirmado como divergência de prática de código, não de SQL literal — `listarDespensa` é alinhada a `listarFaltantes`.**
O Drizzle sempre nomeia colunas no SQL gerado, mesmo com `.select()` vazio (conhece o schema), então a leitura "o SQL não usa `SELECT *`" já é satisfeita por construção e seria um falso positivo. Mas a leitura "a camada de repositório declara explicitamente quais colunas traz para a aplicação" é uma prática real de código já seguida por `listarFaltantes` (linha 181) e quebrada por `listarDespensa` (linha 158-160) na mesma classe — inconsistência sem motivo técnico. Decisão: alinhar `listarDespensa` a `.select({...})` explícito, nomeando cada coluna, e o spec de `repositorios` é esclarecido para deixar essa leitura inequívoca (evita a mesma ambiguidade se o cenário for lido de novo no futuro). Alternativa considerada: deixar como está e só esclarecer o texto do spec sem tocar o código — rejeitada porque a inconsistência entre dois métodos da mesma classe, sem justificativa, é exatamente o tipo de coisa que o próprio requisito quer evitar.

**2. Teste de "versão intermediária" (ACHADO-013) é parametrizado por migration, não um teste único fixo.**
Hoje existem 4 migrations; o teste deve cobrir, para cada N de 1 a 3 (o número de migrations menos uma), aplicar `0..N-1`, inserir dados, aplicar o restante, e comparar schema. Um `test.each`/loop sobre o array de migrations conhecidas evita que o teste fique desatualizado silenciosamente à medida que novas migrations são adicionadas (ele automaticamente ganha mais casos).

**3. Teste RTL de `usePrepararBanco` mocka `useMigrations` do `drizzle-orm/expo-sqlite/migrator`, não sobe SQLite real.**
Alinhado ao precedente do próprio ACHADO-012 e à convenção de `application`/`app` (RTL com dependência fake/mockada) — testar a árvore de decisão de renderização (rota normal vs. `TelaErro`) não precisa de um banco real, só de controlar o retorno do hook.

**4. Teste de "reconciliar não escreve" usa contagem de linhas, não mock de método de escrita.**
Contar `SELECT COUNT(*)` de `movimento_estoque` e `produto` antes/depois é uma prova mais forte e mais simples de manter do que espiar (`spy`) os métodos de escrita do driver — não depende de conhecer a API interna do SQLite/Drizzle usada internamente, só do estado observável do banco.

## Risks / Trade-offs

- **[Risco] Alinhar `listarDespensa` a `.select({...})` explícito pode divergir sutilmente das colunas hoje trazidas pelo `.select()` genérico se alguma coluna nova foi adicionada ao schema e não é usada pelo restante do código.** → Mitigação: task dedicada para comparar campo a campo com o uso atual de `listarDespensa` nos chamadores antes de restringir as colunas, e teste que cobre o retorno completo esperado.
- **[Risco] Teste de versão intermediária pode ficar caro (roda migrations reais em SQLite em memória várias vezes) e alongar `npm run test:domain`/`npm test`.** → Mitigação: infraestrutura já usa SQLite em memória (rápido); o teste fica no projeto Jest `app`/infra, não no de domínio (que precisa continuar em segundos), e o número de migrations no MVP é pequeno.
- **[Risco] Mock de `useMigrations` no teste RTL pode divergir da assinatura real do hook do Drizzle se a lib for atualizada.** → Mitigação: tipar o mock contra a assinatura importada do pacote (não um objeto solto), para que o teste quebre em `tsc --noEmit` se a assinatura mudar.
