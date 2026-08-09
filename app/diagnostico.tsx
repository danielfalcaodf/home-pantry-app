import { Pressable, View } from 'react-native';

import { useDiagnostico } from '@/application/backup/use-diagnostico';
import { formatarNumero } from '@/domain/shared/quantidade';
import { Botao } from '@/presentation/components/botao';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { Texto } from '@/presentation/components/texto';
import { espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

/**
 * Verificação sob demanda (task 4.1) — compara a quantidade materializada
 * com a soma dos movimentos, sem nenhuma escrita (task 4.3). Corrigir é
 * sempre uma ação separada, nunca automática (task 4.6).
 */
export default function Diagnostico() {
  const tema = useTheme();
  const diagnostico = useDiagnostico();

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base, padding: espaco.lg, gap: espaco.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
        <BotaoVoltar />
        <Texto papel="display.sm">Diagnóstico</Texto>
      </View>
      <Texto papel="body.md" tom="secondary">
        Compara o que está registrado com a soma do histórico de cada item.
      </Texto>

      <Botao
        titulo="Verificar consistência"
        onPress={() => void diagnostico.verificar()}
        disabled={diagnostico.verificando}
      />

      {diagnostico.verificado && diagnostico.divergencias.length === 0 ? (
        <Texto papel="body.md">Tudo certo — nenhuma divergência encontrada.</Texto>
      ) : null}

      {diagnostico.divergencias.length > 0 ? (
        <View style={{ gap: espaco.md }}>
          <Texto papel="body.md">
            {diagnostico.divergencias.length === 1
              ? '1 item com divergência entre o valor registrado e o histórico.'
              : `${diagnostico.divergencias.length} itens com divergência entre o valor registrado e o histórico.`}
          </Texto>
          {diagnostico.divergencias.map((divergencia) => (
            <View
              key={divergencia.produtoId}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: espaco.sm,
              }}
            >
              <View style={{ gap: espaco.xs }}>
                <Texto papel="body.md">{divergencia.nome}</Texto>
                <Texto papel="data.md" tom="secondary">
                  registrado {formatarNumero(divergencia.materializado)} · histórico{' '}
                  {formatarNumero(divergencia.calculado)}
                </Texto>
              </View>
              <Pressable
                onPress={() => void diagnostico.corrigir(divergencia.produtoId)}
                accessibilityRole="button"
                accessibilityLabel={`Corrigir ${divergencia.nome}`}
              >
                <Texto papel="body.md" cor={tema.action.azulejo}>
                  Corrigir
                </Texto>
              </Pressable>
            </View>
          ))}
          <Botao
            titulo="Corrigir tudo"
            variante="secundario"
            onPress={() => void diagnostico.corrigirTudo()}
          />
        </View>
      ) : null}
    </View>
  );
}
