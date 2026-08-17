# Correção de nomes, estados e papéis tipográficos acessíveis

**Type:** Correção de Bug

## Why

Três defeitos em que a informação existe mas não chega a quem depende dela: um estado que o
leitor de tela não recebe, um nome ambíguo que confunde a navegação por voz, e um papel
tipográfico aplicado ao conteúdo errado, que torna a frase mais importante da tela a mais
difícil de ler.

O A-15 é o mais grave e foi descoberto por acidente: uma automação de teste falhou ao procurar
um `accessibilityLabel` que existe no código e não existe na árvore de acessibilidade do
Android. Se a automação não vê, o TalkBack também não.

## What Changes

- **A-15 — o checkbox do Modo Compra é invisível para o leitor de tela.**
  `src/presentation/components/item-compra.tsx:61-64` declara, num `View` interno,
  `accessibilityRole="checkbox"`, `accessibilityState={{ checked: item.comprado }}` e
  `accessibilityLabel={"Marcar|Desmarcar <nome>"}`. **Nada disso chega na árvore.** Comprovado
  por `inspect_screen`:

  ```
  a11y: "Item Roteiro Feliz QA, 1 un, sem preço"   ← ViewGroup da linha, clickable
    └── rid: "marcacao-quadrado"                    ← sem a11y, sem role, sem state
  ```

  Causa: o `Pressable` externo (`:49-59`) não tem rótulo próprio, então o RN **colapsa a
  subárvore** e sintetiza o `content-desc` concatenando os textos filhos. O rótulo do `View`
  interno é descartado junto com o `role` e o `checked`.

  Para quem usa TalkBack: a linha é anunciada como texto, sem papel de caixa de seleção, e
  **não existe estado marcado/desmarcado anunciável**. O único sinal do "comprado" que
  sobrevive é o caractere `✓` colado no começo do rótulo sintetizado — porque o
  `<Texto>✓</Texto>` de `:87` é um nó de texto real. Um glifo decorativo virou o canal de
  estado. Os outros dois canais (tachado e tom secundário) funcionam para quem enxerga; para
  quem não enxerga, os três canais viraram zero mais um acidente tipográfico.

- **A-11 — frases inteiras renderizadas no papel `caption`, que é CAIXA ALTA.**
  `src/presentation/theme/tipografia.ts:71-78` define `caption` como micro-rótulo: 11pt,
  `letterSpacing` +4%, `textTransform: 'uppercase'`. Correto para etiqueta curta. Mas
  `app/(tabs)/configuracoes.tsx` passa **frases completas com pontuação** por esse papel:

  - `:104` → "VOCÊ AINDA NÃO FEZ BACKUP."
  - `:116` → "SUBSTITUI OS DADOS EXISTENTES PELOS DESTE BACKUP. NÃO PODE SER DESFEITO."
  - `:129` → "UMA PLANILHA COM O QUE ESTÁ NA DESPENSA HOJE — NÃO É UMA CÓPIA DE SEGURANÇA."

  Prosa em caixa alta a 11pt some com as ascendentes e descendentes que o olho usa para
  reconhecer palavra. Fica invertido: os rótulos de seção ("Tema", "Seus dados", "Diagnóstico")
  vêm em caixa normal, e o texto corrido vem gritando. Pior, a frase mais importante da tela —
  o aviso de que restaurar backup não pode ser desfeito — é uma das gritadas, contra a regra do
  projeto de que a UI fala em convites, não em avisos secos. Não é o token que está errado: é
  o papel aplicado ao conteúdo errado.

- **A-12 — dois nós chamados "Despensa" na tela de Configurações.** A tela tem um rótulo de
  seção "Despensa" (acima de "Conferência da despensa") e, ao mesmo tempo, a aba "Despensa" da
  tab bar. Para quem usa leitor de tela são dois nós com o mesmo nome e significados diferentes
  na mesma tela. Foi o que fez `tapOn: "Despensa"` acertar o rótulo em vez da aba durante a
  auditoria — se confunde a automação, confunde o TalkBack.

## Capabilities

### Modified Capabilities

- `componentes-base`: o requisito "Componente de texto tipografado" passa a exigir que o papel
  seja compatível com o tipo de conteúdo — papel de micro-rótulo em caixa alta não pode receber
  prosa. E ganha requisito de que atributos de acessibilidade precisam chegar à árvore, não
  apenas existir no código.
- `modo-compra`: o requisito "Marcação item a item" passa a exigir que o estado marcado seja
  anunciável ao leitor de tela, com papel de caixa de seleção.
- `tela-de-configuracoes`: o requisito "Ações destrutivas sinalizadas" passa a exigir que o
  aviso da ação destrutiva seja legível, e o requisito de acessibilidade da tela passa a
  proibir nomes acessíveis ambíguos.

## Impact

- **Código**: `src/presentation/components/item-compra.tsx:49-91`,
  `app/(tabs)/configuracoes.tsx:104,116,129` e o rótulo de seção "Despensa" da mesma tela.
- **Dependências**: nenhuma nova.
- **Camadas**: só `presentation/` e `app/`. `tipografia.ts` **não** muda — o token está certo.
- **Ferramental**: a lição do A-15 já virou regra de trabalho — rótulo acessível se confirma no
  `inspect_screen`, nunca só no código-fonte. Os dois flows Maestro já foram corrigidos para
  usar os rótulos que de fato existem.

### Dependências entre changes

Depende de `correcao-agrupamento-modo-compra` (Ordem 7) por sobreposição de arquivo: as duas
tocam `item-compra.tsx` — a 7 na composição da lista, esta nos atributos de acessibilidade da
linha. Não são as mesmas linhas, mas as duas dependem do mesmo flow Maestro do Modo Compra como
gate de regressão, e não devem rodar em paralelo.
