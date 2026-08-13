## MODIFIED Requirements

### Requirement: Comandos de qualidade documentados

O projeto SHALL expor comandos de `dev`, `test`, `lint` e `typecheck`, e a documentação de trabalho do repositório SHALL registrar os comandos reais assim que existirem. O projeto SHALL usar um **único** gerenciador de pacotes — `npm`, conforme documentado em `CLAUDE.md` e nos scripts de `package.json` — e o repositório NÃO deve conter artefatos de um segundo gerenciador de pacotes coexistindo (lockfile ou arquivo de workspace de outra ferramenta).

#### Scenario: Comandos declarados

- **WHEN** o manifesto de pacotes é inspecionado
- **THEN** existem scripts para iniciar o app, rodar testes, rodar o linter e verificar tipos

#### Scenario: Documentação atualizada

- **WHEN** o scaffold é concluído
- **THEN** a seção de comandos do guia do repositório contém os comandos reais e não mais o aviso de "a confirmar"

#### Scenario: Gerenciador de pacotes único

- **WHEN** a raiz do repositório é inspecionada
- **THEN** existe no máximo um arquivo de lockfile/workspace de gerenciador de pacotes, correspondente ao gerenciador documentado (`npm`), e nenhum artefato de um segundo gerenciador (ex. `pnpm-lock.yaml`, `pnpm-workspace.yaml`) está presente, rastreado ou não
