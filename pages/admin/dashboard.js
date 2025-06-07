import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminDashboard.module.css';

const AdminDashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0,
    threads: 0,
    posts: 0,
    categories: 0,
    forums: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/admin/dashboard');
      return;
    }

    if (user?.role !== 'ADMIN' && !loading) {
      router.push('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [statsRes, usersRes, postsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users?limit=5'),
          fetch('/api/admin/posts?limit=5')
        ]);

        if (!statsRes.ok || !usersRes.ok || !postsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [statsData, usersData, postsData] = await Promise.all([
          statsRes.json(),
          usersRes.json(),
          postsRes.json()
        ]);

        setStats(statsData.data);
        setRecentUsers(usersData.data);
        setRecentPosts(postsData.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchDashboardData();
    }
  }, [isAuthenticated, loading, router, user]);

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading dashboard...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.dashboard}>
        <h1>Admin Dashboard</h1>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Users</h3>
            <p className={styles.statNumber}>{stats.users}</p>
            <p className={styles.statLabel}>Total Registered</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Threads</h3>
            <p className={styles.statNumber}>{stats.threads}</p>
            <p className={styles.statLabel}>Total Threads</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Posts</h3>
            <p className={styles.statNumber}>{stats.posts}</p>
            <p className={styles.statLabel}>Total Posts</p>
          </div>
          
          <div className={styles.statCard}>
            <h3>Categories</h3>
            <p className={styles.statNumber}>{stats.categories}</p>
            <p className={styles.statLabel}>Total Categories</p>
          </div>
        </div>
        
        <div className={styles.recentActivity}>
          <div className={styles.recentSection}>
            <h2>Recent Users</h2>
            {recentUsers.length > 0 ? (
              <ul className={styles.userList}>
                {recentUsers.map((user) => (
                  <li key={user.id} className={styles.userItem}>
                    <span className={styles.userName}>{user.username}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                    <span className={styles.userDate}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent users</p>
            )}
          </div>
          
          <div className={styles.recentSection}>
            <h2>Recent Posts</h2>
            {recentPosts.length > 0 ? (
              <ul className={styles.postList}>
                {recentPosts.map((post) => (
                  <li key={post.id} className={styles.postItem}>
                    <div className={styles.postContent}>
                      <span className={styles.postTitle}>
                        {post.thread?.title || 'Untitled Thread'}
                      </span>
                      <span className={styles.postExcerpt}>
                        {post.content.substring(0, 80)}...
                      </span>
                    </div>
                    <div className={styles.postMeta}>
                      <span className={styles.postAuthor}>
                        by {post.author?.username || 'Unknown'}
                      </span>
                      <span className={styles.postDate}>
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent posts</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
