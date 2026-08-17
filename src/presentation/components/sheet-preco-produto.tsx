import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { icones } from '../theme/icones';
import { useTheme } from '../theme/provider';
import { Botao } from './botao';
import { CampoTexto } from './campo-texto';
import { IconeSvg } from './icone-svg';
import { PainelInferior } from './painel-inferior';
import { Texto } from './texto';

export type SheetPrecoProdutoProps = {
  visivel: boolean;
  nome: string;
  /** Preço atual em decimal (reais), já convertido pela apresentação — `null`
   *  quando o produto ainda não tem preço de referência. */
  precoInicial: number | null;
  onFechar: () => void;
  /** Preço em decimal (reais); a conversão para centavos é do domínio. */
  onSalvar: (preco: number) => void;
};

/**
 * Ajuste rápido só do preço de referência do produto, direto na Lista de
 * compras — antes de iniciar a compra (design da change
 * correcao-lista-de-compras, decisão 4). Grava via `useEditarProduto`
 * (edição parcial), nunca em `compra_item` — aqui ainda não existe compra.
 */
export function SheetPrecoProduto({ visivel, nome, precoInicial, onFechar, onSalvar }: SheetPrecoProdutoProps) {
  const tema = useTheme();
  // Duas casas sempre — é o formato que a máscara de dinheiro espera pra
  // reconhecer o valor semeado (CampoTexto extrai dígitos do que está aqui).
  const [preco, setPreco] = useState(precoInicial !== null ? precoInicial.toFixed(2).replace('.', ',') : '');

  function fechar() {
    setPreco(precoInicial !== null ? precoInicial.toFixed(2).replace('.', ',') : '');
    onFechar();
  }

  function salvar() {
    const precoNumerico = preco.trim() === '' ? 0 : Number(preco.replace(',', '.'));
    onSalvar(precoNumerico);
    onFechar();
  }

  return (
    <PainelInferior
      visivel={visivel}
      onFechar={fechar}
      testID="evita-teclado-preco-produto"
      style={{ padding: espaco.xl, gap: espaco.lg }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Texto papel="body.lg">Preço de {nome}</Texto>
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
        rotulo="Quanto costuma custar"
        value={preco}
        onChangeText={setPreco}
        keyboardType="decimal-pad"
        tipo="dinheiro"
        autoFocus
      />
      <Botao titulo="Salvar" onPress={salvar} />
    </PainelInferior>
  );
}
