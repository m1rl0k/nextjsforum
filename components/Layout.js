import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children, title = 'NextJS Forum' }) {
  const router = useRouter();
  
  return (
    <div className="container">
      <Head>
        <title>{title}</title>
        <meta name="description" content="A style forum built with Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <h1><Link href="/">NextJS Forum</Link></h1>
        <div className="user-nav">
          <Link href="/login">Login</Link> | <Link href="/register">Register</Link>
        </div>
      </header>

      <nav className="navbar">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/members">Members</Link></li>
          <li><Link href="/search">Search</Link></li>
          <li><Link href="/help">Help</Link></li>
        </ul>
      </nav>

      <div className="breadcrumbs">
        <Link href="/">Forum Index</Link>
        {router.pathname !== '/' && <span> &raquo; {title}</span>}
      </div>

      <main>{children}</main>

      <div className="stats-bar">
        Currently <strong>3</strong> users online. <strong>2</strong> members and <strong>1</strong> guest
      </div>

      <footer className="footer">
        Powered by NextJS Forum &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
