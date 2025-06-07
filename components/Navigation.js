import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navigation.module.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <Link href="/">Forum</Link>
        </div>
        
        <div className={styles.search}>
          <input 
            type="text" 
            placeholder="Search forums..." 
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <div className={styles.navLinks}>
          <Link href="/" className={router.pathname === '/' ? styles.active : ''}>
            Home
          </Link>
          <Link href="/forums" className={router.pathname === '/forums' ? styles.active : ''}>
            Forums
          </Link>
          <Link href="/members" className={router.pathname === '/members' ? styles.active : ''}>
            Members
          </Link>
          
          {user ? (
            <div className={styles.userMenu}>
              <Link href={`/profile/${user.username}`} className={styles.userLink}>
                <span className={styles.avatar}>
                  {user.username.charAt(0).toUpperCase()}
                </span>
                {user.username}
              </Link>
              <div className={styles.dropdown}>
                <Link href="/account/settings">Settings</Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin/dashboard">Admin Panel</Link>
                )}
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className={styles.loginLink}>
                Log In
              </Link>
              <Link href="/register" className={styles.registerButton}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
