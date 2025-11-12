import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminLoading,
  AdminButton,
  AdminEmptyState,
  AdminAlert
} from '../../components/admin/AdminComponents';
import Link from 'next/link';

export default function PendingContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  // Helper function to strip HTML tags and get clean text
  const stripHtml = (html) => {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '');
    // Decode HTML entities (safe for SSR)
    if (typeof document === 'undefined') {
      // Server-side: use regex to decode common entities
      return text
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#039;', "'")
        .replaceAll('&nbsp;', ' ');
    }
    // Client-side: use DOM API
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
      fetchPendingContent();
    }
  }, [isAuthenticated, user, loading, router]);

  const fetchPendingContent = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/moderation/pending-content?limit=50', {
        credentials: 'include'
      });
      
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
        credentials: 'include',
        body: JSON.stringify({
          action,
          type,
          targetId,
          reason: `${action} by moderator`
        })
      });

      if (res.ok) {
        await fetchPendingContent();
        setError('');
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
      <ModerationLayout>
        <AdminLoading size="large" text="Loading pending content..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Pending Content"
        description="Review and approve content awaiting moderation"
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'Pending Content' }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}

      {content.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {content.map((item) => (
            <AdminCard key={`${item.type}-${item.id}`}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: '#333',
                    textTransform: 'capitalize'
                  }}>
                    {item.type === 'thread' ? '📝' : '💬'} {item.type}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ 
                  margin: '0 0 0.75rem 0', 
                  color: '#333', 
                  fontSize: '1.1rem' 
                }}>
                  {item.title}
                </h3>
                
                <div style={{ 
                  color: '#666', 
                  marginBottom: '1rem', 
                  lineHeight: '1.4',
                  maxHeight: '100px',
                  overflow: 'hidden'
                }}>
                  {stripHtml(item.content).substring(0, 200)}...
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.25rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  <span><strong>By:</strong> <Link href={`/profile/${item.user?.username || 'user'}`} style={{ color: '#3b82f6' }}>
                    {item.user?.username}
                  </Link></span>
                  {item.subject && <span><strong>In:</strong> {item.subject}</span>}
                  {item.threadId && (
                    <span>
                      <strong>Thread:</strong> 
                      <Link 
                        href={`/threads/${item.threadId}`}
                        style={{ color: '#3b82f6', marginLeft: '0.25rem' }}
                      >
                        View Thread
                      </Link>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <AdminButton 
                    variant="success"
                    size="small"
                    onClick={() => handleContentAction('approve', item.type, item.id)}
                    disabled={actionLoading[`${item.type}-${item.id}`]}
                    loading={actionLoading[`${item.type}-${item.id}`]}
                    icon="✅"
                  >
                    Approve
                  </AdminButton>
                  
                  <AdminButton 
                    variant="danger"
                    size="small"
                    onClick={() => handleContentAction('reject', item.type, item.id)}
                    disabled={actionLoading[`${item.type}-${item.id}`]}
                    loading={actionLoading[`${item.type}-${item.id}`]}
                    icon="❌"
                  >
                    Reject
                  </AdminButton>

                  <AdminButton 
                    variant="outline"
                    size="small"
                    onClick={() => {
                      const url = item.type === 'thread' 
                        ? `/threads/${item.id}` 
                        : `/threads/${item.threadId}`;
                      window.open(url, '_blank');
                    }}
                    icon="🔍"
                  >
                    View
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      ) : (
        <AdminEmptyState
          icon="⏳"
          title="No pending content"
          description="All content has been reviewed or there's nothing waiting for approval."
        />
      )}
    </ModerationLayout>
  );
}
