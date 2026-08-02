import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { UNIDADES, Unidade } from '../../domain/shared/unidade';
import { espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { ChipEstado } from './chip-estado';
import { Texto } from './texto';

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
}: FormularioProdutoProps) {
  const tema = useTheme();
  const [maisOpcoes, setMaisOpcoes] = useState(false);

  const definir = (campo: keyof ValoresDoProduto) => (texto: string) =>
    aoMudar({ ...valores, [campo]: texto });

  const sugestoes = categoriasExistentes.filter(
    (nome) =>
      valores.categoria !== '' &&
      nome.toLowerCase().startsWith(valores.categoria.toLowerCase()) &&
      nome.toLowerCase() !== valores.categoria.toLowerCase(),
  );

  return (
    <ScrollView
      style={{ backgroundColor: tema.bg.base }}
      contentContainerStyle={{ padding: espaco.lg, gap: espaco.lg }}
      keyboardShouldPersistTaps="handled"
    >
      <CampoTexto
        rotulo="O que é"
        value={valores.nome}
        onChangeText={definir('nome')}
        erro={erros.nome}
        autoFocus
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
      />

      <Pressable onPress={() => setMaisOpcoes(!maisOpcoes)} accessibilityRole="button">
        <Texto papel="body.md" cor={tema.action.azulejo}>
          {maisOpcoes ? 'Menos opções' : 'Mais opções'}
        </Texto>
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
            />
          ) : null}
          <CampoTexto
            rotulo="Quanto costuma custar"
            value={valores.valorUnitario}
            onChangeText={definir('valorUnitario')}
            erro={erros.valorUnitario}
            keyboardType="decimal-pad"
          />
          <View style={{ gap: espaco.sm }}>
            <CampoTexto
              rotulo="Onde guardo"
              value={valores.categoria}
              onChangeText={definir('categoria')}
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

      <Botao titulo={tituloAcao} onPress={aoSalvar} disabled={salvando} />
    </ScrollView>
  );
}
