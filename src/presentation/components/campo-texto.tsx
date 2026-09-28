import { forwardRef, useState } from 'react';
import { StyleProp, Text, TextInput, TextInputProps, TextStyle, View } from 'react-native';
import { createNumberMask, formatWithMask, Mask } from 'react-native-mask-input';

import { ALVO_TOQUE_MINIMO, espaco } from '../theme/espaco';
import { useTheme } from '../theme/provider';
import { tipografia } from '../theme/tipografia';
import { Texto } from './texto';

export type TipoDeCampo = 'quantidade' | 'peso' | 'dinheiro';

export type CampoTextoProps = Omit<TextInputProps, 'style'> & {
  rotulo: string;
  erro?: string;
  /** Aplica máscara de dígitos/vírgula e placeholder padrão do formato — a
   *  conversão pra milésimos/centavos continua acontecendo só na borda de
   *  salvar (domain/shared/), a máscara aqui só limpa o que é digitado. */
  tipo?: TipoDeCampo;
};

const ESPESSURA_FOCO = 2;
// Zera o padding horizontal padrão do EditText do Android (não é um valor da
// escala de espaçamento): o texto sobreposto da EntradaNumerica precisa
// começar no mesmo x que o texto nativo, e o campo alinha com o rótulo.
const SEM_PADDING_NATIVO = 0;
const PLACEHOLDER_POR_TIPO: Record<TipoDeCampo, string> = {
  dinheiro: 'R$ 0,00',
  peso: '0,000',
  quantidade: '0,000',
};
const CASAS_DECIMAIS_QUANTIDADE = 3;

// Dinheiro e peso (kg) são digitados "de caixa registradora": cada dígito
// entra pela direita e a vírgula se ajusta sozinha (5 → 0,05 → 0,51 → 5,19;
// em kg, 5 → 0,005 → 0,050 → 0,500). A formatação é do react-native-mask-input;
// a lib só desloca a vírgula quando há dígitos para preencher todas as casas
// (sem isso "500" em kg ficaria 500 kg, não 0,500), por isso os dígitos são
// completados com zeros à esquerda antes de formatar.
type MascaraNumerica = { mascara: Mask; casas: number; prefixo: string };

const MASCARAS: Record<'dinheiro' | 'peso', MascaraNumerica> = {
  dinheiro: {
    mascara: createNumberMask({ prefix: ['R', '$', ' '], delimiter: '.', separator: ',', precision: 2 }),
    casas: 2,
    prefixo: 'R$ ',
  },
  peso: {
    mascara: createNumberMask({ prefix: [], delimiter: '.', separator: ',', precision: 3 }),
    casas: 3,
    prefixo: '',
  },
};

function formatarDigitos(digitos: string, { mascara, casas }: MascaraNumerica): string {
  const semZerosAEsquerda = digitos.replace(/^0+/, '');
  if (semZerosAEsquerda === '') {
    return '';
  }
  return formatWithMask({ text: semZerosAEsquerda.padStart(casas + 1, '0'), mask: mascara }).masked;
}

/** Texto digitado → valor que sobe para quem usa o campo: decimal com vírgula,
 *  sem prefixo nem separador de milhar ("R$ 1.234,56" → "1234,56"), que é o
 *  formato que as telas já convertem com `Number(v.replace(',', '.'))`. */
export function mascararNumero(texto: string, tipo: 'dinheiro' | 'peso'): string {
  const config = MASCARAS[tipo];
  const exibido = formatarDigitos(texto.replace(/\D/g, ''), config);
  return exibido.replace(config.prefixo, '').replace(/\./g, '');
}

/** Valor controlado ("0,5", "12,90") → texto exibido. Lê como número, não
 *  como dígitos, para que um valor semeado com menos casas ("0,5" kg) não
 *  vire 0,005. */
export function exibirNumero(valor: string, tipo: 'dinheiro' | 'peso'): string {
  const config = MASCARAS[tipo];
  const numero = Number(valor.replace(',', '.'));
  if (valor.trim() === '' || !Number.isFinite(numero)) {
    return '';
  }
  return formatarDigitos(String(Math.round(numero * 10 ** config.casas)), config);
}

