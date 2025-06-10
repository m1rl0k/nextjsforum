import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../../components/moderation/ModerationLayout';
import { useAuth } from '../../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminLoading,
  AdminButton,
  AdminFormGroup,
  AdminAlert
} from '../../../components/admin/AdminComponents';
import Link from 'next/link';

export default function ReportDetails() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (id && isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchReport();
    }
  }, [id, isAuthenticated, user, loading, router]);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/moderation/reports/${id}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      } else {
        throw new Error('Failed to fetch report');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (action) => {
    setIsResolving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/moderation/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action, 
          resolution: resolutionText 
        })
      });

      if (res.ok) {
        router.push('/moderation/reports');
      } else {
        throw new Error('Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
    } finally {
      setIsResolving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <ModerationLayout>
        <AdminLoading size="large" text="Loading report details..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  if (!report) {
    return (
      <ModerationLayout>
        <AdminAlert type="error">Report not found</AdminAlert>
      </ModerationLayout>
    );
  }

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Report Details"
        description={`Report #${report.id}`}
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'Reports', href: '/moderation/reports' },
          { label: `Report #${report.id}` }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}

      <div style={{ display: 'grid', gap: '2rem' }}>
        <AdminCard title="Report Information">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Type:</strong> {' '}
              {report.threadId && '📝 Thread Report'}
              {report.postId && '💬 Post Report'}
              {report.userId && '👤 User Report'}
            </div>
            
            <div>
              <strong>Status:</strong> {' '}
              <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                backgroundColor: report.status === 'PENDING' ? '#fef3c7' : 
                                report.status === 'RESOLVED' ? '#d1fae5' : '#fee2e2',
                color: report.status === 'PENDING' ? '#92400e' : 
                       report.status === 'RESOLVED' ? '#065f46' : '#991b1b'
              }}>
                {report.status}
              </span>
            </div>

            <div>
              <strong>Reason:</strong> {report.reason}
            </div>

            {report.description && (
              <div>
                <strong>Description:</strong>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  {report.description}
                </div>
              </div>
            )}

            <div>
              <strong>Reported by:</strong> {report.reportedBy?.username || 'Unknown'}
            </div>

            <div>
              <strong>Reported on:</strong> {new Date(report.createdAt).toLocaleString()}
            </div>

            {report.resolvedAt && (
              <div>
                <strong>Resolved on:</strong> {new Date(report.resolvedAt).toLocaleString()}
              </div>
            )}

            {report.resolution && (
              <div>
                <strong>Resolution:</strong>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '1rem', 
                  background: '#f0fdf4', 
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0'
                }}>
                  {report.resolution}
                </div>
              </div>
            )}
          </div>
        </AdminCard>

        {/* Reported Content */}
        <AdminCard title="Reported Content">
          {report.thread && (
            <div>
              <h4>Thread: {report.thread.title}</h4>
              <p>{report.thread.content?.substring(0, 500)}...</p>
              <Link 
                href={`/threads/${report.thread.id}`}
                style={{ color: '#3b82f6' }}
              >
                View Thread →
              </Link>
            </div>
          )}

          {report.post && (
            <div>
              <h4>Post Content:</h4>
              <div style={{ 
                padding: '1rem', 
                background: '#f8fafc', 
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}>
                {report.post.content?.substring(0, 500)}...
              </div>
              <Link 
                href={`/threads/${report.post.threadId}#post-${report.post.id}`}
                style={{ color: '#3b82f6' }}
              >
                View Post →
              </Link>
            </div>
          )}

          {report.user && (
            <div>
              <h4>Reported User: {report.user.username}</h4>
              <p>Role: {report.user.role}</p>
              <p>Joined: {new Date(report.user.createdAt).toLocaleDateString()}</p>
              <Link 
                href={`/profile/${report.user.username}`}
                style={{ color: '#3b82f6' }}
              >
                View Profile →
              </Link>
            </div>
          )}
        </AdminCard>

        {/* Resolution Actions */}
        {report.status === 'PENDING' && (
          <AdminCard title="Resolve Report">
            <AdminFormGroup label="Resolution Notes">
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows="4"
                placeholder="Describe how this report was handled..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  resize: 'vertical'
                }}
              />
            </AdminFormGroup>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <AdminButton
                variant="success"
                onClick={() => handleReportAction('resolve')}
                disabled={isResolving}
                loading={isResolving}
              >
                ✅ Resolve Report
              </AdminButton>

              <AdminButton
                variant="danger"
                onClick={() => handleReportAction('dismiss')}
                disabled={isResolving}
                loading={isResolving}
              >
                ❌ Dismiss Report
              </AdminButton>

              <AdminButton
                variant="outline"
                onClick={() => router.push('/moderation/reports')}
              >
                ← Back to Reports
              </AdminButton>
            </div>
          </AdminCard>
        )}
      </div>
    </ModerationLayout>
  );
}
