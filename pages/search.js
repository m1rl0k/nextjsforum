import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Search() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState({
    threads: [],
    posts: [],
    users: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Check if there's a search query in the URL
    if (router.query.q) {
      setSearchTerm(router.query.q);
      setSearchType(router.query.type || 'all');
      performSearch(router.query.q, router.query.type || 'all', 1);
    }
  }, [router.query]);

  const performSearch = async (term, type, page = 1) => {
    if (!term.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: term,
        type,
        page
      });

      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(page);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // Update URL
    router.push(`/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}`, undefined, { shallow: true });
    performSearch(searchTerm, searchType, 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const highlightText = (text, term) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <Layout title="Search">
      <div className="search-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <span> Search</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Search Forum
          </div>
          
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Enter search terms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    flex: 1,
                    minWidth: '300px',
                    padding: '8px 12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                />
                <select 
                  value={searchType} 
                  onChange={(e) => setSearchType(e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '3px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Content</option>
                  <option value="threads">Threads Only</option>
                  <option value="posts">Posts Only</option>
                  <option value="users">Users Only</option>
                </select>
                <button type="submit" className="button" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {error && (
              <div style={{ 
                backgroundColor: '#ffebee', 
                color: '#c62828', 
                padding: '10px', 
                marginBottom: '20px',
                border: '1px solid #ef5350',
                borderRadius: '3px'
              }}>
                {error}
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Searching...
              </div>
            )}

            {hasSearched && !loading && (
              <div>
                {/* Threads Results */}
                {(searchType === 'all' || searchType === 'threads') && results.threads.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>
                      Threads ({results.threads.length})
                    </h3>
                    {results.threads.map(thread => (
                      <div key={thread.id} style={{ 
                        padding: '15px', 
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--thread-alt-bg)',
                        marginBottom: '10px',
                        borderRadius: '3px'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <Link href={`/threads/${thread.id}`} style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            <span dangerouslySetInnerHTML={{ __html: highlightText(thread.title, searchTerm) }} />
                          </Link>
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlightText(
                              thread.content.length > 200 ? thread.content.substring(0, 200) + '...' : thread.content, 
                              searchTerm
                            ) 
                          }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Started by <Link href={`/profile/${thread.user?.username}`}>{thread.user?.username}</Link> 
                          {' '} on {formatDate(thread.createdAt)} 
                          {' '} in <Link href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Posts Results */}
                {(searchType === 'all' || searchType === 'posts') && results.posts.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>
                      Posts ({results.posts.length})
                    </h3>
                    {results.posts.map(post => (
                      <div key={post.id} style={{ 
                        padding: '15px', 
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--thread-alt-bg)',
                        marginBottom: '10px',
                        borderRadius: '3px'
                      }}>
                        <div style={{ marginBottom: '8px' }}>
                          <Link href={`/threads/${post.threadId}#post-${post.id}`} style={{ fontWeight: 'bold' }}>
                            Re: {post.thread?.title}
                          </Link>
                        </div>
                        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlightText(
                              post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content, 
                              searchTerm
                            ) 
                          }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          Posted by <Link href={`/profile/${post.user?.username}`}>{post.user?.username}</Link> 
                          {' '} on {formatDate(post.createdAt)}
                          {' '} in <Link href={`/subjects/${post.thread?.subjectId}`}>{post.thread?.subject?.name}</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Users Results */}
                {(searchType === 'all' || searchType === 'users') && results.users.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>
                      Users ({results.users.length})
                    </h3>
                    {results.users.map(user => (
                      <div key={user.id} style={{ 
                        padding: '15px', 
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: 'var(--thread-alt-bg)',
                        marginBottom: '10px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px'
                      }}>
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={`${user.username}'s avatar`}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-color)' }}
                          />
                        ) : (
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '18px'
                          }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ marginBottom: '5px' }}>
                            <Link href={`/profile/${user.username}`} style={{ fontWeight: 'bold', fontSize: '16px' }}>
                              <span dangerouslySetInnerHTML={{ __html: highlightText(user.username, searchTerm) }} />
                            </Link>
                            {user.role !== 'USER' && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '11px', 
                                color: user.role === 'ADMIN' ? '#d32f2f' : '#1976d2' 
                              }}>
                                {user.role === 'ADMIN' ? '👑 Admin' : '🛡️ Moderator'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {user.postCount || 0} posts • Joined {formatDate(user.createdAt)}
                            {user.location && ` • 📍 ${user.location}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {hasSearched && !loading && 
                 results.threads.length === 0 && 
                 results.posts.length === 0 && 
                 results.users.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No results found for "{searchTerm}". Try different keywords or search terms.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        mark {
          background-color: yellow;
          padding: 1px 2px;
        }
      `}</style>
    </Layout>
  );
}
