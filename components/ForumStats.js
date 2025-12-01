import Link from 'next/link';
import styles from '../styles/ForumStats.module.css';

export default function ForumStats({ stats }) {
  if (!stats) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>📊</span>
        <span className={styles.title}>Forum Statistics</span>
      </div>
      
      <div className={styles.content}>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statValue}>{stats.totalThreads?.toLocaleString() || 0}</div>
            <div className={styles.statLabel}>Threads</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue}>{stats.totalPosts?.toLocaleString() || 0}</div>
            <div className={styles.statLabel}>Posts</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statValue}>{stats.totalMembers?.toLocaleString() || 0}</div>
            <div className={styles.statLabel}>Members</div>
          </div>
        </div>

        {stats.newestMember && (
          <div className={styles.newestMember}>
            <span className={styles.welcomeIcon}>🎉</span>
            <span>Welcome to our newest member, </span>
            <Link href={`/profile/${stats.newestMember.username}`} className={styles.memberLink}>
              {stats.newestMember.username}
            </Link>
            <span>!</span>
          </div>
        )}

        {stats.mostActiveThread && (
          <div className={styles.activeThread}>
            <span className={styles.hotIcon}>🔥</span>
            <span>Most active: </span>
            <Link href={`/threads/${stats.mostActiveThread.id}`} className={styles.threadLink}>
              {stats.mostActiveThread.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

