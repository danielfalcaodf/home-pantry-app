## Context

Sete achados de QA (003, 008, 009, 010, 015, 020, 021) apontam a mesma classe de lacuna sob capas diferentes: uma garantia arquitetural ou de produto existe hoje só porque ninguém a violou ainda, não porque um mecanismo automatizado a impede. Regras de fronteira (`eslint.config.js`) estão configuradas mas nunca viram um caso de violação real em teste; tipos fechados (`Result`, `Unidade`, `Texto`, `Theme`) são fechados pela forma do TypeScript, mas nada prova isso além de "não quebrou até agora"; a escala de espaçamento não tem enforcement nenhum, ao contrário da regra de hex que já existe; e o peso de fontes embarcadas (696KB) já ultrapassa o limiar documentado (400KB) sem que nada tenha disparado a decisão que o próprio spec previa. Adicionalmente, dois artefatos `pnpm` (lockfile e workspace) estão untracked na raiz, competindo silenciosamente com o fluxo `npm` documentado em todo o `CLAUDE.md`.

Como o tipo desta change é Bug Fix, a "correção" é fechar cada lacuna com um mecanismo executável — teste que força a violação e confirma a rejeição — e, nos dois pontos que exigem escolha humana (gerenciador de pacotes, limiar de fonte), registrar a decisão antes de codificar o guard-rail.

## Goals / Non-Goals

**Goals:**
- Cada um dos sete achados fechado com teste automatizado, script de medição, ou remoção de artefato conflitante — sem alterar comportamento do app em produção.
- As duas decisões de tooling (pacote e limiar de fonte) registradas explicitamente aqui, com a alternativa descartada e o motivo.
- Todo teste novo roda sob `npm test`/`npm run typecheck`/`npm run lint`, sem exigir emulador nem ferramenta nova além do que o projeto já usa.

**Non-Goals:**
- Não migrar para `pnpm` — a decisão registrada abaixo é manter `npm`.
- Não remover a família de fonte de display por causa do orçamento — a decisão abaixo é sobre o limiar aceito, não uma remoção adicional de peso.
- Não introduzir uma biblioteca de teste de tipos nova (`tsd`, `expect-type`) além do padrão `@ts-expect-error` + `tsc --noEmit` que o projeto já usa para checagem de tipos.
- Não expandir a regra de espaçamento para cobrir toda a árvore de `src/presentation/` além de `components/` — escopo igual ao da regra de hex já existente.

## Decisions

**1. Manter `npm`; remover os artefatos `pnpm` untracked (ACHADO-003).**
Todo `CLAUDE.md`, todos os scripts de `package.json` e os 611+ testes existentes já rodam sob `npm`; não há `package-lock.json` versionado hoje, mas nenhum documento-fonte (`PRD`, `ARQUITETURA`, `DATABASE`, `FRONTEND-DESIGN`) menciona `pnpm`. Migrar para `pnpm` reescreveria toda a documentação de comandos sem ganho identificado. Decisão: apagar `pnpm-lock.yaml` e `pnpm-workspace.yaml`, e adicioná-los ao `.gitignore` (junto de `.pnpm-store/` se aplicável) para que reaparecerem localmente (ex. alguém rodando `pnpm install` sem querer) não vire diff acidental.

**2. Enforcement de espaçamento via teste de conformidade por grep, não regra de lint customizada (ACHADO-020).**
Ao contrário de cor (sempre proibida como literal, então a regra de hex é uma checagem simples de "nenhum `#` em `components/`"), espaçamento tem números legítimos que não são espaçamento (`flex: 1`, `fontSize: 16`, `opacity: 0.5`, `borderWidth: 1`). Uma regra de ESLint customizada precisaria de uma lista de propriedades-alvo (`padding*`, `margin*`, `gap`, `top/right/bottom/left` em posicionamento) e ainda erraria em casos como `borderRadius` (tem escala própria, não a de espaçamento). Decisão: um teste de conformidade (`grep`/regex sobre os arquivos de `src/presentation/components/`, no mesmo espírito do teste de fronteiras) que varre apenas as propriedades de espaçamento conhecidas (`padding`, `margin`, `gap`) e falha se o valor não pertencer à escala `[4, 8, 12, 16, 24, 32, 48]`. Alternativa (regra de lint customizada) fica registrada como possível evolução futura se o teste de conformidade se mostrar frágil.

