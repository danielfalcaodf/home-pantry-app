## MODIFIED Requirements

### Requirement: Busca por nome

A despensa SHALL permitir buscar itens por nome, ignorando diferença de caixa e acentuação. A normalização SHALL ser feita por uma função pura (`normalizarParaBusca`/`casaComBusca`, em `src/presentation/format/normalizar-busca.ts`), diretamente testável e independente do `COLLATE NOCASE` do SQLite (que é ASCII-only e não resolve acento).

#### Scenario: Busca parcial

- **WHEN** o usuário digita parte do nome de um item
- **THEN** a lista mostra os itens cujo nome contém o trecho digitado

#### Scenario: Busca ignora acento e caixa

- **WHEN** o usuário busca por "acucar"
- **THEN** um item chamado "Açúcar" é encontrado

#### Scenario: Busca sem resultado oferece cadastro

- **WHEN** a busca não encontra nenhum item
- **THEN** é exibida a mensagem de nenhum item com esse nome e uma ação para cadastrar o termo buscado
