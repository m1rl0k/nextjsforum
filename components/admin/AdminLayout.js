import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/AdminLayout.module.css';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is admin or moderator and redirect if not
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
      router.push('/');
    }
  }, [user, router]);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.adminContainer}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button className={styles.menuButton} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <h1>Admin Panel</h1>
      </header>

      
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMenuOpen ? styles.menuOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>Admin Panel</h2>
        </div>
        
        <nav className={`${styles.nav} adminNav`}>
          <ul>
            <li className={styles.forumLink}>
              <Link href="/">← Back to Forum</Link>
            </li>
            <li className={styles.divider}></li>
            <li className={isActive('/admin/dashboard')}>
              <Link href="/admin/dashboard">Dashboard</Link>
            </li>
            <li className={isActive('/admin/users')}>
              <Link href="/admin/users">Users</Link>
            </li>
            <li className={isActive('/admin/forums')}>
              <Link href="/admin/forums">Forums</Link>
            </li>
            <li className={isActive('/admin/threads')}>
              <Link href="/admin/threads">Threads</Link>
            </li>
            <li className={isActive('/admin/posts')}>
              <Link href="/admin/posts">Posts</Link>
            </li>
            <li className={isActive('/admin/reports')}>
              <Link href="/admin/reports">Reports</Link>
            </li>
            <li className={isActive('/admin/content')}>
              <Link href="/admin/content">Content Management</Link>
            </li>
            <li className={isActive('/admin/templates')}>
              <Link href="/admin/templates">Templates</Link>
            </li>
            <li className={isActive('/admin/upload-settings')}>
              <Link href="/admin/upload-settings">Upload Settings</Link>
            </li>
            <li className={isActive('/admin/backup')}>
              <Link href="/admin/backup">Backup & Export</Link>
            </li>
            <li className={isActive('/admin/settings')}>
              <Link href="/admin/settings">Settings</Link>
            </li>
          </ul>
          
          <div className={styles.userMenu}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.username}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div className={styles.overlay} onClick={toggleMenu}></div>
      )}

      {/* Main content */}
      <main className={`${styles.mainContent} adminContent`}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
