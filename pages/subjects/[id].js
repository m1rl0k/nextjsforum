import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function SubjectPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('lastPostAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (id) {
      fetchSubject();
      fetchThreads();
    }
  }, [id, currentPage, sortBy, sortOrder]);

  const fetchSubject = async () => {
    try {
      const res = await fetch(`/api/subjects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubject(data);
      } else {
        setError('Subject not found');
      }
    } catch (err) {
      setError('Failed to load subject');
    }
  };

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subjects/${id}/threads?page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads);
        setTotalPages(data.totalPages);
      } else {
        setError('Failed to load threads');
      }
    } catch (err) {
      setError('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getThreadIcon = (thread) => {
    if (thread.sticky) return '📌';
    if (thread.locked) return '🔒';
    return '💬';
  };

  if (loading && !subject) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div>Error: {error}</div></Layout>;
  }

  if (!subject) {
    return <Layout><div>Subject not found</div></Layout>;
  }

  return (
    <Layout title={subject.name}>
      <div className="subject-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href={`/categories/${subject.category?.id}`}>{subject.category?.name}</Link> &raquo;
          <span> {subject.name}</span>
        </div>
        
        <div className="forum-actions">
          {user ? (
            <Link href={`/subjects/${id}/new-thread`} className="button">New Thread</Link>
          ) : (
            <Link href="/login" className="button">Login to Post</Link>
          )}
          <button className="button">Mark Forum Read</button>
        </div>

        <div className="category-block">
          <div className="category-header">
            {subject.name}
          </div>
          {subject.description && (
            <div className="category-description">
              {subject.description}
            </div>
          )}
          
          <div className="forum-table">
            <div className="thread-header" style={{ display: 'flex', backgroundColor: 'var(--subject-header-bg)', padding: '8px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>Thread / Thread Starter</div>
              <div style={{ width: '80px', textAlign: 'center' }}>Replies</div>
              <div style={{ width: '80px', textAlign: 'center' }}>Views</div>
              <div style={{ width: '200px', textAlign: 'center' }}>Last Post</div>
            </div>
            
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading threads...</div>
            ) : threads.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>No threads in this forum yet.</div>
            ) : (
              threads.map(thread => (
                <div key={thread.id} className="thread-row">
                  <div className="thread-icon">
                    {getThreadIcon(thread)}
                  </div>
                  <div className="thread-info">
                    <div className="thread-title">
                      <Link href={`/threads/${thread.id}`}>
                        {thread.title}
                      </Link>
                      {thread.sticky && <span style={{ color: 'red', fontSize: '11px' }}> [STICKY]</span>}
                      {thread.locked && <span style={{ color: 'orange', fontSize: '11px' }}> [LOCKED]</span>}
                    </div>
                    <div className="thread-starter">
                      Started by <Link href={`/profile/${thread.user?.username}`}>{thread.user?.username}</Link>
                    </div>
                  </div>
                  <div className="thread-stats">
                    <div>{thread.posts?.length || 0}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>replies</div>
                  </div>
                  <div className="thread-stats">
                    <div>{thread.viewCount || 0}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>views</div>
                  </div>
                  <div className="thread-lastpost">
                    <div style={{ fontSize: '11px' }}>
                      {formatDate(thread.lastPostAt)}
                    </div>
                    <div style={{ fontSize: '10px' }}>
                      by <Link href={`/profile/${thread.user?.username}`}>{thread.user?.username}</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {currentPage > 1 && (
              <button 
                onClick={() => setCurrentPage(currentPage - 1)}
                className="pagination-link"
              >
                Previous
              </button>
            )}
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-link ${page === currentPage ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            
            {currentPage < totalPages && (
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                className="pagination-link"
              >
                Next
              </button>
            )}
          </div>
        )}

        <div className="forum-actions">
          {user ? (
            <Link href={`/subjects/${id}/new-thread`} className="button">New Thread</Link>
          ) : (
            <Link href="/login" className="button">Login to Post</Link>
          )}
        </div>
      </div>
    </Layout>
  );
}
