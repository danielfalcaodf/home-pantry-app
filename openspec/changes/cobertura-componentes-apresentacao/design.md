## Context

A auditoria F3 (`qa/achados/ACHADO-016`, `018`, `019`, `022`, `023`, `024`, `025`, `026`, `027`, `028`, `043`) mapeou onze pontos de `src/presentation/` e `src/application/tema/` sem teste próprio, todos cobrindo comportamento já especificado. Esta change é puramente de teste — nenhum arquivo de produção muda, exceto onde um teste exigir um ajuste mínimo de testabilidade (ex.: expor um mock já usado em outros arquivos de teste do projeto). O ponto de partida para os padrões de teste já usados no repositório: `registro-e-desfazer.test.tsx` (RTL, mocks de `expo-haptics` e `react-native-reanimated` já presentes no preset do projeto), `medidor-e-item.test.tsx` (conformidade via `fs.readFileSync` sobre arquivo fonte), `resolver.test.ts` (função pura de tema).

## Goals / Non-Goals

**Goals:**
- Cobrir os onze achados com testes que provem o comportamento contra os cenários já existentes nos specs, incluindo os casos de borda nomeados na "Change sugerida" de cada achado.
- Manter a convenção de teste por camada do CLAUDE.md: `presentation/` usa React Native Testing Library; hooks de `application/` usam repositório fake.
- Reaproveitar mocks e padrões já estabelecidos no repositório (`expo-haptics`, `react-native-reanimated`, `fs.readFileSync` para conformidade de estilo) em vez de introduzir uma nova estratégia de mock por teste.

**Non-Goals:**
- Não alterar nenhum comportamento de `toast.tsx`, `use-preferencia-de-tema.ts`, `theme/movimento.ts`, `formulario-produto.tsx`, `normalizar-busca.ts`, `app/produto/novo.tsx`, `item-despensa.tsx`, `medidor-nivel.tsx`, `stepper-consumo.tsx`, `teclado-quantidade.tsx` ou `cor-do-estado.ts` — só adicionar prova.
- Não introduzir biblioteca de teste nova (nem mock de rede, nem servidor de teste) — tudo já é RTL + Jest + os mocks de Expo já configurados em `jest.setup.app.js`.
- Não expandir o escopo para telas ainda não tocadas por esta lista de achados (ficam nas changes `cobertura-lista-e-compra` e `cobertura-telas-e-navegacao`).

## Decisions

**1. Testes de coreografia do gesto (`ACHADO-026`) e do caminho "Repus" (`ACHADO-027`) ficam em `registro-e-desfazer.test.tsx`, não em arquivo novo.**
O arquivo já mocka `expo-haptics` e já cobre `onUsei`/`onRepus` parcialmente; adicionar os casos que faltam ali evita duplicar o setup de mock de `StepperConsumo`/`TecladoQuantidade`. Alternativa considerada: arquivo `stepper-consumo.test.tsx` dedicado — rejeitada porque o componente já é exercitado dentro do fluxo composto em `registro-e-desfazer.test.tsx`, e um arquivo isolado exigiria duplicar o provider de tema/mocks.

**2. Conformidade de estilo (`ACHADO-025`) estende o `it.each` já existente em `medidor-e-item.test.tsx`, não cria arquivo próprio.**
O mecanismo (`fs.readFileSync` sobre o arquivo fonte, checando ausência de padrões via regex/string) já existe para aritmética de domínio e swipe; adicionar `shadowColor`/`shadowOpacity`/`elevation`/`borderRadius` ao mesmo bloco mantém uma única fonte de verdade sobre "o que a linha da despensa nunca pode conter".

**3. Testes de `formulario-produto.tsx` e da navegação de duplicidade dependem de `alvos-de-toque-e-acessibilidade` (Ordem 06) já estar aplicada.**
Essa change altera alvos de toque e rótulos de acessibilidade em componentes de cadastro; escrever o teste antes fixaria comportamento que está prestes a mudar. Por isso a dependência registrada em `ORDER.md` (change 09 depende de 06) e reafirmada no proposal.

**4. `use-preferencia-de-tema.test.ts` usa repositório fake em memória, no padrão de `application/`, não SQLite real.**
O hook já recebe `repositorio: ConfiguracaoRepository` como parâmetro com valor padrão exatamente para permitir essa substituição (LSP/DIP já aplicados no código); reaproveitar essa porta é o caminho mais direto e é o que o CLAUDE.md prescreve para `application/`.

## Risks / Trade-offs

- **[Risco] Testar `Haptics.impactAsync` antes da resolução do callback de registro pode ser frágil se a implementação mudar de síncrona para assíncrona.** → Mitigação: a asserção verifica que a chamada acontece, não a ordem relativa a microtasks internas; usa o mock já presente no preset de teste do Expo, que é a mesma estratégia usada em outros testes do projeto.
- **[Risco] Teste de conformidade por leitura de arquivo-fonte (`ACHADO-025`) é sensível a refatoração de estilo (ex.: mover estilos para um arquivo `styles.ts` separado).** → Mitigação: mesmo risco já aceito pelo mecanismo existente em `medidor-e-item.test.tsx`; não é introduzido por esta change, só estendido.
- **[Risco] Testar `withTiming`/`DURACAO_FADE` sob redução de movimento (`ACHADO-019`) depende de como o preset de teste do Reanimated expõe `ReduceMotion.System`.** → Mitigação: usar o mesmo mock de `react-native-reanimated` já usado em `registro-e-desfazer.test.tsx`, simulando a preferência do sistema em vez de tentar mockar `AccessibilityInfo` diretamente.
