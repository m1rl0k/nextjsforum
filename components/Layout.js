import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import PreviewBanner from './PreviewBanner';

export default function Layout({ children, title = 'NextJS Forum' }) {
  const router = useRouter();
  const [onlineStats, setOnlineStats] = useState(null);

  useEffect(() => {
    // Fetch online user stats
    const fetchOnlineStats = async () => {
      try {
        const res = await fetch('/api/stats/online');
        if (res.ok) {
          const data = await res.json();
          setOnlineStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch online stats:', error);
      }
    };

    fetchOnlineStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchOnlineStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="A vBulletin/phpBB style forum built with Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <PreviewBanner />
      <Navigation />

      <div className="container">
        <main>{children}</main>

        <div className="stats-bar">
          {onlineStats ? (
            <>
              Currently <strong>{onlineStats.total}</strong> user{onlineStats.total !== 1 ? 's' : ''} online.
              <strong> {onlineStats.members}</strong> member{onlineStats.members !== 1 ? 's' : ''} and
              <strong> {onlineStats.guests}</strong> guest{onlineStats.guests !== 1 ? 's' : ''}
            </>
          ) : (
            'Loading online users...'
          )}
        </div>

        <footer className="footer">
          Powered by NextJS Forum &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}
