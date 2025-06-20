import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navigation from './Navigation';

export default function Layout({ children, title = 'NextJS Forum' }) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="A vBulletin/phpBB style forum built with Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <div className="container">
        <main>{children}</main>

        <div className="stats-bar">
          Currently <strong>3</strong> users online. <strong>2</strong> members and <strong>1</strong> guest
        </div>

        <footer className="footer">
          Powered by NextJS Forum &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}
