import { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { createNumberMask, useMaskedInputProps } from 'react-native-mask-input';

import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { tipografia } from '../theme/tipografia';
import { Texto } from './texto';

export type TipoDeCampo = 'quantidade' | 'dinheiro';

export type CampoTextoProps = Omit<TextInputProps, 'style'> & {
  rotulo: string;
  erro?: string;
  /** Aplica máscara de dígitos/vírgula e placeholder padrão do formato — a
   *  conversão pra milésimos/centavos continua acontecendo só na borda de
   *  salvar (domain/shared/), a máscara aqui só limpa o que é digitado. */
  tipo?: TipoDeCampo;
};

const ESPESSURA_FOCO = 2;
const PLACEHOLDER_POR_TIPO: Record<TipoDeCampo, string> = {
  dinheiro: '0,00',
  quantidade: '0,000',
};
const CASAS_DECIMAIS_QUANTIDADE = 3;

// react-native-mask-input: a partir do 3º dígito, cada novo dígito entra
// pela direita como centavo e a vírgula se ajusta sozinha (129 → "1,29",
// 1290 → "12,90") — pedido explícito do usuário, "vai ajustando moedas" —
// em vez de reimplementar esse comportamento na mão.
const mascaraDinheiro = createNumberMask({ prefix: [], delimiter: '.', separator: ',', precision: 2 });

/** Mantém só sinal, dígitos e uma vírgula decimal, truncada em 3 casas —
 *  sem reformatar o valor inteiro a cada tecla, pra não atropelar o que a
 *  pessoa está digitando no meio do número. O sinal negativo passa (ex.:
 *  ajuste de estoque valida e rejeita negativo com erro em texto — a
 *  máscara não é o mecanismo de bloqueio, é só limpeza de digitação).
 *  Sem lib própria: quantidade não segue a convenção de "sempre duas
 *  casas" do dinheiro (5 precisa continuar significando 5 unidades, não
 *  0,005), então o digit-shift de uma máscara de moeda não serve aqui. */
export function aplicarMascaraQuantidade(texto: string): string {
  const negativo = texto.trim().startsWith('-');
  const normalizado = texto.replace('.', ',');
  const limpo = normalizado.replace(/[^\d,]/g, '');
  const [parteInteira, ...resto] = limpo.split(',');
  const sinal = negativo ? '-' : '';
  if (resto.length === 0) {
    return `${sinal}${parteInteira}`;
  }
  const parteDecimal = resto.join('').slice(0, CASAS_DECIMAIS_QUANTIDADE);
  return `${sinal}${parteInteira},${parteDecimal}`;
}

/**
 * Rótulo sempre visível acima do campo — placeholder como rótulo desaparece
 * quando o usuário digita, justo quando ele mais precisa saber o que é.
 */
export const CampoTexto = forwardRef<TextInput, CampoTextoProps>(function CampoTexto(
  { rotulo, erro, tipo, ...props },
  ref,
) {
  const tema = useTheme();
  const [focado, setFocado] = useState(false);
  const corDoDivisor = erro
    ? tema.state.critico
    : focado
      ? tema.action.azulejo
      : tema.line.hairline;

  // Chamado incondicionalmente (regra de hooks) — só aplicado quando
  // tipo="dinheiro"; para os demais tipos o valor/onChangeText originais
  // seguem intactos. `useMaskedInputProps` espera o valor "não mascarado"
  // (a sequência de dígitos que produziria a máscara atual), não o texto
  // decimal exibido — por isso extrai só os dígitos do `value` controlado
  // em vez de reinterpretar como número (isso preservaria a digitação
  // progressiva "1" → "12" → "1,29", em vez de forçar "1,00" cedo demais).
  // Quem semeia um valor inicial (editar item existente) precisa
  // formatá-lo já em "X,YY" pra bater com esse contrato.
  const propsComMascaraDinheiro = useMaskedInputProps({
    value: (props.value ?? '').replace(/\D/g, ''),
    onChangeText: (mascarado) => props.onChangeText?.(mascarado),
    mask: mascaraDinheiro,
  });

  const valorEOnChange =
    tipo === 'dinheiro'
      ? { value: propsComMascaraDinheiro.value, onChangeText: propsComMascaraDinheiro.onChangeText }
      : {
          value: props.value,
          onChangeText: (texto: string) =>
            props.onChangeText?.(tipo === 'quantidade' ? aplicarMascaraQuantidade(texto) : texto),
        };

  return (
    <View style={{ gap: espaco.xs }}>
      <Texto papel="label" tom="secondary">
        {rotulo}
      </Texto>
      <TextInput
        ref={ref}
        {...props}
        {...valorEOnChange}
        accessibilityLabel={rotulo}
        placeholder={props.placeholder ?? (tipo ? PLACEHOLDER_POR_TIPO[tipo] : undefined)}
        onFocus={(evento) => {
          setFocado(true);
          props.onFocus?.(evento);
        }}
        onBlur={(evento) => {
          setFocado(false);
          props.onBlur?.(evento);
        }}
        placeholderTextColor={tema.text.secondary}
        style={{
          minHeight: ALVO_TOQUE_MINIMO,
          paddingVertical: espaco.md,
          color: tema.text.primary,
          fontFamily: tipografia['body.md'].fontFamily,
          fontSize: tipografia['body.md'].fontSize,
          borderBottomWidth: ESPESSURA_FOCO,
          borderBottomColor: corDoDivisor,
        }}
      />
      {erro ? (
        <Texto papel="label" cor={tema.state.critico}>
          {erro}
        </Texto>
      ) : null}
    </View>
  );
});
