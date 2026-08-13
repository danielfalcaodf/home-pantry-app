## 1. Gerenciador de pacotes único (ACHADO-003)

- [x] 1.1 Confirmar que `pnpm-lock.yaml` e `pnpm-workspace.yaml` continuam untracked e sem referência em nenhum commit (`git log --all -- pnpm-lock.yaml pnpm-workspace.yaml`).
- [x] 1.2 Remover os dois arquivos da raiz do repositório.
- [x] 1.3 Adicionar `pnpm-lock.yaml`, `pnpm-workspace.yaml` (e `.pnpm-store/` se existir) ao `.gitignore`.
- [x] 1.4 Rodar `npm install` e confirmar que o projeto continua instalando e rodando normalmente.

## 2. Regras de fronteira comprovadas por teste (ACHADO-008)

- [x] 2.1 Criar teste que roda `ESLint.lintText` (API programática) sobre uma fixture inline representando um arquivo de `src/domain/` que importa `react`.
- [x] 2.2 Adicionar fixture/caso para `application/` importando de `infrastructure/`.
- [x] 2.3 Adicionar fixture/caso para `presentation/`/`app/` importando o cliente de banco ou o schema de persistência.
- [x] 2.4 Adicionar fixture/caso para hex literal em componente de `presentation/components/`.
- [x] 2.5 Confirmar que cada fixture produz pelo menos um erro do ESLint, e que uma fixture conforme (sem violação) não produz erro nenhum (caso de controle negativo).

## 3. Testes de tipo — conjuntos fechados (ACHADO-009, 010, 015)

- [x] 3.1 `Result<T,E>`: teste com `@ts-expect-error` acessando `.valor`/`.erro` de um `Result` sem discriminar por `.ok` antes.
- [x] 3.2 `Unidade`: teste com `@ts-expect-error` atribuindo uma string fora do conjunto fechado (ex. `'tonelada'`) a uma variável tipada `Unidade`.
- [x] 3.3 `Texto` (papel tipográfico): teste com `@ts-expect-error` passando um papel fora da escala ao componente `Texto`.
- [x] 3.4 `Theme`: teste com `@ts-expect-error` acessando uma chave de token inexistente.
- [x] 3.5 Rodar `npm run typecheck` e confirmar que os quatro testes de tipo são verificados (falham a build se a rejeição parar de acontecer) sem introduzir nenhum erro real de tipo no projeto.

## 4. Enforcement da escala de espaçamento (ACHADO-020)

- [x] 4.1 Registrar a decisão (já em `design.md`): teste de conformidade por varredura de `src/presentation/components/`, não regra de lint customizada.
- [x] 4.2 Implementar o teste: varre `padding`, `margin`, `gap` literais nos arquivos de componente e falha se algum valor não pertencer a `[4, 8, 12, 16, 24, 32, 48]`.
- [x] 4.3 Rodar o teste contra o código atual e confirmar que passa sem ajuste (ou corrigir qualquer violação real encontrada, registrando o achado se houver).
- [x] 4.4 Confirmar caso de controle negativo: uma fixture com `flex: 1`/`fontSize: 16`/`opacity: 0.5` não é sinalizada como violação.

## 5. Orçamento de fonte medido automaticamente (ACHADO-021)

- [x] 5.1 Registrar a decisão (já em `design.md`): limiar "correto" mantido em 400KB (citado no spec/aviso); teste só falha (vermelho) acima de um limite rígido de regressão mais alto e documentado (ex. 750KB) — evita quebrar `npm test` por uma dívida pré-existente fora do escopo desta change.
- [x] 5.2 Escrever script/teste que soma o tamanho dos arquivos de fonte resolvidos pelos pacotes `@expo-google-fonts/*` efetivamente importados em `fontes.ts`.
- [x] 5.3 O teste sempre registra o valor medido (ex. `console.warn`/mensagem de asserção) comparado aos 400KB do spec, e falha (`expect`) apenas se o valor ultrapassar o limite rígido de regressão definido em 5.1.
- [x] 5.4 Rodar o script contra o estado atual (696KB) e confirmar que ele passa (abaixo do limite rígido) mas emite o aviso de que já está acima do limiar de 400KB do spec — validando que o teste não mascara o estouro nem quebra o gate por uma dívida que esta change não corrige.
- [x] 5.5 Substituir o comentário manual em `fontes.ts:9` por uma referência ao script/teste como fonte de verdade da medição.

## 6. Gate de testes obrigatório

- [x] 6.1 Rodar `npm run verificar` (fronteiras + lint + typecheck) e confirmar código de saída 0.
- [x] 6.2 Rodar `npm test` completo e confirmar 100% verde, incluindo o teste de orçamento de fonte (task 5) passando com aviso, não como falha.
- [x] 6.3 Confirmar que nenhum teste novo desta change fica vermelho por dívida pré-existente que não é escopo de correção aqui (ex. peso de fonte acima de 400KB) — apenas os dois limiares de regressão real (fronteira de lint, tipos fechados, espaçamento) bloqueiam o merge.
