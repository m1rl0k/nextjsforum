import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import ThemeProvider from '../components/ThemeProvider';
import { ToastProvider } from '../components/Toast';
import '../styles/globals.css';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Add any global layout or providers here
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MyApp;
