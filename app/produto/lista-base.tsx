import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useListaBase } from '@/application/estoque/use-lista-base';
import { formatarQuantidade } from '@/domain/shared/quantidade';
import { Botao } from '@/presentation/components/botao';
import { Texto } from '@/presentation/components/texto';
import { ALTURA_ITEM, ALVO_TOQUE_MINIMO, espaco } from '@/presentation/theme/espaco';
import { useTheme } from '@/presentation/theme/provider';

export default function ListaBase() {
  const tema = useTheme();
  const { itens, adotar, adotando, falhou } = useListaBase();
  // Tudo marcado por padrão: o atrito que se quer evitar é o de cadastrar,
  // não o de desmarcar (design D7).
  const [desmarcados, setDesmarcados] = useState<ReadonlySet<string>>(new Set());

  const escolhidos = itens.filter((item) => !desmarcados.has(item.nome));

  function alternar(nome: string) {
    setDesmarcados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(nome)) {
        proximo.delete(nome);
      } else {
        proximo.add(nome);
      }
      return proximo;
    });
  }

  async function confirmar() {
    if (await adotar(escolhidos)) {
      router.back();
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg.base }}>
      <View style={{ padding: espaco.lg, gap: espaco.xs }}>
        <Texto papel="display.sm">O básico de uma casa</Texto>
        <Texto papel="body.md" tom="secondary">
          Desmarque o que você não usa. Dá para ajustar tudo depois.
        </Texto>
      </View>

      <FlashList
        data={itens}
        keyExtractor={(item) => item.nome}
        renderItem={({ item }) => {
          const marcado = !desmarcados.has(item.nome);
          return (
            <Pressable
              onPress={() => alternar(item.nome)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcado }}
              accessibilityLabel={item.nome}
              style={{
                minHeight: ALVO_TOQUE_MINIMO,
                height: ALTURA_ITEM,
                paddingHorizontal: espaco.lg,
                borderBottomWidth: 1,
                borderBottomColor: tema.line.hairline,
                justifyContent: 'center',
                gap: espaco.xs,
                opacity: marcado ? 1 : 0.4,
              }}
            >
              <Texto papel="body.lg">{item.nome}</Texto>
              <Texto papel="label" tom="secondary">
                {item.categoria} · {formatarQuantidade(item.quantidadeNecessaria, item.unidade)}
              </Texto>
            </Pressable>
          );
        }}
      />

      <View style={{ padding: espaco.lg, gap: espaco.md }}>
        {falhou ? (
          <Texto papel="body.md" cor={tema.state.critico}>
            Nada foi adicionado. Toque em confirmar para tentar de novo.
          </Texto>
        ) : null}
        <Botao
          titulo={`Adicionar ${escolhidos.length} ${escolhidos.length === 1 ? 'item' : 'itens'}`}
          onPress={confirmar}
          disabled={adotando || escolhidos.length === 0}
        />
      </View>
    </View>
  );
}
