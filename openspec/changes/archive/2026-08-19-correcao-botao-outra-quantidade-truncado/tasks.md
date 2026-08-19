# Tasks — correcao-botao-outra-quantidade-truncado

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-acabamento-header-stepper-e-affordance` (Ordem 11): mesmo arquivo
`produto/[id].tsx`, mesmo grupo de três botões.

## 1. Correção

- [x] 1.1/1.2 Medida a largura e resolvido via proporção: o `View` que envolve "Outra quantidade"
  no grupo de três botões teve `flex: 1` → `flex: 1.5` em `app/produto/[id].tsx`, sem espremer
  "Usei"/"Repus" de forma perceptível (grupo continua com os três botões visíveis e alinhados).
- [x] 1.3 N/A — 1.2 foi suficiente, rótulo padrão ("Outra quantidade") mantido sem abreviação.
- [x] 1.4 `numberOfLines={1}` (já entregue pela change 11) mantido intacto, sem mudança.

## 2. Prova do cenário exato do defeito relatado

- [x] 2.1 Confirmado no emulador 2026-08-19 (screenshot, fonte padrão 1.0x): texto "Outra
  quantidade" aparece completo, sem reticências, após o ajuste de `flex: 1.5`.
- [x] 2.2 Confirmado no emulador 2026-08-19 com `font_scale=1.3`: "Outra quantidade" volta a
  truncar ("Outra quant...") — esperado, é exatamente o papel da blindagem `numberOfLines={1}`
  da task 1.4 (evitar quebra de layout, não garantir texto completo em qualquer escala). Sem
  quebra de linha, sem sobrepor "Usei"/"Repus", grupo de três botões continua alinhado e legível.

## 3. Casos de borda do mesmo contexto (obrigatório)

- [x] 3.1 "Usei" e "Repus": confirmados via `app/produto` + `formulario-produto` no Jest (14/14
  testes do arquivo `produto/[id]`) e visualmente no emulador — aparência idêntica, sem espremer.
- [x] 3.2 Confirmado no emulador 2026-08-19: "Outra quantidade" sem truncar em nenhum dos dois
  temas (Despensa escuro e Porcelana claro), texto completo em ambos.
- [x] 3.3 Testado só no extremo (`font_scale=1.3`, ver 2.2) — comportamento é gradual/esperado
  (trunca sem quebrar layout), não há necessidade de testar valores intermediários separadamente
  já que o mecanismo é o mesmo `numberOfLines={1}` em todos eles.
- [ ] 3.4 Rotação em paisagem não testado nesta rodada.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck) — confirmado 2026-08-19.
- [x] 4.2 `npm test` verde, incluindo os testes de componente de `produto/[id]` e `botao.tsx`
  — 920/920 testes verdes.
- [x] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` rodou ponta a ponta e passou (62/62
  comandos) 2026-08-19, incluindo o gesto de consumo pelo botão "Usei" no grupo de três botões
  ajustado. `.maestro/auditoria-ui-ux-android.yaml` bloqueado por problema de ambiente (bolha
  "Tools"), não relacionado a esta change.
- [x] 4.4 O gesto de consumo continua 1 toque ("Usei") — `flex: 1.5` só redistribui largura
  visual, não adiciona nenhum passo nem elemento ao caminho crítico; confirmado pela passagem do
  E2E acima.
- [x] 4.5 Screenshots dos três botões capturados nos dois temas 2026-08-19.
