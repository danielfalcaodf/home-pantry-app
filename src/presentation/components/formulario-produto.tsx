import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UNIDADES, Unidade } from '../../domain/shared/unidade';
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
}: FormularioProdutoProps) {
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const [maisOpcoes, setMaisOpcoes] = useState(false);
  const [categoriaFocada, setCategoriaFocada] = useState(false);

  const definir = (campo: keyof ValoresDoProduto) => (texto: string) =>
    aoMudar({ ...valores, [campo]: texto });

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
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: espaco.lg, gap: espaco.lg }}
      keyboardShouldPersistTaps="handled"
    >
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
              onPress={() => aoMudar({ ...valores, unidade })}
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
      />

      <Pressable
        onPress={() => setMaisOpcoes(!maisOpcoes)}
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
            />
          ) : null}
          <CampoTexto
            rotulo="Quanto costuma custar"
            value={valores.valorUnitario}
            onChangeText={definir('valorUnitario')}
            erro={erros.valorUnitario}
            keyboardType="decimal-pad"
            tipo="dinheiro"
          />
          <View style={{ gap: espaco.sm }}>
            <CampoTexto
              rotulo="Onde guardo"
              value={valores.categoria}
              onChangeText={definir('categoria')}
              onFocus={() => setCategoriaFocada(true)}
              onBlur={() => setCategoriaFocada(false)}
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
          />
          <CampoTexto
            rotulo="Anotação"
            value={valores.observacao}
            onChangeText={definir('observacao')}
            multiline
          />
        </View>
      ) : null}
    </ScrollView>
    <View
      style={{
        padding: espaco.lg,
        paddingBottom: espaco.lg + insets.bottom,
        borderTopWidth: 1,
        borderTopColor: tema.line.hairline,
      }}
    >
      <Botao titulo={tituloAcao} onPress={aoSalvar} disabled={salvando} />
    </View>
    </View>
    </EvitaTeclado>
  );
}
