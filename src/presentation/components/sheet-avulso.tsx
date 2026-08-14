import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { DadosDoAvulso } from '../../domain/lista/lista';
import { UNIDADES, Unidade } from '../../domain/shared/unidade';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { ChipEstado } from './chip-estado';
import { EvitaTeclado } from './evita-teclado';
import { IconeSvg } from './icone-svg';
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
  const [erroQuantidade, setErroQuantidade] = useState<string | undefined>(undefined);

  function fechar() {
    setErroNome(undefined);
    setErroQuantidade(undefined);
    onFechar();
  }

  function salvar() {
    const nomeLimpo = nome.trim();
    if (nomeLimpo === '') {
      setErroNome('Dê um nome ao item');
      return;
    }
    const quantidadeNumerica = Number(quantidade.replace(',', '.'));
    if (!(quantidadeNumerica > 0)) {
      setErroQuantidade('Diga quanto você está levando');
      return;
    }
    // O campo de preço usa tipo="dinheiro" (máscara "de caixa registradora"):
    // só dígitos viram centavos, então nunca chega aqui um valor inválido —
    // ou está vazio (sem preço) ou é um número válido.
    const precoNumerico = preco.trim() === '' ? null : Number(preco.replace(',', '.'));
    onSalvar({
      nome: nomeLimpo,
      unidade,
      quantidade: quantidadeNumerica,
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
        <EvitaTeclado style={{ flex: undefined }} testID="evita-teclado-avulso">
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Texto papel="body.lg">{inicial ? 'Editar item' : 'Adicionar item avulso'}</Texto>
            <Pressable
              onPress={fechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
              style={{
                minWidth: ALVO_TOQUE_MINIMO,
                minHeight: ALVO_TOQUE_MINIMO,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconeSvg path={icones.fechar} cor={tema.text.secondary} tamanho={20} />
            </Pressable>
          </View>
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
                erro={erroQuantidade}
                tipo="quantidade"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CampoTexto
                rotulo="Preço (opcional)"
                value={preco}
                onChangeText={setPreco}
                keyboardType="decimal-pad"
                tipo="dinheiro"
              />
            </View>
          </View>
          <Botao titulo={inicial ? 'Salvar' : 'Adicionar'} onPress={salvar} />
        </Pressable>
        </EvitaTeclado>
      </Pressable>
    </Modal>
  );
}
