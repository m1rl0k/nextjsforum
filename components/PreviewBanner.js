import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/PreviewBanner.module.css';

const PreviewBanner = () => {
  const router = useRouter();
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsPreview(urlParams.get('preview') === 'true');
  }, [router.asPath]);

  const handleExitPreview = () => {
    // Clear preview settings
    sessionStorage.removeItem('previewTheme');
    // Navigate back to templates page
    router.push('/admin/templates');
  };

  if (!isPreview) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.info}>
          <span className={styles.icon}>👁️</span>
          <div>
            <strong>Preview Mode Active</strong>
            <p>You're viewing the forum with unsaved theme changes</p>
          </div>
        </div>
        <button onClick={handleExitPreview} className={styles.exitButton}>
          ← Back to Theme Editor
        </button>
      </div>
    </div>
  );
};

export default PreviewBanner;

