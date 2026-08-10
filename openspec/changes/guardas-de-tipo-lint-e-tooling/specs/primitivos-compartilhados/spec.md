## MODIFIED Requirements

### Requirement: Result para falhas esperadas

O projeto SHALL fornecer um tipo `Result<T, E>` usado no domínio e nos casos de uso para representar falhas esperadas (validação, conflito). Exceções ficam reservadas ao que é genuinamente excepcional, como falha de I/O do banco.

#### Scenario: Sucesso carrega o valor

- **WHEN** uma operação bem-sucedida retorna um `Result`
- **THEN** o resultado é discriminável como sucesso e expõe o valor tipado

#### Scenario: Falha carrega o erro tipado

- **WHEN** uma validação de domínio falha
- **THEN** o resultado é discriminável como falha, expõe o erro tipado e NÃO lança exceção

#### Scenario: Discriminação obriga tratamento

- **WHEN** o consumidor acessa o valor de um `Result` sem antes discriminar sucesso de falha
- **THEN** o compilador de tipos rejeita o acesso, comprovado por um teste de tipo (`@ts-expect-error` sobre `resultado.valor` fora de um bloco `if (resultado.ok)`) validado via `tsc --noEmit`, e não apenas pela forma do tipo union
