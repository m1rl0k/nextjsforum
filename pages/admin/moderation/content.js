import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ContentManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchContent();
    }
  }, [isAuthenticated, user, loading, router, filter]);

  const fetchContent = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        filter,
        search: searchTerm,
        limit: '50'
      });
      
      const res = await fetch(`/api/admin/moderation/content?${params}`);
      
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || []);
      } else {
        throw new Error('Failed to fetch content');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          items: selectedItems
        })
      });

      if (res.ok) {
        await fetchContent();
        setSelectedItems([]);
      } else {
        throw new Error('Failed to perform bulk action');
      }
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError('Failed to perform bulk action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleItemAction = async (action, type, id) => {
    try {
      const res = await fetch('/api/admin/moderation/content-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          type,
          targetId: id
        })
      });

      if (res.ok) {
        await fetchContent();
      } else {
        throw new Error(`Failed to ${action} ${type}`);
      }
    } catch (err) {
      console.error(`Error ${action}ing ${type}:`, err);
      setError(`Failed to ${action} ${type}`);
    }
  };

  const toggleSelection = (type, id) => {
    const itemKey = `${type}-${id}`;
    setSelectedItems(prev => 
      prev.includes(itemKey) 
        ? prev.filter(item => item !== itemKey)
        : [...prev, itemKey]
    );
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="loading">Loading content...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <Layout title="Content Management - Moderation">
      <div className="content-management">
        <div className="admin-header">
          <h1>📝 Content Management</h1>
          <div className="admin-nav">
            <Link href="/admin/moderation" className="nav-link">← Back to Moderation</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="content-controls">
          <div className="filters">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Content</option>
              <option value="threads">Threads Only</option>
              <option value="posts">Posts Only</option>
              <option value="flagged">Flagged Content</option>
              <option value="deleted">Deleted Content</option>
            </select>

            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchContent()}
              className="search-input"
            />

            <button onClick={fetchContent} className="button">Search</button>
          </div>

          {selectedItems.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedItems.length} items selected</span>
              <button 
                onClick={() => handleBulkAction('delete')}
                disabled={actionLoading}
                className="button danger"
              >
                {actionLoading ? 'Processing...' : 'Delete Selected'}
              </button>
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading}
                className="button success"
              >
                {actionLoading ? 'Processing...' : 'Approve Selected'}
              </button>
              <button
                onClick={() => handleBulkAction('restore')}
                disabled={actionLoading}
                className="button info"
              >
                {actionLoading ? 'Processing...' : 'Restore Selected'}
              </button>
            </div>
          )}
        </div>

        <div className="content-list">
          {content.length > 0 ? (
            content.map((item) => (
              <div key={`${item.type}-${item.id}`} className="content-item">
                <div className="content-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(`${item.type}-${item.id}`)}
                    onChange={() => toggleSelection(item.type, item.id)}
                  />
                </div>

                <div className="content-info">
                  <div className="content-header">
                    <span className="content-type">
                      {item.type === 'thread' ? '📝' : '💬'} {item.type}
                    </span>
                    <span className="content-status">
                      {item.deleted ? '🗑️ Deleted' : item.locked ? '🔒 Locked' : '✅ Active'}
                    </span>
                  </div>

                  <h3 className="content-title">{item.title}</h3>
                  <div className="content-preview">
                    {item.content?.substring(0, 200)}...
                  </div>

                  <div className="content-meta">
                    <span><strong>By:</strong> {item.user?.username}</span>
                    <span><strong>Created:</strong> {new Date(item.createdAt).toLocaleDateString()}</span>
                    {item.subject && <span><strong>In:</strong> {item.subject}</span>}
                    {item.threadTitle && <span><strong>Thread:</strong> {item.threadTitle}</span>}
                  </div>
                </div>

                <div className="content-actions">
                  {!item.deleted ? (
                    <>
                      <Link
                        href={item.type === 'thread' ? `/threads/${item.id}` : `/threads/${item.threadId}`}
                        className="button small"
                      >
                        🔍 View
                      </Link>
                      <button
                        onClick={() => handleItemAction('delete', item.type, item.id)}
                        className="button small danger"
                      >
                        🗑️ Delete
                      </button>
                      {item.type === 'thread' && (
                        <button
                          onClick={() => handleItemAction(item.locked ? 'unlock' : 'lock', item.type, item.id)}
                          className="button small warning"
                        >
                          {item.locked ? '🔓 Unlock' : '🔒 Lock'}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleItemAction('restore', item.type, item.id)}
                      className="button small success"
                    >
                      ↩️ Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No content found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .content-management {
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

          .content-controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .filters {
            display: flex;
            gap: 15px;
            align-items: center;
            margin-bottom: 15px;
          }

          .filter-select, .search-input {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }

          .search-input {
            flex: 1;
            max-width: 300px;
          }

          .bulk-actions {
            display: flex;
            gap: 10px;
            align-items: center;
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
          }

          .content-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .content-item {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            gap: 15px;
            align-items: flex-start;
          }

          .content-checkbox {
            margin-top: 5px;
          }

          .content-info {
            flex: 1;
          }

          .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .content-type {
            font-weight: 600;
            color: #333;
            text-transform: capitalize;
          }

          .content-status {
            font-size: 0.85rem;
            padding: 4px 8px;
            border-radius: 4px;
            background: #e9ecef;
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
            gap: 20px;
            font-size: 0.9rem;
            color: #666;
            flex-wrap: wrap;
          }

          .content-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-width: 120px;
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
            text-align: center;
            font-size: 0.9rem;
          }

          .button.small {
            padding: 6px 12px;
            font-size: 0.8rem;
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

          .button.warning {
            background: #ffc107;
            color: #212529;
            border-color: #ffc107;
          }

          .button.info {
            background: #17a2b8;
            color: white;
            border-color: #17a2b8;
          }

          .button:hover {
            opacity: 0.9;
          }

          .button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
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
            .content-item {
              flex-direction: column;
            }
            
            .content-actions {
              flex-direction: row;
              min-width: auto;
            }
            
            .filters {
              flex-direction: column;
              align-items: stretch;
            }
            
            .content-meta {
              flex-direction: column;
              gap: 5px;
            }
          }
        `
      }} />
    </Layout>
  );
}
