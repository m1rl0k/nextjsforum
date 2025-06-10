import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminTabs,
  AdminTable,
  AdminLoading,
  AdminButton,
  AdminFormGroup,
  AdminEmptyState,
  AdminAlert
} from '../../components/admin/AdminComponents';
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

  // Helper function to strip HTML tags
  const stripHtml = (html) => {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '');
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

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
      
      const res = await fetch(`/api/admin/moderation/content?${params}`, {
        credentials: 'include'
      });
      
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
      setError('Please select items first');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          items: selectedItems
        })
      });

      if (res.ok) {
        await fetchContent();
        setSelectedItems([]);
        setError('');
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
        credentials: 'include',
        body: JSON.stringify({
          action,
          type,
          targetId: id
        })
      });

      if (res.ok) {
        await fetchContent();
        setError('');
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
      <ModerationLayout>
        <AdminLoading size="large" text="Loading content..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  const tabs = [
    { id: 'all', label: 'All Content', icon: '📝' },
    { id: 'threads', label: 'Threads', icon: '💬' },
    { id: 'posts', label: 'Posts', icon: '📄' },
    { id: 'flagged', label: 'Flagged', icon: '🚩' },
    { id: 'deleted', label: 'Deleted', icon: '🗑️' }
  ];

  const columns = [
    {
      key: 'select',
      label: '',
      render: (_, item) => (
        <input
          type="checkbox"
          checked={selectedItems.includes(`${item.type}-${item.id}`)}
          onChange={() => toggleSelection(item.type, item.id)}
        />
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (_, item) => (
        <span>
          {item.type === 'thread' ? '📝' : '💬'} {item.type}
        </span>
      )
    },
    {
      key: 'title',
      label: 'Content',
      render: (title, item) => (
        <div>
          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {stripHtml(item.content).substring(0, 100)}...
          </div>
        </div>
      )
    },
    {
      key: 'user',
      label: 'Author',
      render: (user) => user?.username || 'Unknown'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (createdAt) => new Date(createdAt).toLocaleDateString()
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, item) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: item.deleted ? '#fee2e2' : item.locked ? '#fef3c7' : '#d1fae5',
          color: item.deleted ? '#991b1b' : item.locked ? '#92400e' : '#065f46'
        }}>
          {item.deleted ? '🗑️ Deleted' : item.locked ? '🔒 Locked' : '✅ Active'}
        </span>
      )
    }
  ];

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Content Management"
        description="Manage and moderate forum content"
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'Content Management' }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}

      <AdminCard>
        <div style={{ marginBottom: '1.5rem' }}>
          <AdminFormGroup label="Search">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchContent()}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem'
                }}
              />
              <AdminButton onClick={fetchContent}>Search</AdminButton>
            </div>
          </AdminFormGroup>
        </div>

        <AdminTabs
          tabs={tabs}
          activeTab={filter}
          onTabChange={setFilter}
        />

        {selectedItems.length > 0 && (
          <div style={{
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '0.5rem',
            margin: '1rem 0',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <span>{selectedItems.length} items selected</span>
            <AdminButton 
              variant="danger"
              size="small"
              onClick={() => handleBulkAction('delete')}
              disabled={actionLoading}
              loading={actionLoading}
            >
              Delete Selected
            </AdminButton>
            <AdminButton
              variant="success"
              size="small"
              onClick={() => handleBulkAction('approve')}
              disabled={actionLoading}
              loading={actionLoading}
            >
              Approve Selected
            </AdminButton>
            <AdminButton
              variant="secondary"
              size="small"
              onClick={() => handleBulkAction('restore')}
              disabled={actionLoading}
              loading={actionLoading}
            >
              Restore Selected
            </AdminButton>
          </div>
        )}

        {content.length > 0 ? (
          <AdminTable
            columns={columns}
            data={content}
            loading={isLoading}
            actions={(item) => (
              <>
                <AdminButton
                  size="small"
                  variant="outline"
                  onClick={() => {
                    const url = item.type === 'thread' ? `/threads/${item.id}` : `/threads/${item.threadId}`;
                    window.open(url, '_blank');
                  }}
                  icon="🔍"
                >
                  View
                </AdminButton>
                {!item.deleted ? (
                  <>
                    <AdminButton
                      size="small"
                      variant="danger"
                      onClick={() => handleItemAction('delete', item.type, item.id)}
                      icon="🗑️"
                    >
                      Delete
                    </AdminButton>
                    {item.type === 'thread' && (
                      <AdminButton
                        size="small"
                        variant="secondary"
                        onClick={() => handleItemAction(item.locked ? 'unlock' : 'lock', item.type, item.id)}
                        icon={item.locked ? '🔓' : '🔒'}
                      >
                        {item.locked ? 'Unlock' : 'Lock'}
                      </AdminButton>
                    )}
                  </>
                ) : (
                  <AdminButton
                    size="small"
                    variant="success"
                    onClick={() => handleItemAction('restore', item.type, item.id)}
                    icon="↩️"
                  >
                    Restore
                  </AdminButton>
                )}
              </>
            )}
          />
        ) : (
          <AdminEmptyState
            icon="📝"
            title="No content found"
            description="Try adjusting your filters or search terms."
          />
        )}
      </AdminCard>
    </ModerationLayout>
  );
}
