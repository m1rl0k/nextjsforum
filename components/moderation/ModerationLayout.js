import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/ModerationLayout.module.css';

const ModerationLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <h2>🛡️ Moderation</h2>
          </Link>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        </div>

        <nav className={styles.nav}>
          <ul>
            <li className={isActive('/moderation')}>
              <Link href="/moderation">Dashboard</Link>
            </li>
            <li className={isActive('/moderation/reports')}>
              <Link href="/moderation/reports">Reports</Link>
            </li>
            <li className={isActive('/moderation/pending')}>
              <Link href="/moderation/pending">Pending Content</Link>
            </li>
            <li className={isActive('/moderation/content')}>
              <Link href="/moderation/content">Content Management</Link>
            </li>
            <li className={isActive('/moderation/users')}>
              <Link href="/moderation/users">User Management</Link>
            </li>
            <li className={isActive('/moderation/logs')}>
              <Link href="/moderation/logs">Moderation Logs</Link>
            </li>
            <li className={isActive('/moderation/settings')}>
              <Link href="/moderation/settings">Settings</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.username}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
          <div className={styles.actions}>
            <Link href="/" className={styles.backToForum}>
              ← Back to Forum
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin/dashboard" className={styles.adminPanel}>
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ModerationLayout;
