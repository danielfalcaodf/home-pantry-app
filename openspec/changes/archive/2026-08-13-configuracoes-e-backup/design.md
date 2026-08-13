## Context

`app/(tabs)/configuracoes.tsx` reúne tema, backup, restauração, exportação de dados e acesso ao Diagnóstico. O fluxo de restauração é conduzido pelo hook `useRestaurarBackup`, cujo `estado.fase` transita entre `confirmando` → `concluido`/`erro`; quando `concluido` com `divergencias.length > 0`, a tela hoje exibe um `Toast` só informativo (`configuracoes.tsx:191-199`): "Backup restaurado — N produto(s) com divergência." O componente `Toast` (`src/presentation/components/toast.tsx`) já suporta uma prop `acao?: { titulo: string; onPress: () => void }`, renderizando um botão de texto ao lado da mensagem — não usada neste toast hoje. A correção da divergência em si já existe e está testada em `use-diagnostico.ts`/`use-diagnostico.test.ts`, acessível pela tela `/diagnostico` (já roteada e alcançável também pela seção "Diagnóstico" da própria tela de Configurações).

O QA (ACHADO-039, 038, 040) achou um bug médio de UX (encadeamento incompleto pós-restauração) e duas lacunas de teste (tela de Configurações sem teste de composição, adaptador real de sistema de arquivos sem teste). `ORDER.md` registra esta change como dependente da `alvos-de-toque-e-acessibilidade` (Ordem 06), que também toca `configuracoes.tsx`.

## Goals / Non-Goals

**Goals:**
- Fechar o encadeamento restaurar → divergência informada → correção acessível, usando a ação já suportada pelo `Toast` existente.
- Cobrir a composição da tela de Configurações com teste (agrupamento de ações, distinção da ação destrutiva, exportação sem confirmação).
- Cobrir o adaptador real `ExpoSistemaDeArquivos` com testes que mockam as APIs Expo, não só o dublê de teste usado pelos hooks.

**Non-Goals:**
- Não mudar a tela de Diagnóstico em si — ela já cobre a correção de divergências (`use-diagnostico`).
- Não introduzir navegação automática (redirecionamento sem toque do usuário) para `/diagnostico` — o spec de `restauracao-de-backup` pede que o app "ofereça corrigir", uma ação disponível, não um redirecionamento forçado que tiraria o usuário do fluxo sem escolha.
- Não alterar `use-restaurar-backup.ts` nem a lógica de reconciliação/transação — só a camada de apresentação do resultado.

## Decisions

**1. Ação do toast usa a prop `acao` já existente em `Toast`, não um componente novo.**
`app/(tabs)/configuracoes.tsx` passa `acao={{ titulo: 'Corrigir', onPress: () => router.push('/diagnostico') }}` só no ramo com divergências; o toast sem divergência continua sem `acao`. Alternativa considerada: navegar automaticamente para `/diagnostico` assim que a divergência é detectada — rejeitada por tirar o controle do usuário sobre o momento da navegação (ele pode estar no meio de outra tarefa) e por não ser o que o spec pede ("oferece corrigir", não "leva a corrigir").

**2. Teste de composição da tela usa hooks mockados, não o SQLite real.**
Seguindo a convenção de `application/` (repositório fake) já usada pelos próprios hooks (`use-exportar-backup`, `use-restaurar-backup`, `use-ultimo-backup`), o teste de `configuracoes.tsx` mocka esses hooks diretamente (retornando estados fixos) em vez de montar um banco de teste — o objetivo é verificar a composição visual/estrutural da tela (agrupamento, distinção da ação destrutiva, ausência de diálogo no export), não a lógica de negócio, já coberta nos testes dos próprios hooks.

**3. Teste do adaptador real mocka os módulos Expo no nível do módulo (`jest.mock`), não integra com o dispositivo.**
`expo-sharing`, `expo-document-picker` e as classes `File`/`Directory`/`Paths` de `expo-file-system` são mockados via `jest.mock`, verificando que `ExpoSistemaDeArquivos` chama as APIs certas com os argumentos certos (ex.: `Sharing.shareAsync` com o `uri` e `mimeType` corretos, `DocumentPicker.getDocumentAsync` retornando `null` quando `canceled`). Isso é consistente com `infrastructure/`: Jest com dependências externas mockadas, sem exigir dispositivo/emulador.

## Risks / Trade-offs

- **[Risco] A ação "Corrigir" no toast desaparece com o toast (5s de `DURACAO_TOAST`) antes do usuário perceber a divergência.** → Mitigação: fora de escopo desta change (duração do toast é um padrão de UI compartilhado por todo o app, não específico deste fluxo); a tela de Configurações já tem a seção "Diagnóstico" sempre visível como caminho alternativo, então a divergência não fica sem rota de correção mesmo se o toast expirar.
- **[Risco] Testar `ExpoSistemaDeArquivos` com mocks de módulo pode divergir do comportamento real das APIs Expo se a API mudar em uma atualização de SDK.** → Mitigação: aceito como trade-off padrão de teste de infraestrutura (mesmo já assumido por `sqlite-*.repository.test.ts` com SQLite em memória em vez de dispositivo real); não há alternativa sem depender de emulador.
