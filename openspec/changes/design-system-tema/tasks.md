## 1. Tokens de cor

- [x] 1.1 Criar `src/presentation/theme/tokens.ts` com o tipo `Theme` declarando fundo, divisor, texto, estados, ação e opacidade de preenchimento
- [x] 1.2 Preencher o tema escuro **Despensa** com os valores hexadecimais exatos da tabela do documento de frontend
- [x] 1.3 Preencher o tema claro **Porcelana** com os valores hexadecimais exatos da tabela do documento de frontend
- [x] 1.4 Definir a opacidade de preenchimento em 0,12 no escuro e 0,10 no claro
- [x] 1.5 Escrever teste verificando que os dois temas expõem exatamente o mesmo conjunto de chaves
- [x] 1.6 Escrever teste de contraste calculando a razão de cada par texto sobre fundo e falhando abaixo do nível AA
- [x] 1.7 Escrever teste de contraste do texto **sobre a tinta do medidor**, e não apenas sobre o fundo limpo

## 2. Tokens de espaço, raio e tipografia

- [x] 2.1 Criar `src/presentation/theme/espaco.ts` com a escala de 4, 8, 12, 16, 24, 32 e 48, e os raios 0, 8, 12 e 999
- [x] 2.2 Criar `src/presentation/theme/tipografia.ts` com os oito papéis da escala, cada um declarando família, tamanho, altura de linha, peso e espaçamento entre letras
- [x] 2.3 Marcar os papéis de dado como monoespaçados com figuras tabulares
- [x] 2.4 Escrever teste confirmando que nenhum tamanho da escala excede 34 pontos

## 3. Fontes

- [ ] 3.1 Inspecionar os pacotes de fonte de Archivo, IBM Plex Sans e IBM Plex Mono e listar os pesos que cada um realmente exporta
- [ ] 3.2 Ajustar a escala tipográfica para referenciar apenas pesos existentes, corrigindo o documento de frontend se algum peso suposto não existir
- [ ] 3.3 Instalar os pacotes de fonte e carregar somente os pesos referenciados pela escala
- [ ] 3.4 Habilitar as figuras tabulares na família monoespaçada e verificar no aparelho que os dígitos têm largura idêntica
- [ ] 3.5 Medir o peso total das fontes embarcadas e registrar o valor; se ultrapassar 400 quilobytes, remover a família de display e ajustar a escala

## 4. Persistência da preferência

- [ ] 4.1 Adicionar a tabela de configuração chave-valor por casa ao schema, com migration nova, sem editar a migration inicial
- [ ] 4.2 Gerar a migration `0001_configuracao` e revisar o SQL produzido
- [ ] 4.3 Implementar o acessador tipado de configuração no repositório, com valor padrão declarado junto de cada chave
- [ ] 4.4 Escrever teste de leitura de preferência ausente retornando o padrão sem erro
- [ ] 4.5 Escrever teste de gravação repetida confirmando substituição sem linha duplicada

## 5. Provedor de tema

- [ ] 5.1 Criar `src/presentation/theme/provider.tsx` com `ThemeProvider` e `useTheme()`
- [ ] 5.2 Resolver o tema efetivo a partir da preferência persistida e da aparência do sistema, com automático como padrão
- [ ] 5.3 Fazer o modo automático reagir à mudança de aparência do sistema sem reinício do app
- [ ] 5.4 Escrever teste de resolução do tema efetivo cobrindo automático, claro forçado e escuro forçado
- [ ] 5.5 Escrever teste confirmando que a escolha explícita sobrevive ao fechamento e vence a preferência do sistema

## 6. Abertura sem flash

- [ ] 6.1 Ordenar a inicialização no layout raiz: aplicar migrations, ler a preferência de tema, carregar as fontes, e só então esconder a tela de abertura
- [ ] 6.2 Manter a tela de abertura visível enquanto qualquer uma dessas etapas estiver pendente
- [ ] 6.3 Verificar no aparelho, com preferência escura, que nenhum quadro de fundo claro aparece na abertura
- [ ] 6.4 Verificar que a tela de erro de migration usa o tema resolvido, e não um fundo padrão

## 7. Componentes-base

- [ ] 7.1 Implementar `Texto` aceitando apenas os papéis da escala, sem estilo de fonte arbitrário
- [ ] 7.2 Adicionar regra de lint proibindo o componente de texto nativo fora de `src/presentation/components/`
- [ ] 7.3 Implementar `Botao` com área tocável mínima de 48 por 48, e os estados normal, pressionado e desabilitado anunciados ao leitor de tela
- [ ] 7.4 Implementar `CampoTexto` com rótulo sempre visível acima, divisor de 2 pontos na cor de ação em foco, e mensagem de erro em texto
- [ ] 7.5 Implementar `ChipEstado` recebendo rótulo, contagem e cor de estado, sem conhecer o domínio de produto
- [ ] 7.6 Implementar `Toast` ancorado acima da barra de abas, com barra de tempo, ação opcional, e política de substituição em vez de empilhamento
- [ ] 7.7 Implementar `EstadoVazio` com texto de convite e ação sugerida
- [ ] 7.8 Implementar `TelaErro` declarando o que houve e a ação de recuperação, sem pedido de desculpas
- [ ] 7.9 Escrever testes de renderização dos componentes-base, confirmando que nenhum deles importa do domínio de produto

## 8. Movimento

- [ ] 8.1 Configurar as animações de mola para declararem respeito à preferência de redução de movimento do sistema
- [ ] 8.2 Confirmar que nenhum componente checa manualmente a preferência de redução de movimento
- [ ] 8.3 Verificar no aparelho, com redução de movimento ligada, que a mudança de valor ocorre em esmaecimento curto e o retorno tátil permanece

## 9. Conformidade

- [ ] 9.1 Executar o lint e confirmar que nenhum literal de cor existe fora do arquivo de tokens
- [ ] 9.2 Verificar a escala de fonte do sistema em 200 por cento, confirmando que o nome não trunca e os alvos de toque permanecem em 48 por 48
- [ ] 9.3 Confirmar por lint de fronteira que os componentes-base não importam de `application/` nem de `infrastructure/`
- [ ] 9.4 Atualizar o documento de frontend se qualquer valor de peso tipográfico ou de token tiver sido ajustado durante a implementação
