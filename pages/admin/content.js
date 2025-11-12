import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AdminPageHeader,
  AdminCard,
  AdminTabs,
  AdminTable,
  AdminPagination,
  AdminLoading,
  AdminButton,
  AdminFormGroup,
  AdminEmptyState
} from '../../components/admin/AdminComponents';
import styles from '../../styles/AdminContent.module.css';

const AdminContent = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('threads');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Helper function to strip HTML tags and get clean text
  const stripHtml = (html) => {
    if (!html) return '';
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, '');
    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchContent();
  }, [user, authLoading, router, activeTab, pagination.page, searchTerm, sortBy]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const query = new URLSearchParams({
        page,
        limit,
        search: searchTerm,
        sort: sortBy,
        type: activeTab
      }).toString();
      
      const res = await fetch(`/api/admin/content?${query}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch content');
      }
      
      setContent(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      }));
    } catch (err) {
      setError(err.message || 'Failed to load content');
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContentAction = async (contentId, action) => {
    try {
      const endpoint = activeTab === 'threads' ? 'threads' : 'posts';
      const res = await fetch(`/api/admin/${endpoint}/${contentId}`, {
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

      await fetchContent();
    } catch (err) {
      console.error('Error performing content action:', err);
      setError(err.message || 'Failed to perform action');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const tabs = [
    { id: 'threads', label: 'Threads', icon: '💬' },
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'reported', label: 'Reported Content', icon: '⚠️' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <AdminLoading size="large" text="Loading content..." />
      </AdminLayout>
    );
  }

  const columns = [
    {
      key: 'content',
      label: 'Content',
      render: (content) => (
        <div className={styles.contentPreview}>
          {stripHtml(content).substring(0, 100)}...
        </div>
      )
    },
    {
      key: 'user',
      label: 'Author',
      render: (user) => (
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{user?.username || 'Unknown'}</div>
          <div className={styles.authorRole}>{user?.role || 'USER'}</div>
        </div>
      )
    },
    {
      key: 'thread',
      label: 'Thread',
      render: (thread, item) => (
        <div className={styles.threadInfo}>
          <div className={styles.threadTitle}>
            {activeTab === 'threads' ? item.title : thread?.title || 'Unknown Thread'}
          </div>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (subject, item) => (
        <div className={styles.subjectInfo}>
          {item.subject?.name || item.thread?.subject?.name || 'General'}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (createdAt) => new Date(createdAt).toLocaleDateString()
    }
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Manage Content"
        description="View and moderate forum threads and posts"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Content Management' }
        ]}
      />

      <AdminCard>
        <div className={styles.controls}>
          <AdminFormGroup label="Search">
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_replies">Most Replies</option>
                <option value="most_views">Most Views</option>
              </select>
              <AdminButton type="submit" variant="primary">
                Search
              </AdminButton>
            </form>
          </AdminFormGroup>
        </div>

        <AdminTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {content.length > 0 ? (
          <AdminTable
            columns={columns}
            data={content}
            loading={loading}
            actions={(item) => (
              <>
                <AdminButton
                  size="small"
                  variant="outline"
                  onClick={() => router.push(activeTab === 'threads' ? `/threads/${item.id}` : `/threads/${item.threadId}#post-${item.id}`)}
                  icon="👁️"
                  title="View"
                />
                <AdminButton
                  size="small"
                  variant="outline"
                  onClick={() => handleContentAction(item.id, item.deleted ? 'restore' : 'delete')}
                  icon={item.deleted ? '♻️' : '🗑️'}
                  title={item.deleted ? 'Restore' : 'Delete'}
                />
                {activeTab === 'threads' && (
                  <AdminButton
                    size="small"
                    variant="outline"
                    onClick={() => handleContentAction(item.id, item.locked ? 'unlock' : 'lock')}
                    icon={item.locked ? '🔓' : '🔒'}
                    title={item.locked ? 'Unlock' : 'Lock'}
                  />
                )}
              </>
            )}
          />
        ) : (
          <AdminEmptyState
            icon="📝"
            title={`No ${activeTab} found`}
            description={`There are no ${activeTab} to display at the moment.`}
          />
        )}

        {pagination.totalPages > 1 && (
          <AdminPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </AdminCard>
    </AdminLayout>
  );
};

export default AdminContent;
