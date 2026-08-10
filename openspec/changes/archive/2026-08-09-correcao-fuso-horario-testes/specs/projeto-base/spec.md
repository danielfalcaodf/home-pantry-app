## ADDED Requirements

### Requirement: Ambiente de teste com fuso horário fixado
A suíte de testes SHALL rodar com o fuso horário do processo fixado (`TZ=America/Sao_Paulo`) na configuração do Jest, de modo que `npm test` produza o mesmo resultado em qualquer máquina, e as fixtures de data SHALL expressar instantes coerentes com esse fuso fixado.

#### Scenario: Suíte determinística independente da máquina
- **WHEN** `npm test` roda numa máquina com fuso local diferente do fixado (ex.: UTC ou UTC+9)
- **THEN** todos os testes que formatam ou agrupam datas produzem o mesmo resultado que numa máquina em `America/Sao_Paulo`, sem falha por deslocamento de dia civil ou de mês

#### Scenario: Formatação de data da compra bate com o dia local
- **WHEN** `formatarDataDaCompra` recebe um timestamp cuja data em `America/Sao_Paulo` é 03/08/2026
- **THEN** o teste espera exatamente `03/08/2026`, e passa

#### Scenario: Agrupamento mensal conta a compra no mês local
- **WHEN** o teste de `useGastoMensal` finaliza uma compra num instante que cai em agosto no fuso fixado
- **THEN** a compra é contabilizada no bucket `2026-08`, e o teste passa
