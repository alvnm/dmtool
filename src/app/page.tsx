import MainApp from '@/components/MainApp';
import { I18nProvider } from '@/lib/i18n';

export default function Home() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
}
