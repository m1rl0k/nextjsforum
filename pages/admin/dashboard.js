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
        const headers = {
          'Content-Type': 'application/json'
        };

        // Use new commercial forum management API
        const dashboardRes = await fetch('/api/admin/forum-management?action=stats', {
          headers,
          credentials: 'include'
        });

        if (!dashboardRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashboardData = await dashboardRes.json();

        // Update stats with new commercial data structure
        setStats({
          users: dashboardData.forumStats?.totalUsers || 0,
          threads: dashboardData.forumStats?.totalThreads || 0,
          posts: dashboardData.forumStats?.totalPosts || 0,
          subjects: dashboardData.contentStats?.subjects || 0,
          categories: dashboardData.contentStats?.categories || 0,
          onlineUsers: dashboardData.forumStats?.onlineUsers || 0,
          pendingReports: dashboardData.contentStats?.pendingReports || 0
        });

        setRecentUsers(dashboardData.recentActivity?.users || []);
        setRecentPosts(dashboardData.recentActivity?.threads || []); // Using threads as "posts" for now
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
            <h3>👥 Users</h3>
            <p className={styles.statNumber}>{stats.users}</p>
            <p className={styles.statLabel}>
              {stats.onlineUsers} online now
            </p>
          </div>

          <div className={styles.statCard}>
            <h3>💬 Threads</h3>
            <p className={styles.statNumber}>{stats.threads}</p>
            <p className={styles.statLabel}>
              {stats.subjects} subjects
            </p>
          </div>

          <div className={styles.statCard}>
            <h3>📝 Posts</h3>
            <p className={styles.statNumber}>{stats.posts}</p>
            <p className={styles.statLabel}>
              {stats.categories} categories
            </p>
          </div>

          <div className={styles.statCard}>
            <h3>⚠️ Reports</h3>
            <p className={styles.statNumber}>{stats.pendingReports}</p>
            <p className={styles.statLabel}>
              Pending review
            </p>
          </div>
        </div>

        {/* Quick Actions for Commercial Features */}
        <div className={styles.quickActions}>
          <h2>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/users')}
            >
              👥 Manage Users
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/forums')}
            >
              🏛️ Manage Forums
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/content')}
            >
              📝 Manage Content
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/templates')}
            >
              🎨 Customize Theme
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/settings')}
            >
              ⚙️ Forum Settings
            </button>

            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/upload-settings')}
            >
              📁 Upload Settings
            </button>

            {stats.pendingReports > 0 && (
              <button
                className={`${styles.actionButton} ${styles.urgent}`}
                onClick={() => router.push('/admin/reports')}
              >
                ⚠️ View Reports ({stats.pendingReports})
              </button>
            )}

            <button
              className={styles.actionButton}
              onClick={() => router.push('/admin/backup')}
            >
              💾 Backup & Export
            </button>
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
                        by {post.user?.username || 'Unknown'}
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
