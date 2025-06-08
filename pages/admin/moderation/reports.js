import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
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
      const res = await fetch(`/api/admin/moderation/reports?status=${filter}`);
      
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
      <Layout>
        <div className="loading">Loading reports...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <Layout title="Reports Management - Moderation">
      <div className="reports-management">
        <div className="admin-header">
          <h1>📋 Reports Management</h1>
          <div className="admin-nav">
            <Link href="/admin/moderation" className="nav-link">← Back to Moderation</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {/* Filters */}
        <div className="filters">
          <div className="filter-tabs">
            {['PENDING', 'RESOLVED', 'DISMISSED'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
              >
                {status.toLowerCase()}
              </button>
            ))}
          </div>

          {selectedReports.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedReports.length} selected</span>
              <button 
                onClick={() => handleBulkAction('resolve')}
                className="button success"
              >
                Resolve Selected
              </button>
              <button 
                onClick={() => handleBulkAction('dismiss')}
                className="button danger"
              >
                Dismiss Selected
              </button>
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="reports-list">
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <div className="report-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleReportSelection(report.id)}
                    />
                  </div>
                  
                  <div className="report-type">
                    {report.threadId && '📝 Thread Report'}
                    {report.postId && '💬 Post Report'}
                    {report.userId && '👤 User Report'}
                  </div>
                  
                  <div className="report-status">
                    <span className={`status ${report.status.toLowerCase()}`}>
                      {report.status}
                    </span>
                  </div>
                </div>

                <div className="report-content">
                  <div className="report-reason">
                    <strong>Reason:</strong> {report.reason}
                  </div>
                  
                  {report.description && (
                    <div className="report-description">
                      <strong>Details:</strong> {report.description}
                    </div>
                  )}

                  <div className="report-target">
                    {report.thread && (
                      <div>
                        <strong>Thread:</strong> 
                        <Link href={`/threads/${report.thread.id}`}>
                          {report.thread.title}
                        </Link>
                      </div>
                    )}
                    
                    {report.post && (
                      <div>
                        <strong>Post:</strong> {report.post.content.substring(0, 100)}...
                      </div>
                    )}
                    
                    {report.user && (
                      <div>
                        <strong>User:</strong> 
                        <Link href={`/profile/${report.user.username}`}>
                          {report.user.username}
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="report-meta">
                    <span>Reported by <strong>{report.reportedBy?.username}</strong></span>
                    <span>on {new Date(report.createdAt).toLocaleDateString()}</span>
                    {report.resolvedAt && (
                      <span>• Resolved on {new Date(report.resolvedAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  {report.resolution && (
                    <div className="report-resolution">
                      <strong>Resolution:</strong> {report.resolution}
                    </div>
                  )}
                </div>

                {report.status === 'PENDING' && (
                  <div className="report-actions">
                    <button
                      onClick={() => openResolutionModal(report, 'resolve')}
                      className="button success"
                    >
                      ✅ Resolve
                    </button>

                    <button
                      onClick={() => openResolutionModal(report, 'dismiss')}
                      className="button danger"
                    >
                      ❌ Dismiss
                    </button>

                    <Link
                      href={`/admin/moderation/reports/${report.id}`}
                      className="button"
                    >
                      🔍 Details
                    </Link>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No {filter.toLowerCase()} reports</h3>
              <p>There are currently no reports with status: {filter.toLowerCase()}</p>
            </div>
          )}
        </div>

        {/* Resolution Modal */}
        {showResolutionModal && (
          <div className="modal-overlay" onClick={() => setShowResolutionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {currentReport?.action === 'resolve' ? '✅ Resolve Report' : '❌ Dismiss Report'}
                </h3>
                <button
                  onClick={() => setShowResolutionModal(false)}
                  className="close-button"
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="report-summary">
                  <strong>Report:</strong> {currentReport?.reason}
                  <br />
                  <strong>Reported by:</strong> {currentReport?.reportedBy?.username}
                </div>

                <div className="form-group">
                  <label htmlFor="resolution">
                    {currentReport?.action === 'resolve' ? 'Resolution notes:' : 'Dismissal reason:'}
                  </label>
                  <textarea
                    id="resolution"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows="4"
                    placeholder={
                      currentReport?.action === 'resolve'
                        ? 'Describe how this report was resolved...'
                        : 'Explain why this report is being dismissed...'
                    }
                    className="form-textarea"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    onClick={handleResolutionSubmit}
                    className={`button ${currentReport?.action === 'resolve' ? 'success' : 'danger'}`}
                  >
                    {currentReport?.action === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
                  </button>

                  <button
                    onClick={() => setShowResolutionModal(false)}
                    className="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .reports-management {
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

          .filters {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .filter-tabs {
            display: flex;
            gap: 10px;
          }

          .filter-tab {
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            text-transform: capitalize;
          }

          .filter-tab.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }

          .bulk-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .report-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #ffc107;
          }

          .report-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
          }

          .report-type {
            font-weight: 600;
            color: #333;
          }

          .status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .status.pending {
            background: #fff3cd;
            color: #856404;
          }

          .status.resolved {
            background: #d4edda;
            color: #155724;
          }

          .status.dismissed {
            background: #f8d7da;
            color: #721c24;
          }

          .report-content {
            margin-bottom: 15px;
          }

          .report-reason,
          .report-description,
          .report-target,
          .report-resolution {
            margin-bottom: 10px;
          }

          .report-meta {
            font-size: 0.9rem;
            color: #666;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .report-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
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
            padding: 60px 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }

          .empty-state h3 {
            margin: 0 0 10px 0;
            color: #333;
          }

          .empty-state p {
            color: #666;
            margin: 0;
          }

          .nav-link {
            color: #007bff;
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid #007bff;
            border-radius: 4px;
          }

          .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-content {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
          }

          .modal-header h3 {
            margin: 0;
            color: #333;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
          }

          .modal-body {
            padding: 20px;
          }

          .report-summary {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 0.9rem;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #333;
          }

          .form-textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            resize: vertical;
          }

          .form-textarea:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
          }

          .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }

          @media (max-width: 768px) {
            .filters {
              flex-direction: column;
              gap: 15px;
            }
            
            .report-actions {
              flex-direction: column;
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
