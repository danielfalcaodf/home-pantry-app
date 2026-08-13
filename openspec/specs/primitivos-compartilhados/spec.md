# primitivos-compartilhados

## Requirements

### Requirement: Identificador UUID v7 como chave primária

O projeto SHALL gerar identificadores no formato **UUID v7** para toda entidade persistida. UUID v4 e chaves auto-incrementais NÃO devem ser usados.

#### Scenario: Formato correto

- **WHEN** a função de geração de identificador é chamada
- **THEN** ela retorna uma string de 36 caracteres cujo campo de versão indica 7

#### Scenario: Ordenável por tempo de criação

- **WHEN** dois identificadores são gerados em instantes diferentes
- **THEN** a ordenação lexicográfica das strings respeita a ordem cronológica de geração

#### Scenario: Gerável sem coordenação externa

- **WHEN** o identificador é gerado com o aparelho offline
- **THEN** a geração conclui sem erro e sem qualquer chamada de rede

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
