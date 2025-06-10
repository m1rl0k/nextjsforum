import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../../../styles/AdminPosts.module.css';

const AdminPosts = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
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
      router.push('/login?redirect=/admin/posts');
      return;
    }

    if (user?.role !== 'ADMIN' && !loading) {
      router.push('/');
      return;
    }
    fetchPosts();
  }, [pagination.page, searchTerm, sortBy]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const { page, limit } = pagination;
      const query = new URLSearchParams({
        page,
        limit,
        search: searchTerm,
        sort: sortBy
      }).toString();
      
      const res = await fetch(`/api/admin/posts?${query}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }
      
      setPosts(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load posts');
      console.error('Error fetching posts:', err);
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

  const handlePostAction = async (postId, action) => {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
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

      // Refresh posts after action
      await fetchPosts();
    } catch (err) {
      console.error('Error performing post action:', err);
      setError(err.message || 'Failed to perform action');
    }
  };

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

  const truncateContent = (content, maxLength = 150) => {
    const cleanContent = stripHtml(content);
    if (cleanContent.length <= maxLength) return cleanContent;
    return cleanContent.substring(0, maxLength) + '...';
  };

  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading posts...</div>
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
          <h1>Manage Posts</h1>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search posts..."
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
              <option value="user">By User</option>
            </select>
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        <div className={styles.postsTableContainer}>
          <table className={styles.postsTable}>
            <thead>
              <tr>
                <th>Content</th>
                <th>Author</th>
                <th>Thread</th>
                <th>Subject</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className={styles.postContent}>
                        {truncateContent(post.content)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.username}>
                          {post.user?.username || 'Unknown'}
                        </div>
                        <div className={styles.userRole}>
                          {post.user?.role || 'USER'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.threadInfo}>
                        <div className={styles.threadTitle}>
                          {post.thread?.title || 'Unknown Thread'}
                        </div>
                      </div>
                    </td>
                    <td>{post.thread?.subject?.name || 'Unknown'}</td>
                    <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/threads/${post.thread?.id}#post-${post.id}`)}
                          className={styles.actionButton}
                          title="View Post"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handlePostAction(post.id, 'delete')}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          title="Delete Post"
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
                    No posts found
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

export default AdminPosts;
