import { ReactNode, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ehIndivisivel, UNIDADES, Unidade } from '../../domain/shared/unidade';
import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { BotaoVoltar } from './botao-voltar';
import { CampoTexto } from './campo-texto';
import { ChipEstado } from './chip-estado';
import { EvitaTeclado } from './evita-teclado';
import { IconeSvg } from './icone-svg';
import { Texto } from './texto';
import { icones } from '../theme/icones';

export type ValoresDoProduto = {
  nome: string;
  unidade: Unidade;
  quantidadeNecessaria: string;
  quantidadeAtual: string;
  valorUnitario: string;
  categoria: string;
  marcaPreferida: string;
  observacao: string;
  /** Só usados quando `unidade` é indivisível (`un`, `pacote`, `caixa`). */
  fatorConversaoEmbalagem: string;
  valorReferenciaEmbalagem: string;
};

/** Teto de sanidade de UI (não é regra de domínio) — evita erro de digitação
 *  tipo "26666" passar sem confirmação; alto o bastante pra não incomodar
 *  quem legitimamente cadastra estoque grande. */
export const LIMITE_SANIDADE_QUANTIDADE = 99999;
export const LIMITE_SANIDADE_VALOR = 99999;

export const VALORES_INICIAIS: ValoresDoProduto = {
  nome: '',
  unidade: 'un',
  quantidadeNecessaria: '',
  quantidadeAtual: '',
  valorUnitario: '',
  categoria: '',
  marcaPreferida: '',
  observacao: '',
  fatorConversaoEmbalagem: '',
  valorReferenciaEmbalagem: '',
};

export type FormularioProdutoProps = {
  valores: ValoresDoProduto;
  aoMudar: (valores: ValoresDoProduto) => void;
  /** Chave do campo com erro → mensagem em texto, nunca só cor. */
  erros: Partial<Record<keyof ValoresDoProduto, string>>;
  categoriasExistentes: string[];
  tituloAcao: string;
  aoSalvar: () => void;
  salvando?: boolean;
  /** Quantidade atual só é editável no cadastro: depois vira ajuste (D8). */
  quantidadeAtualEditavel?: boolean;
  avisoDeNome?: { mensagem: string; acoes: { titulo: string; onPress: () => void }[] };
  /** Cabeçalho com título + voltar — só o Cadastrar produto usa (D3). */
  tituloCabecalho?: string;
  /**
   * Foco automático no nome só faz sentido quando digitá-lo é a primeira
   * ação (cadastro novo). No detalhe, o teclado cobriria "Usei"/"Repus"
   * (ACHADO-056, KPI K4) — por isso o default é não focar.
   */
  autofocarNome?: boolean;
  /**
   * `true` (default) quando o formulário é a tela inteira (`produto/novo.tsx`):
   * container `flex:1` de ponta a ponta. `false` quando embutido no meio de
   * outra tela com irmãos antes/depois (`produto/[id].tsx`) — o container
   * some para altura de conteúdo, sem vão vazio forçado nem corte visual
   * (correcao-layout-formulario-produto).
   */
  telaCheia?: boolean;
  /** Conteúdo extra renderizado no mesmo scroll, antes dos campos (ex.: cabeçalho e
   *  botões de ação da tela de detalhe do produto) — evita duplicar scroll/rodapé. */
  conteudoAntes?: ReactNode;
  /** Conteúdo extra renderizado no mesmo scroll, depois dos campos. */
  conteudoDepois?: ReactNode;
  /** Botão extra no mesmo rodapé fixo do botão principal (ex.: "Tirar da despensa"). */
  botaoExtra?: ReactNode;
};

