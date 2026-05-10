import { useRouter } from 'expo-router';
import { ResultsScreen } from '../src/screens/ResultsScreen';

export default function ResultsPage() {
  const router = useRouter();

  const navigation = {
    navigate: (screen: string, params?: Record<string, string>) => {
      if (screen === 'Prospect' && params?.medicineId)
        router.push(`/prospect/${params.medicineId}`);
    },
    goBack: () => router.back(),
  };

  return <ResultsScreen navigation={navigation} />;
}
