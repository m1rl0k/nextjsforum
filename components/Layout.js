import { useRouter } from 'next/router';
import Navigation from './Navigation';
import PreviewBanner from './PreviewBanner';
import SEO from './SEO';

export default function Layout({
  children,
  title,
  description,
  keywords,
  image,
  type,
  article,
  profile,
  noindex
}) {
  const router = useRouter();

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={keywords}
        image={image}
        url={router.asPath}
        type={type}
        article={article}
        profile={profile}
        noindex={noindex}
      />

      <PreviewBanner />
      <Navigation />

      <div className="container">
        <main>{children}</main>

        <footer className="footer">
          Powered by NextJS Forum &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </>
  );
}
