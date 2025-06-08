import { useState, useEffect } from 'react';
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

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch(e);
    }
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <Link href="/">
            {themeSettings?.logoUrl ? (
              <img
                src={themeSettings.logoUrl}
                alt={themeSettings.siteName || 'NextJS Forum'}
                className={styles.logoImage}
              />
            ) : (
              <span className={styles.logoText}>
                {themeSettings?.siteName || 'NextJS Forum'}
              </span>
            )}
          </Link>
        </div>

        <form className={styles.search} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search forums..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
          <button type="submit" className={styles.searchButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>

        <div className={styles.navLinks}>
          <div className={styles.mainLinks}>
            <Link href="/" className={router.pathname === '/' ? styles.active : ''}>
              Home
            </Link>
            <Link href="/members" className={router.pathname === '/members' ? styles.active : ''}>
              Members
            </Link>
            <Link href="/search" className={router.pathname === '/search' ? styles.active : ''}>
              Search
            </Link>
          </div>

          {loading ? (
            <div className={styles.authPlaceholder}>
              {/* Invisible placeholder during loading */}
            </div>
          ) : (
            user ? (
              <div className={styles.userMenu}>
                <NotificationDropdown />
                <Link href="/messages" className={styles.messageLink} title="Messages">
                  ✉️
                </Link>
                <div className={styles.userDropdown}>
                  <Link href={`/profile/${user.username}`} className={styles.userLink}>
                    <span className={styles.avatar}>
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                    {user.username}
                    <span className={styles.dropdownArrow}>▼</span>
                  </Link>
                  <div className={styles.dropdown}>
                    <Link href={`/profile/${user.username}`}>My Profile</Link>
                    <Link href="/account/settings">Settings</Link>
                    <Link href="/notifications">Notifications</Link>
                    <Link href="/messages">Messages</Link>
                    {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
                      <Link href="/admin/moderation">Moderation</Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link href="/admin/dashboard">Admin Panel</Link>
                    )}
                    <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link href="/login" className={styles.loginLink}>
                  Log In
                </Link>
                <Link href="/register" className={styles.registerButton}>
                  Sign Up
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
