import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Post from '../../components/Post';
import ReportButton from '../../components/ReportButton';
import { useAuth } from '../../context/AuthContext';

export default function ThreadPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    if (!id) return;

    // Get page from URL query
    if (router.query.page) {
      setPage(parseInt(router.query.page));
    }

    fetchThread();
  }, [id, router.query.page]);

  const fetchThread = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/threads/${id}`);

      if (!response.ok) {
        throw new Error('Thread not found');
      }

      const data = await response.json();
      setThread(data);

      // Increment view count (you might want to do this server-side)
      incrementViewCount();
    } catch (err) {
      console.error('Error fetching thread:', err);
      setError('Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await fetch(`/api/threads/${id}/view`, { method: 'POST' });
    } catch (err) {
      // Silently fail - view count increment is not critical
      console.error('Failed to increment view count:', err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading thread...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error">{error}</div>
      </Layout>
    );
  }

  if (!thread) {
    return (
      <Layout>
        <div className="error">Thread not found</div>
      </Layout>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(thread.posts.length / postsPerPage);
  const startIndex = (page - 1) * postsPerPage;
  const paginatedPosts = thread.posts.slice(startIndex, startIndex + postsPerPage);

  return (
    <Layout title={thread.title}>
      <div className="thread-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href={`/categories/${thread.category?.id}`}>{thread.category?.name}</Link> &raquo;
          <Link href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</Link> &raquo;
          <span> {thread.title}</span>
        </div>
        
        <div className="thread-actions top">
          <Link href={`/subjects/${thread.subjectId}/new-thread`} className="button">New Thread</Link>
          {user ? (
            thread.locked ? (
              <span className="button disabled">🔒 Thread Locked</span>
            ) : (
              <Link href={`/threads/${id}/reply`} className="button">Reply</Link>
            )
          ) : (
            <Link href="/login" className="button">Login to Reply</Link>
          )}
          <a href="#bottom" className="button">Bottom</a>
        </div>
        
        <div className="pagination top">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link 
              key={pageNum} 
              href={`/threads/${id}?page=${pageNum}`}
              className={`pagination-link ${page === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
        
        <div className="posts-list">
          {paginatedPosts.map((post, index) => (
            <Post 
              key={post.id} 
              post={post} 
              isFirstPost={index === 0 && page === 1} 
            />
          ))}
        </div>
        
        <div className="pagination bottom">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <Link 
              key={pageNum} 
              href={`/threads/${id}?page=${pageNum}`}
              className={`pagination-link ${page === pageNum ? 'active' : ''}`}
            >
              {pageNum}
            </Link>
          ))}
        </div>
        
        <div className="thread-actions bottom">
          <Link href={`/subjects/${thread.subjectId}/new-thread`} className="button">New Thread</Link>
          {user ? (
            thread.locked ? (
              <span className="button disabled">🔒 Thread Locked</span>
            ) : (
              <Link href={`/threads/${id}/reply`} className="button">Reply</Link>
            )
          ) : (
            <Link href="/login" className="button">Login to Reply</Link>
          )}
          <a href="#top" className="button">Top</a>
        </div>
        
        <div className="thread-tools">
          <h3>Thread Tools</h3>
          <ul>
            <li><a href={`/threads/${id}/print`}>Show Printable Version</a></li>
            <li><a href={`/threads/${id}/email`}>Email this Page</a></li>
            <li><a href={`/threads/${id}/subscribe`}>Subscribe to this Thread</a></li>
            <li><ReportButton type="thread" targetId={thread.id} targetTitle={thread.title} /></li>
          </ul>
          
          <h3>Search this Thread</h3>
          <form className="search-form" onSubmit={(e) => {
            e.preventDefault();
            const searchTerm = e.target.elements[0].value.trim();
            if (searchTerm) {
              // For now, redirect to main search with thread filter
              window.location.href = `/search?q=${encodeURIComponent(searchTerm)}&thread=${id}`;
            }
          }}>
            <input type="text" className="form-input" placeholder="Search this thread..." />
            <button type="submit" className="button">Search</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
