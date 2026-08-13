## 1. Correção

- [x] 1.1 Em `app/(tabs)/resumo.tsx`, derivar a contagem do chip "Faltando" de `agrupar-despensa.ts` (soma `critico + emFalta`), eliminando a leitura bruta de `contagensPorEstado['emFalta']`.
- [x] 1.2 Em `src/presentation/components/chip-estado.tsx`, trocar o fundo do estado ativo de `tema.bg.raised` para a `cor` do estado com `tema.fillOpacity`, texto na cor cheia, conforme o spec `componentes-base`.

## 2. Prova do cenário do bug

- [x] 2.1 Teste do Resumo com dados `critico=37, emFalta=0`: chip "Faltando" exibe 37 — cenário exato do ACHADO-053.
- [x] 2.2 Teste do `ChipEstado` com `ativo={true}` e uma `cor` de estado: fundo resulta da cor com `fillOpacity`, não de `bg.raised` — cenário do ACHADO-017.

## 3. Casos de borda do mesmo contexto

- [x] 3.1 Teste de consistência: para várias combinações (`critico=0/emFalta=12`, `critico=3/emFalta=12`, tudo zero), Resumo e Despensa produzem o mesmo número para "Faltando".
- [x] 3.2 Teste de reatividade (ACHADO-050): alterar o estado de um item via hook fake e asserir que a contagem dos chips atualiza sem remontar o componente.
- [x] 3.3 Teste de acionabilidade (ACHADO-050): `ChipEstado` com `contagem=0` continua respondendo a `onPress` (não vira `disabled`).
- [x] 3.4 Teste do chip inativo: fundo `transparent` permanece (sem regressão do estado não-ativo).

## 4. Gate de qualidade

- [x] 4.1 Rodar `npm test` e `npm run verificar` — tudo verde; conferir visualmente os chips nos temas Despensa e Porcelana no emulador.