**3. Limiar de fonte mantido em 400KB; medição vira parte do gate de `npm test` como aviso registrado, não como falha vermelha bloqueante (ACHADO-021).**
O comentário em `fontes.ts:9` já registra 696KB, e o spec (`tipografia-carregada`) já documenta 400KB como o limiar que dispara a decisão de remover a família de display — decisão que já foi tomada uma vez (a família Archivo já foi removida) e o valor atual ainda está acima. Manter 400KB como limiar formal é a decisão correta (não subir o número só porque o estado atual o ultrapassa — isso mascararia o orçamento real), mas o Bug Fix desta change exige terminar com `npm test` 100% verde (task 6), e o estouro de orçamento em si **não é escopo desta change para corrigir** (reduzir peso de fonte é decisão de produto/design separada). Resolução: o teste mede o peso e **registra** o valor (ex. via `console.warn`/anotação de teste) sempre, mas só falha (`expect(...).toBeLessThanOrEqual(...)`) se o valor ultrapassar um segundo limiar mais alto e claramente documentado como "limite rígido de regressão" (ex. 750KB) — impede que o peso cresça mais sem que ninguém perceba, sem bloquear o merge desta change por uma dívida pré-existente que ela não introduziu. O limiar de 400KB permanece como o número "correto" citado no spec e no aviso; o teste vermelho só dispara se o peso regredir ainda mais.
Alternativa considerada: usar 700KB como novo limiar único (o estado atual passaria sem aviso) — rejeitada por mascarar o orçamento real. Alternativa considerada: script falha sempre que ultrapassar 400KB — rejeitada porque quebraria `npm test` permanentemente por uma dívida que esta change não tem escopo de resolver (reduzir peso de fonte), violando o próprio gate que a change precisa deixar verde para ser arquivada.

**4. Testes de tipo (`Result`, `Unidade`, `Texto`, `Theme`) ficam em um único arquivo por concern, próximos ao módulo testado, não um arquivo central de "testes de tipo do projeto".**
`src/shared/result.test-types.ts` (ou nome equivalente ao padrão de teste já usado no arquivo irmão `result.test.ts`), `src/domain/shared/unidade.test-types.ts`, `src/presentation/components/texto.test-types.ts`, `src/presentation/theme/tokens.test-types.ts` — mantém a convenção de "teste ao lado do módulo" já usada no resto do projeto, em vez de introduzir uma pasta `__type-tests__/` central. Cada arquivo só precisa ser incluído no `tsc --noEmit` do projeto (já cobre todo `src/` por padrão) — não precisa rodar sob Jest, já que `@ts-expect-error` é verificado só pelo compilador.

## Risks / Trade-offs

- **[Risco] Remover `pnpm-lock.yaml`/`pnpm-workspace.yaml` pode apagar trabalho de alguém que já começou a migrar para `pnpm` localmente.** → Mitigação: arquivos estão untracked (confirmado em `git status` no início desta change) — nenhum commit os referencia, então não há histórico a perder; a remoção é local, reversível via `pnpm install` se a decisão for revertida no futuro.
- **[Risco] Teste de conformidade de espaçamento por grep pode ter falso positivo em `borderRadius` ou `borderWidth` se a lista de propriedades-alvo for ampla demais, ou falso negativo se um componente usar `StyleSheet.create` com spread/variável em vez de literal.** → Mitigação: escopo explícito só a `padding*`/`margin*`/`gap` (não `border*`), e o teste documenta a limitação de só pegar literais diretos — consistente com o mesmo limite que a regra de hex já aceita hoje.
- **[Risco] `tsc --noEmit` já roda sobre `src/` inteiro; adicionar quatro arquivos de teste de tipo pode aumentar o tempo do `npm run typecheck`, ainda que marginalmente.** → Mitigação: arquivos são pequenos (poucas linhas de `@ts-expect-error`), impacto desprezível comparado ao restante do projeto.
