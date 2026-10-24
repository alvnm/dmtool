import MainApp from '@/components/MainApp';
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from '@/components/Toast';

export default function Home() {
  return (
    <I18nProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </I18nProvider>
  );
}