export function FormularioProduto({
  valores,
  aoMudar,
  erros,
  categoriasExistentes,
  tituloAcao,
  aoSalvar,
  salvando,
  quantidadeAtualEditavel = true,
  avisoDeNome,
  tituloCabecalho,
  autofocarNome = false,
  telaCheia = true,
  conteudoAntes,
  conteudoDepois,
  botaoExtra,
}: FormularioProdutoProps) {
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const [categoriaFocada, setCategoriaFocada] = useState(false);
  // Chip "Vem em pacote fechado?" — unidade indivisível não implica pacote
  // (sabonete vs. papel higiênico, ambos `un`); default deriva de já haver
  // fator cadastrado (edição), nunca da unidade sozinha (design.md, decisão
  // 2026-09-05).
  const [pacoteFechado, setPacoteFechado] = useState(() => valores.fatorConversaoEmbalagem !== '');
  const scrollRef = useRef<ScrollView>(null);
  const marcadorMaisOpcoesRef = useRef<View>(null);
  const primeiroCampoExtraRef = useRef<TextInput>(null);
  const tinhaCampoFocadoRef = useRef(false);

  function registrarFoco() {
    tinhaCampoFocadoRef.current = true;
  }

  function registrarDesfoque() {
    tinhaCampoFocadoRef.current = false;
  }

  function alternarMaisOpcoes() {
    const vaiAbrir = !maisOpcoes;
    const manterFoco = vaiAbrir && tinhaCampoFocadoRef.current;
    setMaisOpcoes(vaiAbrir);
    if (vaiAbrir) {
      requestAnimationFrame(() => {
        marcadorMaisOpcoesRef.current?.measureLayout(
          // @ts-expect-error -- measureLayout aceita o nó nativo do ScrollView em runtime.
          scrollRef.current,
          (_x: number, y: number) => {
            scrollRef.current?.scrollTo({ y, animated: true });
            if (manterFoco) {
              // Demora breve para o Android preparar o IME antes de chamar .focus()
              // → evita autoFocus sem teclado aberto no celular físico (ACHADO-058).
              setTimeout(() => {
                primeiroCampoExtraRef.current?.focus();
              }, 200);
            }
          },
          () => {},
        );
      });
    }
  }

  const definir = (campo: keyof ValoresDoProduto) => (texto: string) =>
    aoMudar({ ...valores, [campo]: texto });

  // `pacote`/`caixa` já SÃO a unidade de embalagem escolhida — perguntar
  // "vem em pacote fechado?" seria redundante (design.md, decisão
  // "só para unidade `un`", 2026-09-05). Só `un` usa o chip.
  const embalagemObrigatoria = valores.unidade === 'pacote' || valores.unidade === 'caixa';
  const mostrarCamposEmbalagem = embalagemObrigatoria || (valores.unidade === 'un' && pacoteFechado);

  // Sem texto digitado (mas em foco), mostra tudo que já existe — a pessoa
  // não precisa adivinhar uma categoria pra descobrir que ela já existe.
  const sugestoes =
    valores.categoria === ''
      ? categoriaFocada
        ? categoriasExistentes
        : []
      : categoriasExistentes.filter(
          (nome) =>
            nome.toLowerCase().startsWith(valores.categoria.toLowerCase()) &&
            nome.toLowerCase() !== valores.categoria.toLowerCase(),
        );

  return (
    <EvitaTeclado testID="evita-teclado-formulario">
    <View style={[{ backgroundColor: tema.bg.base }, telaCheia && { flex: 1 }]}>
    <ScrollView
      ref={scrollRef}
      style={telaCheia ? { flex: 1 } : undefined}
      scrollEnabled={telaCheia}
      contentContainerStyle={{ padding: espaco.lg, gap: espaco.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {conteudoAntes}

      {tituloCabecalho ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
          <BotaoVoltar />
          <Texto papel="display.sm">{tituloCabecalho}</Texto>
        </View>
      ) : null}

      <CampoTexto
        rotulo="O que é"
        value={valores.nome}
        onChangeText={definir('nome')}
        erro={erros.nome}
        autoFocus={autofocarNome}
        onFocus={registrarFoco}
        onBlur={registrarDesfoque}
      />

      {avisoDeNome ? (
        <View style={{ gap: espaco.sm }}>
          <Texto papel="body.md" cor={tema.state.emFalta}>
            {avisoDeNome.mensagem}
          </Texto>
          <View style={{ flexDirection: 'row', gap: espaco.lg }}>
            {avisoDeNome.acoes.map((acao) => (
              <Pressable key={acao.titulo} onPress={acao.onPress} accessibilityRole="button">
                <Texto papel="body.md" cor={tema.action.azulejo}>
                  {acao.titulo}
                </Texto>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: espaco.sm }}>
        <Texto papel="label" tom="secondary">
          Medida
        </Texto>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
          {UNIDADES.map((unidade) => (
            <ChipEstado
              key={unidade}
              rotulo={unidade}
              ativo={valores.unidade === unidade}
              onPress={() => {
                if (!ehIndivisivel(unidade)) {
                  // Trocar para unidade divisível descarta a embalagem e o
                  // controle (spec cadastro-de-produto): não faz sentido pra
                  // unidade que não vem em pacote fechado.
                  setPacoteFechado(false);
                  aoMudar({ ...valores, unidade, fatorConversaoEmbalagem: '', valorReferenciaEmbalagem: '' });
                  return;
                }
                if (unidade === 'un') {
                  // Recalcula a partir do fator já digitado (ex.: usuário ia
                  // e voltava entre "un" e "pacote"/"caixa" com embalagem já
                  // preenchida) — não pode ficar preso ao valor do mount.
                  setPacoteFechado(valores.fatorConversaoEmbalagem !== '');
                }
                aoMudar({ ...valores, unidade });
              }}
            />
          ))}
        </View>
      </View>

      <CampoTexto
        rotulo="Quanto quero ter em casa"
        value={valores.quantidadeNecessaria}
        onChangeText={definir('quantidadeNecessaria')}
        erro={erros.quantidadeNecessaria}
        keyboardType="decimal-pad"
        tipo="quantidade"
        onFocus={registrarFoco}
        onBlur={registrarDesfoque}
      />

      <Pressable
        onPress={alternarMaisOpcoes}
        accessibilityRole="button"
        accessibilityState={{ expanded: maisOpcoes }}
        hitSlop={8}
        style={{
          minHeight: ALVO_TOQUE_MINIMO,
          flexDirection: 'row',
          alignItems: 'center',
          gap: espaco.xs,
        }}
      >
        <Texto papel="body.md" cor={tema.action.azulejo}>
          {maisOpcoes ? 'Menos opções' : 'Mais opções'}
        </Texto>
        <View style={{ transform: [{ rotate: maisOpcoes ? '180deg' : '0deg' }] }}>
          <IconeSvg path={icones.cheveron} cor={tema.action.azulejo} tamanho={16} />
        </View>
      </Pressable>
      <View ref={marcadorMaisOpcoesRef} />

      {maisOpcoes ? (
        <View style={{ gap: espaco.lg }}>
          {quantidadeAtualEditavel ? (
            <CampoTexto
              rotulo="Quanto tenho agora"
              value={valores.quantidadeAtual}
              onChangeText={definir('quantidadeAtual')}
              erro={erros.quantidadeAtual}
              keyboardType="decimal-pad"
              tipo="quantidade"
              ref={primeiroCampoExtraRef}
              onFocus={registrarFoco}
              onBlur={registrarDesfoque}
            />
          ) : null}
          {valores.unidade === 'un' ? (
            <View style={{ gap: espaco.sm }}>
              <Texto papel="label" tom="secondary">
                Vem em pacote fechado?
              </Texto>
              <View style={{ flexDirection: 'row', gap: espaco.sm }}>
                <ChipEstado
                  rotulo="Não"
                  ativo={!pacoteFechado}
                  onPress={() => {
                    setPacoteFechado(false);
                    aoMudar({ ...valores, fatorConversaoEmbalagem: '', valorReferenciaEmbalagem: '' });
                  }}
                />
                <ChipEstado rotulo="Sim" ativo={pacoteFechado} onPress={() => setPacoteFechado(true)} />
              </View>
            </View>
          ) : null}
          {mostrarCamposEmbalagem ? null : (
            <CampoTexto
              rotulo="Quanto costuma custar"
              value={valores.valorUnitario}
              onChangeText={definir('valorUnitario')}
              erro={erros.valorUnitario}
              keyboardType="decimal-pad"
              tipo="dinheiro"
              ref={quantidadeAtualEditavel ? undefined : primeiroCampoExtraRef}
              onFocus={registrarFoco}
              onBlur={registrarDesfoque}
            />
          )}
          {mostrarCamposEmbalagem ? (
            <View style={{ gap: espaco.lg }}>
              <CampoTexto
                rotulo="Quantas unidades vêm no pacote?"
                value={valores.fatorConversaoEmbalagem}
                onChangeText={definir('fatorConversaoEmbalagem')}
                erro={erros.fatorConversaoEmbalagem}
                keyboardType="number-pad"
                tipo="quantidade"
                ref={quantidadeAtualEditavel ? undefined : primeiroCampoExtraRef}
                onFocus={registrarFoco}
                onBlur={registrarDesfoque}
              />
              <CampoTexto
                rotulo="Quanto custa o pacote?"
                value={valores.valorReferenciaEmbalagem}
                onChangeText={definir('valorReferenciaEmbalagem')}
                keyboardType="decimal-pad"
                tipo="dinheiro"
                onFocus={registrarFoco}
                onBlur={registrarDesfoque}
              />
            </View>
          ) : null}
          <View style={{ gap: espaco.sm }}>
            <CampoTexto
              rotulo="Onde guardo"
              value={valores.categoria}
              onChangeText={definir('categoria')}
              onFocus={() => {
                registrarFoco();
                setCategoriaFocada(true);
              }}
              onBlur={() => {
                registrarDesfoque();
                setCategoriaFocada(false);
              }}
            />
            {sugestoes.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
                {sugestoes.map((nome) => (
                  <ChipEstado
                    key={nome}
                    rotulo={nome}
                    onPress={() => aoMudar({ ...valores, categoria: nome })}
                  />
                ))}
              </View>
            ) : null}
          </View>
          <CampoTexto
            rotulo="Marca que prefiro"
            value={valores.marcaPreferida}
            onChangeText={definir('marcaPreferida')}
            onFocus={registrarFoco}
            onBlur={registrarDesfoque}
          />
          <CampoTexto
            rotulo="Anotação"
            value={valores.observacao}
            onChangeText={definir('observacao')}
            onFocus={registrarFoco}
            onBlur={registrarDesfoque}
            multiline
          />
        </View>
      ) : null}

      {conteudoDepois}
    </ScrollView>
    <View
      style={{
        padding: espaco.lg,
        paddingBottom: espaco.lg + insets.bottom,
        gap: espaco.sm,
        borderTopWidth: 1,
        borderTopColor: tema.line.hairline,
      }}
    >
      <Botao titulo={tituloAcao} onPress={aoSalvar} disabled={salvando} />
      {botaoExtra}
    </View>
    </View>
    </EvitaTeclado>
  );
}