export type EntradaNumericaProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> & {
  tipo: 'dinheiro' | 'peso';
  valor: string;
  aoMudar?: (valor: string) => void;
  /** Fonte, tamanho e cor do número — aplicados ao texto exibido por cima. */
  estiloTexto: TextStyle;
  estilo?: StyleProp<TextStyle>;
};

/**
 * Campo "de caixa registradora" sem o piscar do TextInput controlado: o
 * nativo aplica a tecla antes do JS devolver o valor formatado, então um
 * TextInput que exibe a máscara mostra "5" e só depois "0,005" (Expo,
 * guides/controlled-components). Aqui o TextInput guarda só os dígitos —
 * exatamente o que foi digitado, nada a corrigir — com o texto
 * transparente, e o valor formatado é desenhado por cima num <Text>.
 * O cursor fica sempre no fim: nessa máscara todo dígito entra pela direita.
 */
export const EntradaNumerica = forwardRef<TextInput, EntradaNumericaProps>(function EntradaNumerica(
  { tipo, valor, aoMudar, estiloTexto, estilo, ...props },
  ref,
) {
  const exibido = exibirNumero(valor, tipo);
  const digitos = exibido.replace(/\D/g, '').replace(/^0+/, '');
  return (
    <View>
      <TextInput
        ref={ref}
        {...props}
        value={digitos}
        onChangeText={(texto) => aoMudar?.(mascararNumero(texto, tipo))}
        // Vazio não declara valor: senão o nome acessível vira "Rótulo, "
        // (vírgula solta no TalkBack, e o Maestro deixa de achar o campo pelo rótulo).
        accessibilityValue={exibido === '' ? undefined : { text: exibido }}
        selection={{ start: digitos.length, end: digitos.length }}
        caretHidden
        contextMenuHidden
        style={[estiloTexto, estilo, { paddingHorizontal: SEM_PADDING_NATIVO, color: 'transparent' }]}
      />
      {exibido !== '' ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center' }}
        >
          <Text style={estiloTexto} numberOfLines={1}>
            {exibido}
          </Text>
        </View>
      ) : null}
    </View>
  );
});

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

  const estiloTexto: TextStyle = {
    color: tema.text.primary,
    fontFamily: tipografia['body.md'].fontFamily,
    fontSize: tipografia['body.md'].fontSize,
  };
  const estiloCampo: TextStyle = {
    minHeight: ALVO_TOQUE_MINIMO,
    paddingVertical: espaco.md,
    paddingHorizontal: SEM_PADDING_NATIVO,
    borderBottomWidth: ESPESSURA_FOCO,
    borderBottomColor: corDoDivisor,
  };
  const eventosDeFoco = {
    onFocus: (evento: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setFocado(true);
      props.onFocus?.(evento);
    },
    onBlur: (evento: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setFocado(false);
      props.onBlur?.(evento);
    },
  };
  const placeholder = props.placeholder ?? (tipo ? PLACEHOLDER_POR_TIPO[tipo] : undefined);

  return (
    <View style={{ gap: espaco.xs }}>
      <Texto papel="label" tom="secondary">
        {rotulo}
      </Texto>
      {tipo === 'dinheiro' || tipo === 'peso' ? (
        <EntradaNumerica
          ref={ref}
          {...props}
          {...eventosDeFoco}
          tipo={tipo}
          valor={props.value ?? ''}
          aoMudar={props.onChangeText}
          accessibilityLabel={rotulo}
          placeholder={placeholder}
          placeholderTextColor={tema.text.secondary}
          estiloTexto={estiloTexto}
          estilo={estiloCampo}
        />
      ) : (
        <TextInput
          ref={ref}
          {...props}
          {...eventosDeFoco}
          onChangeText={(texto: string) =>
            props.onChangeText?.(tipo === 'quantidade' ? aplicarMascaraQuantidade(texto) : texto)
          }
          accessibilityLabel={rotulo}
          placeholder={placeholder}
          placeholderTextColor={tema.text.secondary}
          style={[estiloTexto, estiloCampo]}
        />
      )}
      {erro ? (
        <Texto papel="label" cor={tema.state.critico}>
          {erro}
        </Texto>
      ) : null}
    </View>
  );
});
