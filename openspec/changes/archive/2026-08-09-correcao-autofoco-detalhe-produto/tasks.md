## 1. Correção

- [x] 1.1 Adicionar prop `autofocarNome` (default `false`) ao `FormularioProduto`; só `app/produto/novo.tsx` passa `true`.
- [x] 1.2 Confirmar que `app/produto/[id].tsx` monta o formulário sem autofoco e sem invocar teclado na abertura.
- [x] 1.3 Interceptar o Voltar (hardware/gesto) no detalhe quando o teclado está visível: fechar o teclado e consumir o evento; sem teclado, navegação normal.

## 2. Prova do cenário do bug

- [x] 2.1 Teste RTL do detalhe: renderizar `app/produto/[id].tsx` e asserir que nenhum campo tem foco (`autoFocus` ausente/`isFocused()` falso) — cenário exato do ACHADO-056. Provado na raiz: `formulario-produto.autofoco.test.tsx` — default sem `autoFocus` (é como o detalhe monta) — e confirmado no app real pelo flow Maestro.
- [x] 2.2 Teste RTL do Voltar: com mock de `Keyboard` (visível) e `BackHandler`, asserir que o handler chama `Keyboard.dismiss()` e NÃO chama `router.back()`; com teclado fechado, `router.back()` é chamado. Implementado como hook `use-voltar-fecha-teclado` com teste próprio (consome o evento e chama `Keyboard.dismiss()` só com teclado visível).

## 3. Casos de borda do mesmo contexto

- [x] 3.1 Teste do cadastro novo: `app/produto/novo.tsx` mantém o autofoco no campo de nome (sem regressão).
- [x] 3.2 Teste de "Usei"/"Repus" tocáveis imediatamente após a montagem do detalhe (botões presentes e habilitados, sem esperar teclado). Provado no app real: flow Maestro toca "Repus" imediatamente após abrir o detalhe e o "Desfazer" aparece.
- [x] 3.3 Teste de foco manual: usuário toca no campo de nome do detalhe → campo foca normalmente (a correção remove só o foco automático, não a editabilidade).
- [x] 3.4 Atualizar/estender o flow Maestro `editar-produto.yaml` (ou criar cenário novo) verificando no app real: abrir detalhe → teclado não aparece → "Usei" responde ao primeiro toque. Flow atualizado (remove o workaround `hideKeyboard` pós-abertura, prova o primeiro toque em "Repus" com desfazer) e executado verde no emulator-5554.

## 4. Gate de qualidade

- [x] 4.1 Rodar `npm test` e `npm run verificar` — tudo verde. 67 suites / 620 testes verdes; `verificar` limpo.
