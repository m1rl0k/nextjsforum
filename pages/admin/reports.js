import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminReports.module.css';

const AdminReports = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      router.push('/');
      return;
    }
    fetchReports();
  }, [user, authLoading, router, filter, pagination.page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const query = new URLSearchParams({
        page,
        limit,
        status: filter
      }).toString();
      
      const res = await fetch(`/api/admin/reports?${query}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch reports');
      }
      
      setReports(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      }));
    } catch (err) {
      setError(err.message || 'Failed to load reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to perform action');
      }

      await fetchReports();
    } catch (err) {
      console.error('Error performing report action:', err);
      setError(err.message || 'Failed to perform action');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getReportTypeIcon = (report) => {
    if (report.threadId) return '💬';
    if (report.postId) return '📝';
    if (report.userId) return '👤';
    return '❓';
  };

  const getReportTypeText = (report) => {
    if (report.threadId) return 'Thread';
    if (report.postId) return 'Post';
    if (report.userId) return 'User';
    return 'Unknown';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading reports...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Content Reports</h1>
          <div className={styles.filters}>
            <button
              onClick={() => setFilter('pending')}
              className={`${styles.filterButton} ${filter === 'pending' ? styles.active : ''}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`${styles.filterButton} ${filter === 'resolved' ? styles.active : ''}`}
            >
              Resolved
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            >
              All
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.reportsList}>
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className={styles.reportItem}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportType}>
                    {getReportTypeIcon(report)} {getReportTypeText(report)} Report
                  </div>
                  <div className={styles.reportDate}>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className={styles.reportContent}>
                  <div className={styles.reportReason}>
                    <strong>Reason:</strong> {report.reason}
                  </div>
                  {report.description && (
                    <div className={styles.reportDescription}>
                      <strong>Details:</strong> {report.description}
                    </div>
                  )}
                  <div className={styles.reportMeta}>
                    Reported by: <strong>{report.reportedBy?.username || 'Anonymous'}</strong>
                    {report.reportedUser && (
                      <span> • Reported user: <strong>{report.reportedUser.username}</strong></span>
                    )}
                  </div>
                </div>

                <div className={styles.reportActions}>
                  {report.threadId && (
                    <button
                      onClick={() => router.push(`/threads/${report.threadId}`)}
                      className={styles.actionButton}
                      title="View Thread"
                    >
                      👁️ View
                    </button>
                  )}
                  {report.postId && (
                    <button
                      onClick={() => router.push(`/threads/${report.post?.threadId}#post-${report.postId}`)}
                      className={styles.actionButton}
                      title="View Post"
                    >
                      👁️ View
                    </button>
                  )}
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReportAction(report.id, 'approve')}
                        className={`${styles.actionButton} ${styles.approveButton}`}
                        title="Take Action"
                      >
                        ✅ Take Action
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                        className={`${styles.actionButton} ${styles.dismissButton}`}
                        title="Dismiss Report"
                      >
                        ❌ Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              No reports found
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={styles.pageButton}
            >
              Previous
            </button>
            <div className={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
