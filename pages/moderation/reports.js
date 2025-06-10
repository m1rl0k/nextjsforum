import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminTabs,
  AdminTable,
  AdminPagination,
  AdminLoading,
  AdminButton,
  AdminFormGroup,
  AdminEmptyState,
  AdminAlert
} from '../../components/admin/AdminComponents';
import Link from 'next/link';

export default function ReportsManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDING');
  const [selectedReports, setSelectedReports] = useState([]);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchReports();
    }
  }, [isAuthenticated, user, loading, router, filter]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/moderation/reports?status=${filter}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (reportId, action, resolution = '') => {
    try {
      const res = await fetch(`/api/admin/moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, resolution })
      });

      if (res.ok) {
        await fetchReports(); // Refresh the list
        setShowResolutionModal(false);
        setCurrentReport(null);
        setResolutionText('');
      } else {
        throw new Error('Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
    }
  };

  const openResolutionModal = (report, action) => {
    setCurrentReport({ ...report, action });
    setShowResolutionModal(true);
    setResolutionText('');
  };

  const handleResolutionSubmit = () => {
    if (currentReport) {
      handleReportAction(currentReport.id, currentReport.action, resolutionText);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) return;

    try {
      const promises = selectedReports.map(reportId => 
        handleReportAction(reportId, action)
      );
      
      await Promise.all(promises);
      setSelectedReports([]);
    } catch (err) {
      console.error('Error with bulk action:', err);
      setError('Failed to perform bulk action');
    }
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  if (loading || isLoading) {
    return (
      <ModerationLayout>
        <AdminLoading size="large" text="Loading reports..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  const tabs = [
    { id: 'PENDING', label: 'Pending', icon: '⏳' },
    { id: 'RESOLVED', label: 'Resolved', icon: '✅' },
    { id: 'DISMISSED', label: 'Dismissed', icon: '❌' }
  ];

  const columns = [
    {
      key: 'select',
      label: '',
      render: (_, report) => (
        <input
          type="checkbox"
          checked={selectedReports.includes(report.id)}
          onChange={() => toggleReportSelection(report.id)}
        />
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (_, report) => (
        <span>
          {report.threadId && '📝 Thread'}
          {report.postId && '💬 Post'}
          {report.userId && '👤 User'}
        </span>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (reason) => <strong>{reason}</strong>
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
    },
    {
      key: 'status',
      label: 'Status',
      render: (status) => (
        <span className={`status ${status.toLowerCase()}`}>
          {status}
        </span>
      )
    }
  ];

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Reports Management"
        description="Review and manage user reports"
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'Reports' }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}

      <AdminCard>
        <AdminTabs
          tabs={tabs}
          activeTab={filter}
          onTabChange={setFilter}
        />

        {selectedReports.length > 0 && (
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', margin: '1rem 0' }}>
            <span>{selectedReports.length} selected</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <AdminButton 
                variant="success"
                size="small"
                onClick={() => handleBulkAction('resolve')}
              >
                Resolve Selected
              </AdminButton>
              <AdminButton 
                variant="danger"
                size="small"
                onClick={() => handleBulkAction('dismiss')}
              >
                Dismiss Selected
              </AdminButton>
            </div>
          </div>
        )}

        {reports.length > 0 ? (
          <AdminTable
            columns={columns}
            data={reports}
            loading={isLoading}
            actions={(report) => (
              <>
                {report.status === 'PENDING' && (
                  <>
                    <AdminButton
                      size="small"
                      variant="success"
                      onClick={() => openResolutionModal(report, 'resolve')}
                      icon="✅"
                    >
                      Resolve
                    </AdminButton>
                    <AdminButton
                      size="small"
                      variant="danger"
                      onClick={() => openResolutionModal(report, 'dismiss')}
                      icon="❌"
                    >
                      Dismiss
                    </AdminButton>
                  </>
                )}
                <AdminButton
                  size="small"
                  variant="outline"
                  onClick={() => router.push(`/moderation/reports/${report.id}`)}
                  icon="🔍"
                >
                  Details
                </AdminButton>
              </>
            )}
          />
        ) : (
          <AdminEmptyState
            icon="📋"
            title={`No ${filter.toLowerCase()} reports`}
            description={`There are currently no reports with status: ${filter.toLowerCase()}`}
          />
        )}
      </AdminCard>

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3>
              {currentReport?.action === 'resolve' ? '✅ Resolve Report' : '❌ Dismiss Report'}
            </h3>
            
            <div style={{ margin: '1rem 0' }}>
              <strong>Report:</strong> {currentReport?.reason}<br />
              <strong>Reported by:</strong> {currentReport?.reportedBy?.username}
            </div>

            <AdminFormGroup 
              label={currentReport?.action === 'resolve' ? 'Resolution notes:' : 'Dismissal reason:'}
            >
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows="4"
                placeholder={
                  currentReport?.action === 'resolve'
                    ? 'Describe how this report was resolved...'
                    : 'Explain why this report is being dismissed...'
                }
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem'
                }}
              />
            </AdminFormGroup>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <AdminButton
                variant="outline"
                onClick={() => setShowResolutionModal(false)}
              >
                Cancel
              </AdminButton>
              <AdminButton
                variant={currentReport?.action === 'resolve' ? 'success' : 'danger'}
                onClick={handleResolutionSubmit}
              >
                {currentReport?.action === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </ModerationLayout>
  );
}
