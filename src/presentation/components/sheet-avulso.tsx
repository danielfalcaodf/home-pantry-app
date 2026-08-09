import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { DadosDoAvulso } from '../../domain/lista/lista';
import { UNIDADES, Unidade } from '../../domain/shared/unidade';
import { espaco, raio } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { ChipEstado } from './chip-estado';
import { Texto } from './texto';

export type SheetAvulsoProps = {
  visivel: boolean;
  /** Presente ao editar um avulso existente; ausente ao criar um novo. */
  inicial?: DadosDoAvulso;
  onFechar: () => void;
  onSalvar: (dados: DadosDoAvulso) => void;
};

const QUANTIDADE_PADRAO = 1;

/**
 * Nome, unidade, quantidade e preço opcional — o avulso nunca vira produto
 * cadastrado (design da change, requisito "Adicionar item avulso").
 */
export function SheetAvulso({ visivel, inicial, onFechar, onSalvar }: SheetAvulsoProps) {
  const tema = useTheme();
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [unidade, setUnidade] = useState<Unidade>(inicial?.unidade ?? 'un');
  const [quantidade, setQuantidade] = useState(String(inicial?.quantidade ?? QUANTIDADE_PADRAO));
  const [preco, setPreco] = useState(inicial?.preco !== undefined && inicial?.preco !== null ? String(inicial.preco) : '');
  const [erroNome, setErroNome] = useState<string | undefined>(undefined);

  function fechar() {
    setErroNome(undefined);
    onFechar();
  }

  function salvar() {
    const nomeLimpo = nome.trim();
    if (nomeLimpo === '') {
      setErroNome('Dê um nome ao item');
      return;
    }
    const quantidadeNumerica = Number(quantidade.replace(',', '.'));
    const precoNumerico = preco.trim() === '' ? null : Number(preco.replace(',', '.'));
    onSalvar({
      nome: nomeLimpo,
      unidade,
      quantidade: quantidadeNumerica > 0 ? quantidadeNumerica : QUANTIDADE_PADRAO,
      preco: precoNumerico !== null && precoNumerico > 0 ? precoNumerico : null,
    });
    fechar();
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={fechar}>
      <Pressable
        onPress={fechar}
        accessibilityLabel="Fechar"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: tema.bg.raised,
            borderTopLeftRadius: raio.sheet,
            borderTopRightRadius: raio.sheet,
            padding: espaco.xl,
            gap: espaco.lg,
          }}
        >
          <Texto papel="body.lg">{inicial ? 'Editar item' : 'Adicionar item avulso'}</Texto>
          <CampoTexto
            rotulo="O que é"
            value={nome}
            onChangeText={setNome}
            erro={erroNome}
            autoFocus
          />
          <View style={{ gap: espaco.sm }}>
            <Texto papel="label" tom="secondary">
              Medida
            </Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
              {UNIDADES.map((valor) => (
                <ChipEstado
                  key={valor}
                  rotulo={valor}
                  ativo={unidade === valor}
                  onPress={() => setUnidade(valor)}
                />
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: espaco.md }}>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo="Quantidade"
                value={quantidade}
                onChangeText={setQuantidade}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo="Preço (opcional)"
                value={preco}
                onChangeText={setPreco}
                keyboardType="decimal-pad"
                placeholder="0,00"
              />
            </View>
          </View>
          <Botao titulo={inicial ? 'Salvar' : 'Adicionar'} onPress={salvar} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
