import { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

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
const CASAS_DECIMAIS_POR_TIPO: Record<TipoDeCampo, number> = {
  dinheiro: 2,
  quantidade: 3,
};
const PLACEHOLDER_POR_TIPO: Record<TipoDeCampo, string> = {
  dinheiro: '0,00',
  quantidade: '0,000',
};

/** Máscara de dinheiro "de caixa registradora": cada dígito digitado entra
 *  pela direita, empurrando os centavos — dígitos viram centavos, a vírgula
 *  se ajusta sozinha (100 → "1,00", 1290 → "12,90"). Backspace funciona
 *  naturalmente porque relê os dígitos restantes do texto já mascarado a
 *  cada tecla, não mantém estado próprio. */
function aplicarMascaraDinheiro(texto: string): string {
  const digitos = texto.replace(/\D/g, '');
  if (digitos === '') {
    return '';
  }
  const centavosTotais = parseInt(digitos, 10);
  const reais = Math.floor(centavosTotais / 100);
  const centavos = String(centavosTotais % 100).padStart(2, '0');
  return `${reais},${centavos}`;
}

/** Mantém só sinal, dígitos e uma vírgula decimal, truncada em 3 casas —
 *  sem reformatar o valor inteiro a cada tecla, pra não atropelar o que a
 *  pessoa está digitando no meio do número. O sinal negativo passa (ex.:
 *  ajuste de estoque valida e rejeita negativo com erro em texto — a
 *  máscara não é o mecanismo de bloqueio, é só limpeza de digitação). */
function aplicarMascaraQuantidade(texto: string): string {
  const negativo = texto.trim().startsWith('-');
  const normalizado = texto.replace('.', ',');
  const limpo = normalizado.replace(/[^\d,]/g, '');
  const [parteInteira, ...resto] = limpo.split(',');
  const sinal = negativo ? '-' : '';
  if (resto.length === 0) {
    return `${sinal}${parteInteira}`;
  }
  const parteDecimal = resto.join('').slice(0, CASAS_DECIMAIS_POR_TIPO.quantidade);
  return `${sinal}${parteInteira},${parteDecimal}`;
}

export function aplicarMascara(texto: string, tipo: TipoDeCampo): string {
  return tipo === 'dinheiro' ? aplicarMascaraDinheiro(texto) : aplicarMascaraQuantidade(texto);
}

/**
 * Rótulo sempre visível acima do campo — placeholder como rótulo desaparece
 * quando o usuário digita, justo quando ele mais precisa saber o que é.
 */
export function CampoTexto({ rotulo, erro, tipo, ...props }: CampoTextoProps) {
  const tema = useTheme();
  const [focado, setFocado] = useState(false);
  const corDoDivisor = erro
    ? tema.state.critico
    : focado
      ? tema.action.azulejo
      : tema.line.hairline;

  return (
    <View style={{ gap: espaco.xs }}>
      <Texto papel="label" tom="secondary">
        {rotulo}
      </Texto>
      <TextInput
        {...props}
        accessibilityLabel={rotulo}
        placeholder={props.placeholder ?? (tipo ? PLACEHOLDER_POR_TIPO[tipo] : undefined)}
        onChangeText={(texto) => {
          props.onChangeText?.(tipo ? aplicarMascara(texto, tipo) : texto);
        }}
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
}
