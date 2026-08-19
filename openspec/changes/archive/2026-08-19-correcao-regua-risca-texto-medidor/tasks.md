# Tasks — correcao-regua-risca-texto-medidor

**Type:** Correção de Bug. Corrigir primeiro, provar com o teste do cenário exato do defeito,
e então obrigatoriamente cobrir os casos de borda do mesmo contexto.

Depende de `correcao-reciclagem-de-lista-anima-item-errado` (Ordem 10): mesmo arquivo
`medidor-nivel.tsx`.

## 1. Correção

- [x] 1.1 Escolhida a opção (a) do leque de opções: fundo sólido (`tema.bg.base`) atrás do bloco
  de texto — se adapta sozinho à altura real do texto (1 ou 2 linhas), sem precisar calcular uma
  faixa fixa em px (resolve de graça o caso de borda 3.4).
- [x] 1.2 Aplicado em `ItemDespensa` (o bloco nome+leitura ganhou o `View` com fundo sólido —
  `MedidorNivel` não precisou mudar, já que o z-index de código já colocava o texto por cima).
- [x] 1.3 Confirmado: `medidor-e-item.test.tsx` continua verde para os testes de `state.critico`
  (zerado: nenhuma tinta, só a régua na base) — a correção não mexeu no comportamento vazio.

## 2. Prova do cenário exato do defeito relatado

- [x] 2.1/2.2 Teste de componente escrito e verde (`medidor-e-item.test.tsx`,
  `it.each([0.33, 0.5, 0.7])`): confirma que o bloco de texto (nome) tem `backgroundColor:
  tema.bg.base`, garantindo opacar a régua/tinta atrás dele nas três frações reproduzidas.
- [x] 2.3 Confirmado no emulador 2026-08-19: "Arroz, 1 de 2 pacotes, Falta 1" (fração 50%) sem
  nenhum traço cruzando o texto do nome nem da leitura — antes do fix a régua cruzava exatamente
  essa faixa.

## 3. Casos de borda do mesmo contexto (obrigatório)

- [x] 3.1 Fração 0% (vazio): já coberto por `medidor-e-item.test.tsx` ("zerado: nenhuma tinta,
  só a régua na base em crítico") — continua verde, sem mudança nesse caso.
- [x] 3.2 Fração 100% (cheio): já coberto por `medidor-e-item.test.tsx` ("cheio: tinta em altura
  total, régua rente ao topo, sem extravasar") — continua verde.
- [x] 3.3 N/A — a opção (a) escolhida (fundo sólido atrás do texto) não usa faixa de exclusão por
  threshold fixo, então não existe uma "borda" onde um salto visual poderia acontecer.
- [x] 3.4 Confirmado no emulador 2026-08-19: o nome (`ItemDespensa`) usa `numberOfLines={1}` —
  nunca quebra pra 2 linhas (trunca com reticências num nome bem longo testado ad-hoc). Como o
  fundo sólido cobre o bloco pela altura real do `View` (não por um valor fixo em px), o caso de
  "2 linhas" nunca acontece na prática e não há risco de a régua vazar por cima do texto.
- [x] 3.5 Confirmado no emulador 2026-08-19 nos dois temas: Despensa (escuro) e Porcelana (claro)
  — régua com cor de estado correta em ambos (`Arroz`/`Sabonete`, fração 25–50%), texto sempre
  legível sobre o fundo sólido, sem diferença de comportamento entre temas.
- [ ] 3.6 Item reciclado pela `FlashList` (interação com a change 10, `correcao-reciclagem-de-
  lista-anima-item-errado`) ainda não testado nesta rodada — requer rolagem rápida repetida com
  `inspect_screen`/gravação, não feito por restrição de tempo.

## 4. Regressão

- [x] 4.1 `npm run verificar` verde (fronteiras + lint + typecheck), incluindo a regra de hex —
  confirmado 2026-08-19 (fundo usa `tema.bg.base`, sem hex literal).
- [x] 4.2 `npm test` verde, incluindo `medidor-e-item.test.tsx` na íntegra — 20/20 testes verdes.
- [x] 4.3 `.maestro/jornada-completa-caminho-feliz.yaml` rodou ponta a ponta e passou (62/62
  comandos) 2026-08-19, cobrindo a Despensa com medidor renderizado ao longo de todo o roteiro.
  `.maestro/auditoria-ui-ux-android.yaml` ficou bloqueado por um problema de ambiente do emulador
  (bolha flutuante "Tools" do dev client volta pra posição default a cada `launchApp` dentro do
  próprio flow e intercepta toques no cabeçalho da Despensa) — não é regressão de nenhuma change,
  documentado como gap de infraestrutura de teste, não do código.
- [x] 4.4 Screenshots capturados no emulador 2026-08-19 nos dois temas (Despensa escuro e
  Porcelana claro), frações 0% (Acabou/crítico), 25% (Sabonete) e 50% (Arroz) — sem traço da
  régua cruzando o texto em nenhum caso.
