import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function IndexScreen() {
  const { loading, userId } = useAuth();

  if (loading) return null;
  return <Redirect href={userId ? '/(tabs)/calculator' : '/login'} />;
}
