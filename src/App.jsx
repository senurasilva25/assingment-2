import Layout from './components/Layout';
import BookingPage from './pages/BookingPage';
import FaqPage from './pages/FaqPage';
import ExtensionPage from './pages/ExtensionPage';

export default function App() {
  const isFaq = window.location.pathname.endsWith('/faq.html');
  const isExtension = window.location.pathname.endsWith('/extension.html');
  return (
    <Layout isFaq={isFaq} isExtension={isExtension}>
      {isFaq ? <FaqPage /> : isExtension ? <ExtensionPage /> : <BookingPage />}
    </Layout>
  );
}
