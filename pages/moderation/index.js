import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import {
  AdminPageHeader,
  AdminCard,
  AdminStatsGrid,
  AdminStatCard,
  AdminLoading,
  AdminButton,
  AdminTable,
  AdminEmptyState
} from '../../components/admin/AdminComponents';

const ModerationDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [pendingContent, setPendingContent] = useState([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      router.push('/');
      return;
    }

    fetchModerationData();
  }, [user, authLoading]);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      
      // Fetch moderation stats
      const [statsRes, reportsRes, contentRes] = await Promise.all([
        fetch('/api/admin/moderation/stats', { credentials: 'include' }),
        fetch('/api/admin/moderation/reports?limit=5', { credentials: 'include' }),
        fetch('/api/admin/moderation/pending-content?limit=5', { credentials: 'include' })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setRecentReports(reportsData.reports || []);
      }

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setPendingContent(contentData.content || []);
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await fetch(`/api/admin/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        fetchModerationData(); // Refresh data
      }
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  const handleContentAction = async (contentId, action, type) => {
    try {
      const res = await fetch(`/api/admin/moderation/content/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, type })
      });

      if (res.ok) {
        fetchModerationData(); // Refresh data
      }
    } catch (error) {
      console.error('Error handling content:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <ModerationLayout>
        <AdminLoading size="large" text="Loading moderation dashboard..." />
      </ModerationLayout>
    );
  }

  const reportColumns = [
    {
      key: 'reason',
      label: 'Reason',
      render: (reason) => <span className="report-reason">{reason}</span>
    },
    {
      key: 'reportedBy',
      label: 'Reported By',
      render: (reportedBy) => reportedBy?.username ? (
        <Link href={`/profile/${reportedBy.username}`} style={{ color: '#3b82f6' }}>
          {reportedBy.username}
        </Link>
      ) : 'Unknown'
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (createdAt) => new Date(createdAt).toLocaleDateString()
    }
  ];

  const contentColumns = [
    {
      key: 'content',
      label: 'Content',
      render: (content, item) => (
        <div>
          <div className="content-preview">
            {content?.substring(0, 100) || item.title?.substring(0, 100)}...
          </div>
          <div className="content-type">{item.type || 'post'}</div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Author',
      render: (user) => user?.username ? (
        <Link href={`/profile/${user.username}`} style={{ color: '#3b82f6' }}>
          {user.username}
        </Link>
      ) : 'Unknown'
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (createdAt) => new Date(createdAt).toLocaleDateString()
    }
  ];

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Moderation Dashboard"
        description="Monitor and manage forum content and user reports"
      />
      
      <AdminStatsGrid>
        <AdminStatCard
          title="Pending Reports"
          value={stats.pendingReports || 0}
          icon="⚠️"
          color={stats.pendingReports > 0 ? "red" : "green"}
          change={{ 
            type: stats.pendingReports > 0 ? 'increase' : 'neutral', 
            value: stats.pendingReports > 0 ? 'Needs attention' : 'All clear' 
          }}
        />
        
        <AdminStatCard
          title="Pending Content"
          value={stats.pendingContent || 0}
          icon="📝"
          color={stats.pendingContent > 0 ? "yellow" : "green"}
          change={{ 
            type: 'neutral', 
            value: 'Awaiting review' 
          }}
        />
        
        <AdminStatCard
          title="Actions Today"
          value={stats.actionsToday || 0}
          icon="🛡️"
          color="blue"
          change={{ 
            type: 'neutral', 
            value: 'Moderation actions' 
          }}
        />
        
        <AdminStatCard
          title="Active Moderators"
          value={stats.activeModerators || 0}
          icon="👥"
          color="green"
          change={{ 
            type: 'neutral', 
            value: 'Online now' 
          }}
        />
      </AdminStatsGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <AdminCard 
          title="Recent Reports" 
          actions={
            <AdminButton 
              variant="outline" 
              size="small"
              onClick={() => router.push('/moderation/reports')}
            >
              View All
            </AdminButton>
          }
        >
          {recentReports.length > 0 ? (
            <AdminTable
              columns={reportColumns}
              data={recentReports}
              actions={(report) => (
                <>
                  <AdminButton
                    size="small"
                    variant="success"
                    onClick={() => handleReportAction(report.id, 'approve')}
                  >
                    Approve
                  </AdminButton>
                  <AdminButton
                    size="small"
                    variant="danger"
                    onClick={() => handleReportAction(report.id, 'reject')}
                  >
                    Reject
                  </AdminButton>
                </>
              )}
            />
          ) : (
            <AdminEmptyState
              icon="✅"
              title="No pending reports"
              description="All reports have been reviewed."
            />
          )}
        </AdminCard>

        <AdminCard 
          title="Pending Content" 
          actions={
            <AdminButton 
              variant="outline" 
              size="small"
              onClick={() => router.push('/moderation/pending')}
            >
              View All
            </AdminButton>
          }
        >
          {pendingContent.length > 0 ? (
            <AdminTable
              columns={contentColumns}
              data={pendingContent}
              actions={(content) => (
                <>
                  <AdminButton
                    size="small"
                    variant="success"
                    onClick={() => handleContentAction(content.id, 'approve', content.type)}
                  >
                    Approve
                  </AdminButton>
                  <AdminButton
                    size="small"
                    variant="danger"
                    onClick={() => handleContentAction(content.id, 'reject', content.type)}
                  >
                    Reject
                  </AdminButton>
                </>
              )}
            />
          ) : (
            <AdminEmptyState
              icon="✅"
              title="No pending content"
              description="All content has been reviewed."
            />
          )}
        </AdminCard>
      </div>
    </ModerationLayout>
  );
};

export default ModerationDashboard;
