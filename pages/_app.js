import { AuthProvider } from '../context/AuthContext';
import ThemeProvider from '../components/ThemeProvider';
import { ToastProvider } from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // Add any global layout or providers here
  return (
    <ErrorBoundary message="Something went wrong loading the page. Please refresh or try again.">
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Component {...pageProps} />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
