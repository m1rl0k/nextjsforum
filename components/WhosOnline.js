import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/WhosOnline.module.css';

export default function WhosOnline() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const res = await fetch('/api/stats/online');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching online users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
    // Refresh every 60 seconds
    const interval = setInterval(fetchOnlineUsers, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRoleClass = (role) => {
    switch (role) {
      case 'ADMIN': return styles.admin;
      case 'MODERATOR': return styles.moderator;
      default: return styles.member;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.icon}>👥</span>
        <span className={styles.title}>Who's Online</span>
        <span className={styles.toggle}>{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <>
              <div className={styles.stats}>
                <span className={styles.statItem}>
                  <strong>{data?.total || 0}</strong> users online
                </span>
                <span className={styles.statSeparator}>•</span>
                <span className={styles.statItem}>
                  <strong>{data?.members || 0}</strong> members
                </span>
                <span className={styles.statSeparator}>•</span>
                <span className={styles.statItem}>
                  <strong>{data?.guests || 0}</strong> guests
                </span>
              </div>

              {data?.onlineUsers && data.onlineUsers.length > 0 && (
                <div className={styles.userList}>
                  <div className={styles.userListLabel}>Members online:</div>
                  <div className={styles.users}>
                    {data.onlineUsers.map((user, index) => (
                      <span key={user.id}>
                        <Link href={`/profile/${user.username}`} className={getRoleClass(user.role)}>
                          {user.username}
                        </Link>
                        {index < data.onlineUsers.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.adminDot}`}></span>
                  Administrator
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.modDot}`}></span>
                  Moderator
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.memberDot}`}></span>
                  Member
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

