import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminThreads.module.css';

const AdminThreads = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/admin/threads');
      return;
    }

    if (user?.role !== 'ADMIN' && !loading) {
      router.push('/');
      return;
    }
    fetchThreads();
  }, [pagination.page, searchTerm, sortBy]);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      const { page, limit } = pagination;
      const query = new URLSearchParams({
        page,
        limit,
        search: searchTerm,
        sort: sortBy
      }).toString();
      
      const res = await fetch(`/api/admin/threads?${query}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch threads');
      }
      
      setThreads(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load threads');
      console.error('Error fetching threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleThreadAction = async (threadId, action) => {
    try {
      const res = await fetch(`/api/admin/threads/${threadId}`, {
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

      // Refresh threads after action
      await fetchThreads();
    } catch (err) {
      console.error('Error performing thread action:', err);
      setError(err.message || 'Failed to perform action');
    }
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading threads...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Manage Threads</h1>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search threads..."
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
              <option value="title">Title (A-Z)</option>
              <option value="replies">Most Replies</option>
            </select>
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        <div className={styles.threadsTableContainer}>
          <table className={styles.threadsTable}>
            <thead>
              <tr>
                <th>Thread</th>
                <th>Author</th>
                <th>Subject</th>
                <th>Replies</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {threads.length > 0 ? (
                threads.map((thread) => (
                  <tr key={thread.id}>
                    <td>
                      <div className={styles.threadCell}>
                        <div className={styles.threadTitle}>{thread.title}</div>
                        <div className={styles.threadMeta}>
                          {thread.sticky && <span className={styles.sticky}>📌 Sticky</span>}
                          {thread.locked && <span className={styles.locked}>🔒 Locked</span>}
                        </div>
                      </div>
                    </td>
                    <td>{thread.user?.username || 'Unknown'}</td>
                    <td>{thread.subject?.name || 'Unknown'}</td>
                    <td>{thread.posts?.length || 0}</td>
                    <td>{new Date(thread.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/threads/${thread.id}`)}
                          className={styles.actionButton}
                          title="View Thread"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleThreadAction(thread.id, thread.sticky ? 'unsticky' : 'sticky')}
                          className={`${styles.actionButton} ${thread.sticky ? styles.unstickyButton : styles.stickyButton}`}
                          title={thread.sticky ? 'Remove Sticky' : 'Make Sticky'}
                        >
                          {thread.sticky ? '📌' : '📍'}
                        </button>
                        <button
                          onClick={() => handleThreadAction(thread.id, thread.locked ? 'unlock' : 'lock')}
                          className={`${styles.actionButton} ${thread.locked ? styles.unlockButton : styles.lockButton}`}
                          title={thread.locked ? 'Unlock Thread' : 'Lock Thread'}
                        >
                          {thread.locked ? '🔓' : '🔒'}
                        </button>
                        <button
                          onClick={() => handleThreadAction(thread.id, 'delete')}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title="Delete Thread"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noResults}>
                    No threads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

export default AdminThreads;
