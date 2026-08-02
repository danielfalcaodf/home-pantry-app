import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { usePrepararBanco } from '@/composicao/banco';
import { obterIdentidadeLocal } from '@/composicao/repositorios';

function TelaCarregando() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Preparando sua despensa…</Text>
    </View>
  );
}

function TelaErroMigration({ mensagem }: { mensagem: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
        Não foi possível preparar seus dados
      </Text>
      <Text>
        Feche e abra o app de novo. Se continuar, reinstale a versão anterior — seus dados têm
        uma cópia de segurança automática.
      </Text>
      <Text style={{ marginTop: 16, fontSize: 12 }}>{mensagem}</Text>
    </View>
  );
}

export default function RootLayout() {
  const { pronto, erro } = usePrepararBanco();

  if (erro) {
    return <TelaErroMigration mensagem={erro.message} />;
  }
  if (!pronto) {
    return <TelaCarregando />;
  }

  obterIdentidadeLocal();

  return <Stack />;
}
