## Context

O `FormularioProduto` é compartilhado entre o cadastro de produto novo (`app/produto/novo.tsx`) e o detalhe (`app/produto/[id].tsx`). O autofoco do campo de nome é desejável no cadastro (digitar o nome é a primeira ação) e nocivo no detalhe (a primeira ação é "Usei"/"Repus", e o teclado cobre exatamente esses botões). Além disso, no Android, o Voltar com teclado aberto está saindo da tela em vez de fechar o teclado.

## Goals / Non-Goals

**Goals:**
- Detalhe abre sem teclado, com "Usei"/"Repus" imediatamente tocáveis (KPI K4).
- Voltar com teclado aberto fecha o teclado, não a tela.

**Non-Goals:**
- Redesenhar o formulário ou o detalhe.
- Mudar o comportamento do cadastro de produto novo.

## Decisions

- **Prop explícita no `FormularioProduto`** (ex.: `autofocarNome: boolean`, default `false`): o chamador declara a intenção; `novo.tsx` passa `true`, o detalhe não passa nada. Alternativa rejeitada: detectar contexto dentro do componente (acoplaria o componente à rota).
- **Voltar fecha teclado primeiro**: interceptar o hardware back quando o teclado está visível (`Keyboard.isVisible()`/listener de `keyboardDidShow`) e chamar `Keyboard.dismiss()` consumindo o evento; caso contrário, comportamento padrão. Implementar na tela de detalhe (é onde o bug morde), avaliando extrair para hook reutilizável só se outra tela precisar — sem abstração por antecipação.
- O comportamento nativo `android:windowSoftInputMode=adjustResize` não muda — o problema não é o resize, é o foco roubado e a ordem do back.

## Risks / Trade-offs

- [Interceptar o back pode conflitar com o aviso de saída de outras telas] → o handler é local à tela de detalhe e só consome o evento quando o teclado está visível.
- [Teste de teclado em Jest é limitado] → testar via mock de `Keyboard`/`BackHandler` no RTL; a verificação de runtime real fica para o fluxo E2E Maestro já existente da campanha de QA.
