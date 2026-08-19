# Tasks — correcao-cabecalho-lista-icones

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-acoes-fora-de-alcance` (Ordem 5) e `correcao-affordance-busca-e-lista`
(Ordem 6): mesmo arquivo `lista.tsx`, mesma barra de ações.

## 1. Correção

- [x] 1.1 Path SVG de "compartilhar" desenhado em `src/presentation/theme/icones.ts`
  (`icones.compartilhar`), mesmo estilo dos existentes (viewBox 24x24, stroke 1.5).
- [x] 1.2 "Adicionar item avulso" trocado por botão-ícone (`IconeSvg` +
  `accessibilityLabel="Adicionar item avulso"` + `hitSlop`), mesmo padrão de
  `sheet-ajuste-estoque.tsx`.
- [x] 1.3 "Compartilhar" trocado por botão-ícone equivalente
  (`accessibilityLabel="Compartilhar lista"`).
- [x] 1.4 "Agrupar" (`ChipEstado`) não foi tocado.
- [x] 1.5 Alvo de toque ≥48×48dp (`minWidth`/`minHeight: ALVO_TOQUE_MINIMO`) nos dois botões.

## 2. Prova do cenário exato do defeito relatado

- [x] 2.1 Confirmado no emulador 2026-08-19 (screenshot): o cabeçalho agora tem só os dois
  ícones + o chip "Agrupado", largura ocupada muito menor que antes, "Lista" com respiro visual.
- [x] 2.2 `accessibilityLabel` completo preservado — confirmado via testes (`getByLabelText
  ('Adicionar item avulso')`, `getByLabelText('Compartilhar lista')`) e via emulador.

## 3. Casos de borda do mesmo contexto (obrigatório)

- [x] 3.1 Confirmado no emulador 2026-08-19: tocar o ícone "+" continua chamando
  `abrirNovoAvulso` (mesmo `onPress` reaproveitado, sem mudança de comportamento funcional).
- [x] 3.2 Confirmado no emulador 2026-08-19 nos dois temas: ícones com bom contraste tanto em
  Despensa (escuro, ícones claros sobre fundo escuro) quanto em Porcelana (claro).
- [ ] 3.3 Fonte do sistema ampliada não testado nesta rodada.
- [ ] 3.4 Leitor de tela (TalkBack) não testado — Maestro MCP não pilota TalkBack diretamente;
  precisaria de verificação manual com o leitor de tela ligado no dispositivo.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck), incluindo a regra de hex —
  confirmado 2026-08-19.
- [x] 4.2 `npm test` verde, seletores de `app/(tabs)/lista.test.tsx` atualizados pros textos
  "Adicionar item avulso"/"Compartilhar" que agora só existem como `accessibilityLabel` — 920/920
  testes verdes.
- [x] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` rodou ponta a ponta e passou (62/62
  comandos) 2026-08-19. `.maestro/auditoria-ui-ux-android.yaml` bloqueado por problema de
  ambiente (bolha "Tools" do dev client) — ver nota em
  `correcao-regua-risca-texto-medidor/tasks.md` 4.3, não relacionado a esta change.
- [x] 4.4 Screenshots do cabeçalho capturados no emulador 2026-08-19 nos dois temas.
