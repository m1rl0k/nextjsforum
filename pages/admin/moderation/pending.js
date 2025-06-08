import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function PendingContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchPendingContent();
    }
  }, [isAuthenticated, user, loading, router]);

  const fetchPendingContent = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/moderation/pending-content?limit=50');
      
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
      } else {
        throw new Error('Failed to fetch pending content');
      }
    } catch (err) {
      console.error('Error fetching pending content:', err);
      setError('Failed to load pending content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentAction = async (action, type, targetId) => {
    const actionKey = `${type}-${targetId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const res = await fetch('/api/admin/moderation/content-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          type,
          targetId,
          reason: `${action} by moderator`
        })
      });

      if (res.ok) {
        // Remove the item from the list or refresh
        await fetchPendingContent();
      } else {
        const data = await res.json();
        setError(data.message || `Failed to ${action} ${type}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing ${type}:`, err);
      setError(`Failed to ${action} ${type}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="loading">Loading pending content...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <Layout title="Pending Content - Moderation">
      <div className="pending-content">
        <div className="admin-header">
          <h1>⏳ Pending Content</h1>
          <div className="admin-nav">
            <Link href="/admin/moderation" className="nav-link">← Back to Moderation</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="content-grid">
          {content.length > 0 ? (
            content.map((item) => (
              <div key={`${item.type}-${item.id}`} className="content-card">
                <div className="content-header">
                  <div className="content-type">
                    {item.type === 'thread' ? '📝' : '💬'} {item.type}
                  </div>
                  <div className="content-date">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="content-body">
                  <h3 className="content-title">{item.title}</h3>
                  <div className="content-preview">
                    {item.content}
                  </div>
                  
                  <div className="content-meta">
                    <span><strong>By:</strong> {item.user?.username}</span>
                    {item.subject && <span><strong>In:</strong> {item.subject}</span>}
                    {item.threadId && (
                      <span>
                        <strong>Thread:</strong> 
                        <Link href={`/threads/${item.threadId}`}>View Thread</Link>
                      </span>
                    )}
                  </div>
                </div>

                <div className="content-actions">
                  <button 
                    onClick={() => handleContentAction('approve', item.type, item.id)}
                    disabled={actionLoading[`${item.type}-${item.id}`]}
                    className="button success"
                  >
                    {actionLoading[`${item.type}-${item.id}`] ? 'Processing...' : '✅ Approve'}
                  </button>
                  
                  <button 
                    onClick={() => handleContentAction('reject', item.type, item.id)}
                    disabled={actionLoading[`${item.type}-${item.id}`]}
                    className="button danger"
                  >
                    {actionLoading[`${item.type}-${item.id}`] ? 'Processing...' : '❌ Reject'}
                  </button>

                  <Link 
                    href={item.type === 'thread' ? `/threads/${item.id}` : `/threads/${item.threadId}`}
                    className="button"
                  >
                    🔍 View
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3>No pending content</h3>
              <p>All content has been reviewed or there's nothing waiting for approval.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .pending-content {
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

          .content-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
          }

          .content-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #ffc107;
          }

          .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .content-type {
            font-weight: 600;
            color: #333;
            text-transform: capitalize;
          }

          .content-date {
            font-size: 0.85rem;
            color: #666;
          }

          .content-title {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 1.1rem;
          }

          .content-preview {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.4;
          }

          .content-meta {
            display: flex;
            flex-direction: column;
            gap: 5px;
            margin-bottom: 15px;
            font-size: 0.9rem;
            color: #666;
          }

          .content-meta a {
            color: #007bff;
            text-decoration: none;
            margin-left: 5px;
          }

          .content-actions {
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
            font-size: 0.9rem;
          }

          .button:hover {
            background: #f8f9fa;
          }

          .button.success {
            background: #28a745;
            color: white;
            border-color: #28a745;
          }

          .button.success:hover {
            background: #218838;
          }

          .button.danger {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
          }

          .button.danger:hover {
            background: #c82333;
          }

          .button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .empty-state {
            grid-column: 1 / -1;
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

          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }

          @media (max-width: 768px) {
            .content-grid {
              grid-template-columns: 1fr;
            }
            
            .content-actions {
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
