import { MainScreen } from '@/components/main/main-screen';

const noop = () => undefined;

export function App() {
  return <MainScreen onLogin={noop} />;
}
