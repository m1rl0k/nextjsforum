import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import NotificationDropdown from './NotificationDropdown';
import styles from '../styles/Navigation.module.css';

const Navigation = () => {
  const { user, logout, loading } = useAuth();
  const { themeSettings } = useTheme();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch(e);
    }
  };

  return (
    <header className={styles.header}>
      {/* Top Bar - User info / Login */}
      <div className={styles.topBar}>
        <div className={styles.topBarContainer}>
          <div className={styles.topBarLeft}>
            {loading ? (
              <span className={styles.topBarText}>Loading...</span>
            ) : user ? (
              <>
                <span className={styles.topBarText}>Welcome back, </span>
                <Link href={`/profile/${user.username}`} className={styles.topBarLink}>
                  <strong>{user.username}</strong>
                </Link>
                <span className={styles.topBarSeparator}>|</span>
                <Link href="/messages" className={styles.topBarLink}>
                  Messages
                </Link>
                <span className={styles.topBarSeparator}>|</span>
                <Link href="/notifications" className={styles.topBarLink}>
                  Notifications
                </Link>
                {user.role === 'ADMIN' && (
                  <>
                    <span className={styles.topBarSeparator}>|</span>
                    <Link href="/admin/dashboard" className={styles.topBarLink}>
                      Admin CP
                    </Link>
                  </>
                )}
                {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                  <>
                    <span className={styles.topBarSeparator}>|</span>
                    <Link href="/moderation" className={styles.topBarLink}>
                      Mod CP
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <span className={styles.topBarText}>Welcome, Guest! </span>
                <Link href="/login" className={styles.topBarLink}>Log In</Link>
                <span className={styles.topBarSeparator}>|</span>
                <Link href="/register" className={styles.topBarLink}>Register</Link>
              </>
            )}
          </div>
          <div className={styles.topBarRight}>
            {user && (
              <>
                <NotificationDropdown />
                <button onClick={handleLogout} className={styles.topBarLogout}>
                  Log Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logo Bar */}
      <div className={styles.logoBar}>
        <div className={styles.logoBarContainer}>
          <div className={styles.logo}>
            <Link href="/">
              {themeSettings?.logoEnabled && themeSettings?.logoUrl ? (
                <img
                  src={themeSettings.logoUrl}
                  alt={themeSettings?.siteName || 'NextJS Forum'}
                  className={styles.logoImage}
                />
              ) : (
                <span className={styles.logoText}>
                  {themeSettings?.siteName || 'NextJS Forum'}
                </span>
              )}
            </Link>
          </div>

          <form className={styles.search} onSubmit={handleSearch} role="search">
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              aria-label="Search forums"
            />
            <button type="submit" className={styles.searchButton} aria-label="Submit search">
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Bar - vBulletin style tabs */}
      <nav className={styles.navbar}>
        <div className={styles.navbarContainer}>
          {/* Mobile menu toggle */}
          <button
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            ☰ Menu
          </button>

          <ul className={`${styles.navTabs} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
            <li className={router.pathname === '/' ? styles.activeTab : ''}>
              <Link href="/">Forum</Link>
            </li>
            <li className={router.pathname === '/members' || router.pathname.startsWith('/profile') ? styles.activeTab : ''}>
              <Link href="/members">Members List</Link>
            </li>
            <li className={router.pathname === '/search' ? styles.activeTab : ''}>
              <Link href="/search">Search</Link>
            </li>
            {user && (
              <>
                <li className={router.pathname === '/messages' ? styles.activeTab : ''}>
                  <Link href="/messages">Private Messages</Link>
                </li>
                <li className={router.pathname === '/account/settings' ? styles.activeTab : ''}>
                  <Link href="/account/settings">Settings</Link>
                </li>
              </>
            )}
            <li className={styles.quickLinks}>
              <span className={styles.quickLinksToggle}>Quick Links ▼</span>
              <ul className={styles.quickLinksDropdown}>
                <li><Link href="/">Today&apos;s Posts</Link></li>
                <li><Link href="/members">Member List</Link></li>
                {user && <li><Link href={`/profile/${user.username}`}>My Profile</Link></li>}
                <li><Link href="/search">Advanced Search</Link></li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;
