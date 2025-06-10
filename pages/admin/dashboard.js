import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminPageHeader,
  AdminCard,
  AdminStatsGrid,
  AdminStatCard,
  AdminLoading,
  AdminButton
} from '../../components/admin/AdminComponents';
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

  // Helper function to strip HTML tags and get clean text
  const stripHtml = (html) => {
    if (!html) return '';
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };
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
        <AdminLoading size="large" text="Loading dashboard..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Error" />
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Admin Dashboard"
        description="Overview of your forum's activity and statistics"
        actions={
          <AdminButton
            variant="primary"
            onClick={() => window.open('/', '_blank')}
            icon="🔗"
          >
            View Forum
          </AdminButton>
        }
      />

      <AdminStatsGrid>
        <AdminStatCard
          title="Users"
          value={stats.users || 0}
          icon="👥"
          color="blue"
          change={{
            type: stats.onlineUsers > 0 ? 'increase' : 'neutral',
            value: `${stats.onlineUsers || 0} online now`
          }}
        />

        <AdminStatCard
          title="Threads"
          value={stats.threads || 0}
          icon="💬"
          color="green"
          change={{
            type: 'neutral',
            value: `${stats.subjects || 0} subjects`
          }}
        />

        <AdminStatCard
          title="Posts"
          value={stats.posts || 0}
          icon="📝"
          color="yellow"
          change={{
            type: 'neutral',
            value: `${stats.categories || 0} categories`
          }}
        />

        <AdminStatCard
          title="Reports"
          value={stats.pendingReports || 0}
          icon="⚠️"
          color={stats.pendingReports > 0 ? "red" : "green"}
          change={{
            type: stats.pendingReports > 0 ? 'increase' : 'neutral',
            value: stats.pendingReports > 0 ? 'Needs attention' : 'All clear'
          }}
        />
      </AdminStatsGrid>

      <AdminCard title="Quick Actions" className={styles.quickActionsCard}>
        <div className={styles.actionGrid}>
          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/users')}
            icon="👥"
          >
            Manage Users
          </AdminButton>

          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/forums')}
            icon="🏛️"
          >
            Manage Forums
          </AdminButton>

          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/content')}
            icon="📝"
          >
            Manage Content
          </AdminButton>

          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/templates')}
            icon="🎨"
          >
            Customize Theme
          </AdminButton>

          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/settings')}
            icon="⚙️"
          >
            Forum Settings
          </AdminButton>

          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/upload-settings')}
            icon="📁"
          >
            Upload Settings
          </AdminButton>

          {stats.pendingReports > 0 && (
            <AdminButton
              variant="danger"
              onClick={() => router.push('/admin/reports')}
              icon="⚠️"
            >
              View Reports ({stats.pendingReports})
            </AdminButton>
          )}

          <AdminButton
            variant="outline"
            onClick={() => router.push('/admin/backup')}
            icon="💾"
          >
            Backup & Export
          </AdminButton>
        </div>
      </AdminCard>

      <div className={styles.recentActivity}>
        <AdminCard title="Recent Users">
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
        </AdminCard>

        <AdminCard title="Recent Posts">
          {recentPosts.length > 0 ? (
            <ul className={styles.postList}>
              {recentPosts.map((post) => (
                <li key={post.id} className={styles.postItem}>
                  <div className={styles.postContent}>
                    <span className={styles.postTitle}>
                      {post.thread?.title || post.title || 'Untitled Thread'}
                    </span>
                    <span className={styles.postExcerpt}>
                      {stripHtml(post.content).substring(0, 100)}...
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
        </AdminCard>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
