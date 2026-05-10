import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProspectScreen } from '../../src/screens/ProspectScreen';

export default function ProspectPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const navigation = {
    goBack: () => router.back(),
  };

  const route = { params: { medicineId: id ?? '' } };

  return <ProspectScreen navigation={navigation} route={route} />;
}
