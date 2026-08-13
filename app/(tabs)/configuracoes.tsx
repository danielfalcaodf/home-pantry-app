import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { useExportarBackup } from '@/application/backup/use-exportar-backup';
import { useExportarDados } from '@/application/backup/use-exportar-dados';
import { useRestaurarBackup } from '@/application/backup/use-restaurar-backup';
import { useUltimoBackup } from '@/application/backup/use-ultimo-backup';
import { Botao } from '@/presentation/components/botao';
import { BotaoVoltar } from '@/presentation/components/botao-voltar';
import { Texto } from '@/presentation/components/texto';
import { Toast } from '@/presentation/components/toast';
import { formatarDataDoUltimoBackup } from '@/presentation/format/data-do-backup';
import { ALVO_TOQUE_MINIMO, espaco, raio } from '@/presentation/theme/espaco';
import { useEscolherTema, usePreferenciaDeTema, useTheme } from '@/presentation/theme/provider';
import { PreferenciaDeTema } from '@/presentation/theme/resolver';

const OPCOES_TEMA: { valor: PreferenciaDeTema; rotulo: string }[] = [
  { valor: 'automatico', rotulo: 'Automático' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: espaco.lg, paddingTop: espaco.xl, gap: espaco.md }}>
      <Texto papel="label" tom="secondary">
        {titulo}
      </Texto>
      {children}
    </View>
  );
}

export default function Configuracoes() {
  const tema = useTheme();
  const preferencia = usePreferenciaDeTema();
  const escolherTema = useEscolherTema();

  const backup = useExportarBackup();
  const dados = useExportarDados();
  const restauracao = useRestaurarBackup();
  const ultimoBackup = useUltimoBackup();

  async function fazerBackupAgora() {
    // Sem confirmação (task 6.5): exportar nunca altera dados existentes.
    await backup.exportar();
    await ultimoBackup.recarregar();
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: espaco.sm,
          paddingHorizontal: espaco.lg,
          paddingTop: espaco.lg,
          paddingBottom: espaco.sm,
        }}
      >
        <BotaoVoltar />
        <Texto papel="display.sm">Configurações</Texto>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: espaco.xxxl }}>
        <Secao titulo="Tema">
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            {OPCOES_TEMA.map((opcao) => {
              const ativo = preferencia === opcao.valor;
              return (
                <Pressable
                  key={opcao.valor}
                  onPress={() => void escolherTema(opcao.valor)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tema ${opcao.rotulo}`}
                  accessibilityState={{ selected: ativo }}
                  style={{
                    minHeight: ALVO_TOQUE_MINIMO,
                    justifyContent: 'center',
                    paddingVertical: espaco.sm,
                    paddingHorizontal: espaco.md,
                    borderRadius: raio.campo,
                    borderWidth: 1,
                    borderColor: ativo ? tema.action.azulejo : tema.line.hairline,
                  }}
                >
                  <Texto papel="body.md" cor={ativo ? tema.action.azulejo : undefined}>
                    {opcao.rotulo}
                  </Texto>
                </Pressable>
              );
            })}
          </View>
        </Secao>

        <Secao titulo="Seus dados">
          <View style={{ gap: espaco.xs }}>
            <Botao
              titulo="Fazer backup agora"
              onPress={() => void fazerBackupAgora()}
              disabled={backup.exportando}
            />
            <Texto papel="caption" tom="secondary">
              {formatarDataDoUltimoBackup(ultimoBackup.ultimoBackupEm)}
            </Texto>
          </View>

          <View style={{ gap: espaco.xs }}>
            <Botao
              titulo="Restaurar backup"
              variante="secundario"
              onPress={() => void restauracao.selecionar()}
            />
            {/* Ação destrutiva sinalizada pela descrição do efeito, não só pela cor (task 6.4). */}
            <Texto papel="caption" tom="secondary">
              Substitui os dados existentes pelos deste backup. Não pode ser desfeito.
            </Texto>
          </View>

          <View style={{ gap: espaco.xs }}>
            <Botao
              titulo="Exportar meus dados (CSV)"
              variante="secundario"
              onPress={() => void dados.exportar()}
              disabled={dados.exportando}
            />
            {/* Rótulo distinto de backup (task 5.3/design D7): planilha legível, não restaurável. */}
            <Texto papel="caption" tom="secondary">
              Uma planilha com o que está na despensa hoje — não é uma cópia de segurança.
            </Texto>
          </View>
        </Secao>

        <Secao titulo="Diagnóstico">
          <Botao
            titulo="Verificar consistência"
            variante="secundario"
            onPress={() => router.push('/diagnostico')}
          />
        </Secao>

        <Secao titulo="Despensa">
          {/* Recalibração semanal (ARQUITETURA §1.1) — saiu do cabeçalho da
            Despensa (que agora só tem os ícones de buscar/adicionar) e
            passou a ficar aqui, junto das outras ações de baixa frequência. */}
          <Botao
            titulo="Conferência da despensa"
            variante="secundario"
            onPress={() => router.push('/conferencia')}
          />
        </Secao>
      </ScrollView>

      {restauracao.estado.fase === 'confirmando' ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: tema.bg.raised,
            padding: espaco.lg,
            gap: espaco.sm,
            borderTopWidth: 1,
            borderTopColor: tema.line.hairline,
          }}
        >
          <Texto papel="body.md">
            Restaurar {restauracao.estado.resumo.totalProdutos} produtos e{' '}
            {restauracao.estado.resumo.totalMovimentos} movimentos deste backup? Isso sobrescreve os
            dados existentes.
          </Texto>
          <View style={{ flexDirection: 'row', gap: espaco.sm }}>
            <Botao
              titulo="Cancelar"
              variante="secundario"
              onPress={restauracao.cancelar}
              style={{ flex: 1 }}
            />
            <Botao
              titulo="Restaurar"
              onPress={() => void restauracao.confirmar()}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}

      {restauracao.estado.fase === 'erro' ? (
        <Toast mensagem={restauracao.estado.mensagem} onFim={restauracao.cancelar} />
      ) : null}
      {restauracao.estado.fase === 'concluido' ? (
        <Toast
          mensagem={
            restauracao.estado.divergencias.length === 0
              ? 'Backup restaurado.'
              : `Backup restaurado — ${restauracao.estado.divergencias.length} produto(s) com divergência.`
          }
          onFim={restauracao.cancelar}
        />
      ) : null}
    </View>
  );
}
