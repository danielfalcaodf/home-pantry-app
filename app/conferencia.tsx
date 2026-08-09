import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CONFERENCIA_TUDO, useConferencia } from '@/application/estoque/use-conferencia';
import { deDecimal, formatarNumero, paraDecimal } from '@/domain/shared/quantidade';
import { rotuloDaUnidade } from '@/domain/shared/unidade';
import { Botao } from '@/presentation/components/botao';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { CampoTexto } from '@/presentation/components/campo-texto';
import { EstadoVazio } from '@/presentation/components/estado-vazio';
import { Texto } from '@/presentation/components/texto';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

/**
 * Percurso guiado por categoria (task 3.1) — confirma por padrão, corrige
 * por exceção (design D4). Sem criar nem remover produto, sem diálogo extra.
 */
export default function Conferencia() {
  const tema = useTheme();
  const conferencia = useConferencia();
  const [valorCorrecao, setValorCorrecao] = useState('');

  if (conferencia.carregando) {
    return null;
  }

  if (conferencia.categoriaEscolhida === null) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg.base, padding: espaco.lg, gap: espaco.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
          <BotaoVoltar />
          <Texto papel="display.sm">O que você quer conferir?</Texto>
        </View>
        <Botao
          titulo="Conferir tudo"
          onPress={() => void conferencia.escolherCategoria(CONFERENCIA_TUDO)}
        />
        {conferencia.categorias.map((categoria) => (
          <Botao
            key={categoria}
            titulo={categoria}
            variante="secundario"
            onPress={() => void conferencia.escolherCategoria(categoria)}
          />
        ))}
      </View>
    );
  }

  if (conferencia.concluida) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg.base, padding: espaco.lg, gap: espaco.md }}>
        <EstadoVazio
          convite={
            conferencia.resumo
              ? `Conferência concluída: ${conferencia.resumo.corretos} estavam certos, ${conferencia.resumo.corrigidos} foram corrigidos.`
              : 'Conferência concluída.'
          }
          acao={{ titulo: 'Voltar para a despensa', onPress: () => router.back() }}
        />
      </View>
    );
  }

  const item = conferencia.itemAtual;
  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg.base, padding: espaco.lg }}>
        <EstadoVazio
          convite="Nenhum item nessa categoria."
          acao={{ titulo: 'Voltar para a despensa', onPress: () => router.back() }}
        />
      </View>
    );
  }

  async function confirmarEContinuar() {
    setValorCorrecao('');
    await conferencia.confirmar();
  }

  async function corrigirEContinuar() {
    const valor = Number(valorCorrecao.replace(',', '.'));
    if (!(valor >= 0)) {
      return;
    }
    setValorCorrecao('');
    // Corrige gravando o ajuste correspondente e avança — sem diálogo
    // adicional de confirmação (task 3.6).
    await conferencia.corrigir(deDecimal(valor));
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base, padding: espaco.lg, gap: espaco.lg }}>
      <Texto papel="label" tom="secondary">
        {conferencia.indice + 1} de {conferencia.itens.length} conferidos
      </Texto>

      <View style={{ gap: espaco.xs }}>
        <Texto papel="body.lg">{item.nome}</Texto>
        <Texto papel="display.lg">
          {formatarNumero(item.quantidadeAtual)} {rotuloDaUnidade(item.unidade, item.quantidadeAtual !== 1000)}
        </Texto>
      </View>

      <Botao titulo="Confirmar — está certo" onPress={() => void confirmarEContinuar()} />

      <View style={{ gap: espaco.sm }}>
        <CampoTexto
          rotulo="Corrigir para"
          value={valorCorrecao}
          onChangeText={setValorCorrecao}
          keyboardType="decimal-pad"
          placeholder={String(paraDecimal(item.quantidadeAtual)).replace('.', ',')}
        />
        <Botao
          titulo="Corrigir"
          variante="secundario"
          onPress={() => void corrigirEContinuar()}
          disabled={valorCorrecao.trim() === ''}
        />
      </View>
    </View>
  );
}
