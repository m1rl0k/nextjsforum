import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';

export default function ReportDetails() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

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
      const res = await fetch(`/api/admin/moderation/reports/${id}`);
      
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

  const handleReportAction = async (action, resolution = '') => {
    try {
      const res = await fetch(`/api/admin/moderation/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resolution })
      });

      if (res.ok) {
        await fetchReport(); // Refresh the report
        setShowResolutionModal(false);
        setCurrentAction(null);
        setResolutionText('');
      } else {
        throw new Error('Failed to update report');
      }
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
    }
  };

  const openResolutionModal = (action) => {
    setCurrentAction(action);
    setShowResolutionModal(true);
    setResolutionText('');
  };

  const handleResolutionSubmit = () => {
    if (currentAction) {
      handleReportAction(currentAction, resolutionText);
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="loading">Loading report details...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  if (!report) {
    return (
      <Layout>
        <div className="error">Report not found</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Report #${report.id} - Moderation`}>
      <div className="report-details">
        <div className="admin-header">
          <h1>📋 Report #{report.id}</h1>
          <div className="admin-nav">
            <Link href="/admin/moderation/reports" className="nav-link">← Back to Reports</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="report-card">
          <div className="report-status">
            <span className={`status ${report.status.toLowerCase()}`}>
              {report.status}
            </span>
            <span className="report-date">
              Reported on {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="report-content">
            <div className="report-section">
              <h3>Report Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Reason:</strong> {report.reason}
                </div>
                {report.description && (
                  <div className="detail-item">
                    <strong>Description:</strong> {report.description}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Reported by:</strong> 
                  <Link href={`/profile/${report.reportedBy?.username}`}>
                    {report.reportedBy?.username}
                  </Link>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h3>Reported Content</h3>
              {report.thread && (
                <div className="content-preview">
                  <div className="content-type">📝 Thread</div>
                  <h4>
                    <Link href={`/threads/${report.thread.id}`}>
                      {report.thread.title}
                    </Link>
                  </h4>
                  <div className="content-meta">
                    By {report.thread.user?.username} in {report.thread.subject?.name}
                  </div>
                  {report.thread.content && (
                    <div className="content-excerpt">
                      {report.thread.content.substring(0, 300)}...
                    </div>
                  )}
                </div>
              )}

              {report.post && (
                <div className="content-preview">
                  <div className="content-type">💬 Post</div>
                  <h4>
                    <Link href={`/threads/${report.post.thread?.id}`}>
                      Post in: {report.post.thread?.title}
                    </Link>
                  </h4>
                  <div className="content-meta">
                    By {report.post.user?.username}
                  </div>
                  <div className="content-excerpt">
                    {report.post.content.substring(0, 300)}...
                  </div>
                </div>
              )}

              {report.user && (
                <div className="content-preview">
                  <div className="content-type">👤 User</div>
                  <h4>
                    <Link href={`/profile/${report.user.username}`}>
                      {report.user.username}
                    </Link>
                  </h4>
                  <div className="content-meta">
                    Role: {report.user.role} • 
                    Joined: {new Date(report.user.createdAt).toLocaleDateString()}
                    {report.user.isBanned && <span className="banned-badge">BANNED</span>}
                  </div>
                </div>
              )}
            </div>

            {report.resolution && (
              <div className="report-section">
                <h3>Resolution</h3>
                <div className="resolution-content">
                  <p>{report.resolution}</p>
                  <div className="resolution-meta">
                    Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {report.status === 'PENDING' && (
            <div className="report-actions">
              <button
                onClick={() => openResolutionModal('resolve')}
                className="button success"
              >
                ✅ Resolve Report
              </button>
              
              <button
                onClick={() => openResolutionModal('dismiss')}
                className="button danger"
              >
                ❌ Dismiss Report
              </button>
            </div>
          )}
        </div>

        {/* Resolution Modal */}
        {showResolutionModal && (
          <div className="modal-overlay" onClick={() => setShowResolutionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {currentAction === 'resolve' ? '✅ Resolve Report' : '❌ Dismiss Report'}
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
                  <strong>Report:</strong> {report.reason}
                  <br />
                  <strong>Reported by:</strong> {report.reportedBy?.username}
                </div>

                <div className="form-group">
                  <label htmlFor="resolution">
                    {currentAction === 'resolve' ? 'Resolution notes:' : 'Dismissal reason:'}
                  </label>
                  <textarea
                    id="resolution"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows="4"
                    placeholder={
                      currentAction === 'resolve' 
                        ? 'Describe how this report was resolved...'
                        : 'Explain why this report is being dismissed...'
                    }
                    className="form-textarea"
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    onClick={handleResolutionSubmit}
                    className={`button ${currentAction === 'resolve' ? 'success' : 'danger'}`}
                  >
                    {currentAction === 'resolve' ? 'Resolve Report' : 'Dismiss Report'}
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
          .report-details {
            max-width: 800px;
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

          .report-card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .report-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e9ecef;
          }

          .status {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 0.9rem;
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

          .report-date {
            color: #666;
            font-size: 0.9rem;
          }

          .report-section {
            margin-bottom: 30px;
          }

          .report-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
          }

          .detail-grid {
            display: grid;
            gap: 15px;
          }

          .detail-item {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
          }

          .detail-item strong {
            color: #333;
          }

          .detail-item a {
            color: #007bff;
            text-decoration: none;
            margin-left: 5px;
          }

          .content-preview {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
          }

          .content-type {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 10px;
          }

          .content-preview h4 {
            margin: 0 0 10px 0;
          }

          .content-preview h4 a {
            color: #333;
            text-decoration: none;
          }

          .content-meta {
            color: #666;
            font-size: 0.9rem;
            margin-bottom: 10px;
          }

          .banned-badge {
            background: #dc3545;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.7rem;
            margin-left: 10px;
          }

          .content-excerpt {
            color: #555;
            line-height: 1.5;
            font-style: italic;
          }

          .resolution-content {
            background: #e9ecef;
            padding: 15px;
            border-radius: 4px;
          }

          .resolution-meta {
            color: #666;
            font-size: 0.9rem;
            margin-top: 10px;
          }

          .report-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
          }

          .button {
            padding: 12px 24px;
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

          .nav-link {
            color: #007bff;
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid #007bff;
            border-radius: 4px;
          }

          /* Modal styles */
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

          .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
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
            .admin-header {
              flex-direction: column;
              gap: 15px;
            }
            
            .report-actions {
              flex-direction: column;
            }
          }
        `
      }} />
    </Layout>
  );
}
