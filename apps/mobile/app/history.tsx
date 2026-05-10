import { useRouter } from 'expo-router';
import { HistoryScreen } from '../src/screens/HistoryScreen';

export default function HistoryPage() {
  const router = useRouter();

  const navigation = {
    navigate: (screen: string) => {
      if (screen === 'Results') router.push('/results');
    },
  };

  return <HistoryScreen navigation={navigation} />;
}
