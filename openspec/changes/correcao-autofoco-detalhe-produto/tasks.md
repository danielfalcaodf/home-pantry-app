## 1. Correção

- [ ] 1.1 Adicionar prop `autofocarNome` (default `false`) ao `FormularioProduto`; só `app/produto/novo.tsx` passa `true`.
- [ ] 1.2 Confirmar que `app/produto/[id].tsx` monta o formulário sem autofoco e sem invocar teclado na abertura.
- [ ] 1.3 Interceptar o Voltar (hardware/gesto) no detalhe quando o teclado está visível: fechar o teclado e consumir o evento; sem teclado, navegação normal.

## 2. Prova do cenário do bug

- [ ] 2.1 Teste RTL do detalhe: renderizar `app/produto/[id].tsx` e asserir que nenhum campo tem foco (`autoFocus` ausente/`isFocused()` falso) — cenário exato do ACHADO-056.
- [ ] 2.2 Teste RTL do Voltar: com mock de `Keyboard` (visível) e `BackHandler`, asserir que o handler chama `Keyboard.dismiss()` e NÃO chama `router.back()`; com teclado fechado, `router.back()` é chamado.

## 3. Casos de borda do mesmo contexto

- [ ] 3.1 Teste do cadastro novo: `app/produto/novo.tsx` mantém o autofoco no campo de nome (sem regressão).
- [ ] 3.2 Teste de "Usei"/"Repus" tocáveis imediatamente após a montagem do detalhe (botões presentes e habilitados, sem esperar teclado).
- [ ] 3.3 Teste de foco manual: usuário toca no campo de nome do detalhe → campo foca normalmente (a correção remove só o foco automático, não a editabilidade).
- [ ] 3.4 Atualizar/estender o flow Maestro `editar-produto.yaml` (ou criar cenário novo) verificando no app real: abrir detalhe → teclado não aparece → "Usei" responde ao primeiro toque.

## 4. Gate de qualidade

- [ ] 4.1 Rodar `npm test` e `npm run verificar` — tudo verde.
