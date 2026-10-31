import { Redirect } from 'expo-router';
import { useApp } from '../store';

export default function Index() {
  const token = useApp((s) => s.token);
  return <Redirect href={token ? '/home' : '/onboarding'} />;
}
