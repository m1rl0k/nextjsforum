import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
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

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchContent();
  }, [activeTab, pagination.page, searchTerm, sortBy]);

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
        <div className={styles.loading}>Loading content...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Content</h1>
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
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <div className={styles.contentList}>
          {content.length > 0 ? (
            content.map((item) => (
              <div key={item.id} className={styles.contentItem}>
                <div className={styles.contentInfo}>
                  <h3 className={styles.contentTitle}>
                    {activeTab === 'threads' ? item.title : `Reply to: ${item.thread?.title}`}
                  </h3>
                  <div className={styles.contentMeta}>
                    By {item.user?.username} • {new Date(item.createdAt).toLocaleDateString()}
                    {activeTab === 'threads' && (
                      <span> • {item.posts?.length || 0} replies • {item.viewCount || 0} views</span>
                    )}
                  </div>
                  <div className={styles.contentPreview}>
                    {item.content?.substring(0, 200)}...
                  </div>
                </div>
                <div className={styles.contentActions}>
                  <button
                    onClick={() => router.push(activeTab === 'threads' ? `/threads/${item.id}` : `/threads/${item.threadId}#post-${item.id}`)}
                    className={styles.actionButton}
                    title="View"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => router.push(`/admin/${activeTab}/${item.id}/edit`)}
                    className={styles.actionButton}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleContentAction(item.id, item.deleted ? 'restore' : 'delete')}
                    className={`${styles.actionButton} ${item.deleted ? styles.restoreButton : styles.deleteButton}`}
                    title={item.deleted ? 'Restore' : 'Delete'}
                  >
                    {item.deleted ? '♻️' : '🗑️'}
                  </button>
                  {activeTab === 'threads' && (
                    <button
                      onClick={() => handleContentAction(item.id, item.locked ? 'unlock' : 'lock')}
                      className={`${styles.actionButton} ${item.locked ? styles.unlockButton : styles.lockButton}`}
                      title={item.locked ? 'Unlock' : 'Lock'}
                    >
                      {item.locked ? '🔓' : '🔒'}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              No {activeTab} found
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

export default AdminContent;
