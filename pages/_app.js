import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/Layout';
import '../styles/globals.css';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Add any global layout or providers here
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}

export default MyApp;
