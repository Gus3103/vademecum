import { useRouter } from 'expo-router';
import { SearchScreen } from '../src/screens/SearchScreen';

export default function IndexPage() {
  const router = useRouter();

  const navigation = {
    navigate: (screen: string, params?: Record<string, string>) => {
      if (screen === 'Results') router.push('/results');
      else if (screen === 'Prospect' && params?.medicineId)
        router.push(`/prospect/${params.medicineId}`);
      else if (screen === 'ConditionResults' && params?.conditionId)
        router.push(`/condition/${params.conditionId}?name=${encodeURIComponent(params.conditionName ?? '')}`);
      else if (screen === 'Interactions') router.push('/interactions');
      else if (screen === 'History') router.push('/history');
    },
  };

  return <SearchScreen navigation={navigation} />;
}
