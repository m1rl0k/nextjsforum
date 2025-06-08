import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ModerationDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchModerationData();
    }
  }, [isAuthenticated, user, loading, router]);

  const fetchModerationData = async () => {
    try {
      setIsLoading(true);
      
      const [statsRes, reportsRes, contentRes] = await Promise.all([
        fetch('/api/admin/moderation/stats'),
        fetch('/api/admin/moderation/reports?limit=5'),
        fetch('/api/admin/moderation/pending-content?limit=5')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setRecentReports(reportsData.reports || []);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setPendingContent(contentData.content || []);
      }

    } catch (err) {
      console.error('Error fetching moderation data:', err);
      setError('Failed to load moderation data');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="loading">Loading moderation dashboard...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <Layout title="Moderation Dashboard - Admin Panel">
      <div className="moderation-dashboard">
        <div className="admin-header">
          <h1>🛡️ Moderation Dashboard</h1>
          <div className="admin-nav">
            <Link href="/admin" className="nav-link">← Back to Admin</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card urgent">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <div className="stat-number">{stats?.pendingReports || 0}</div>
              <div className="stat-label">Pending Reports</div>
            </div>
            <Link href="/admin/moderation/reports" className="stat-action">View All</Link>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{stats?.pendingContent || 0}</div>
              <div className="stat-label">Pending Approval</div>
            </div>
            <Link href="/admin/moderation/pending" className="stat-action">Review</Link>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🚫</div>
            <div className="stat-content">
              <div className="stat-number">{stats?.bannedUsers || 0}</div>
              <div className="stat-label">Banned Users</div>
            </div>
            <Link href="/admin/users?filter=banned" className="stat-action">Manage</Link>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{stats?.resolvedToday || 0}</div>
              <div className="stat-label">Resolved Today</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Link href="/admin/moderation/reports" className="action-card">
              <div className="action-icon">📋</div>
              <div className="action-title">Review Reports</div>
              <div className="action-desc">Handle user reports and complaints</div>
            </Link>

            <Link href="/admin/moderation/pending" className="action-card">
              <div className="action-icon">⏳</div>
              <div className="action-title">Pending Content</div>
              <div className="action-desc">Approve or reject pending posts</div>
            </Link>

            <Link href="/admin/moderation/users" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-title">User Moderation</div>
              <div className="action-desc">Ban, warn, or manage users</div>
            </Link>

            <Link href="/admin/moderation/content" className="action-card">
              <div className="action-icon">📝</div>
              <div className="action-title">Content Management</div>
              <div className="action-desc">Edit, delete, or move content</div>
            </Link>

            <Link href="/admin/moderation/logs" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-title">Moderation Logs</div>
              <div className="action-desc">View moderation history</div>
            </Link>

            <Link href="/admin/moderation/settings" className="action-card">
              <div className="action-icon">⚙️</div>
              <div className="action-title">Moderation Settings</div>
              <div className="action-desc">Configure moderation rules</div>
            </Link>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Reports</h2>
            <Link href="/admin/moderation/reports" className="view-all">View All →</Link>
          </div>
          
          <div className="reports-list">
            {recentReports.length > 0 ? (
              recentReports.map((report) => (
                <div key={report.id} className="report-item">
                  <div className="report-content">
                    <div className="report-type">
                      {report.threadId ? '📝 Thread' : report.postId ? '💬 Post' : '👤 User'} Report
                    </div>
                    <div className="report-reason">{report.reason}</div>
                    <div className="report-meta">
                      Reported by {report.reportedBy?.username} • {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="report-actions">
                    <Link href={`/admin/moderation/reports/${report.id}`} className="button small">
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent reports</div>
            )}
          </div>
        </div>

        {/* Pending Content */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Pending Content</h2>
            <Link href="/admin/moderation/pending" className="view-all">View All →</Link>
          </div>
          
          <div className="content-list">
            {pendingContent.length > 0 ? (
              pendingContent.map((item) => (
                <div key={`${item.type}-${item.id}`} className="content-item">
                  <div className="content-info">
                    <div className="content-type">
                      {item.type === 'thread' ? '📝' : '💬'} {item.type}
                    </div>
                    <div className="content-title">{item.title || item.content?.substring(0, 100) + '...'}</div>
                    <div className="content-meta">
                      By {item.user?.username} • {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="content-actions">
                    <button className="button small success">Approve</button>
                    <button className="button small danger">Reject</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No pending content</div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .moderation-dashboard {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }

          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }

          .admin-header h1 {
            margin: 0;
            color: #333;
          }

          .nav-link {
            color: #007bff;
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid #007bff;
            border-radius: 4px;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }

          .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #ddd;
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .stat-card.urgent { border-left-color: #dc3545; }
          .stat-card.warning { border-left-color: #ffc107; }
          .stat-card.info { border-left-color: #17a2b8; }
          .stat-card.success { border-left-color: #28a745; }

          .stat-icon {
            font-size: 2rem;
          }

          .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #333;
          }

          .stat-label {
            color: #666;
            font-size: 0.9rem;
          }

          .stat-action {
            margin-left: auto;
            color: #007bff;
            text-decoration: none;
            font-size: 0.9rem;
          }

          .quick-actions {
            margin-bottom: 40px;
          }

          .action-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }

          .action-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-decoration: none;
            color: inherit;
            transition: transform 0.2s;
          }

          .action-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          }

          .action-icon {
            font-size: 2rem;
            margin-bottom: 10px;
          }

          .action-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
          }

          .action-desc {
            color: #666;
            font-size: 0.9rem;
          }

          .recent-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .section-header h2 {
            margin: 0;
            color: #333;
          }

          .view-all {
            color: #007bff;
            text-decoration: none;
          }

          .report-item,
          .content-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            margin-bottom: 10px;
          }

          .report-type,
          .content-type {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
          }

          .report-reason,
          .content-title {
            margin-bottom: 5px;
          }

          .report-meta,
          .content-meta {
            font-size: 0.85rem;
            color: #666;
          }

          .report-actions,
          .content-actions {
            display: flex;
            gap: 10px;
          }

          .button {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }

          .button.small {
            padding: 4px 8px;
            font-size: 0.85rem;
          }

          .button.success {
            background: #28a745;
            color: white;
            border-color: #28a745;
          }

          .button.danger {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
          }

          .empty-state {
            text-align: center;
            color: #666;
            padding: 20px;
            font-style: italic;
          }

          .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }

          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }

          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }
            
            .action-grid {
              grid-template-columns: 1fr;
            }
            
            .admin-header {
              flex-direction: column;
              gap: 15px;
            }
          }
        `
      }} />
    </Layout>
  );
}
