import { useLocalSearchParams, useRouter } from 'expo-router';
import { ConditionResultsScreen } from '../../src/screens/ConditionResultsScreen';

export default function ConditionPage() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();

  const navigation = {
    navigate: (screen: string) => {
      if (screen === 'Results') router.push('/results');
    },
  };

  const route = { params: { conditionId: id ?? '', conditionName: decodeURIComponent(name ?? '') } };

  return <ConditionResultsScreen navigation={navigation} route={route} />;
}
