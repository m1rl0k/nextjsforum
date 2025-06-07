import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function UserProfile() {
  const router = useRouter();
  const { username } = router.query;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [recentThreads, setRecentThreads] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRecentThreads(data.recentThreads || []);
        setRecentPosts(data.recentPosts || []);
      } else {
        setError('User not found');
      }
    } catch (err) {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div>Error: {error}</div></Layout>;
  }

  if (!user) {
    return <Layout><div>User not found</div></Layout>;
  }

  return (
    <Layout title={`${user.username}'s Profile`}>
      <div className="profile-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href="/members">Members</Link> &raquo;
          <span> {user.username}</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            {user.username}'s Profile
          </div>
          
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* User Info Sidebar */}
              <div style={{ width: '250px', backgroundColor: 'var(--sidebar-bg)', padding: '15px', borderRadius: '5px' }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={`${user.username}'s avatar`}
                      style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--border-color)' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--primary-color)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '36px',
                      margin: '0 auto'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{user.username}</h3>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {user.role === 'ADMIN' && '👑 Administrator'}
                    {user.role === 'MODERATOR' && '🛡️ Moderator'}
                    {user.role === 'USER' && '👤 Member'}
                  </div>
                </div>

                <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                  <div><strong>Joined:</strong> {getJoinDate(user.createdAt)}</div>
                  <div><strong>Posts:</strong> {user.postCount || 0}</div>
                  <div><strong>Threads:</strong> {user.threads?.length || 0}</div>
                  {user.location && <div><strong>Location:</strong> {user.location}</div>}
                </div>

                {user.bio && (
                  <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '3px', fontSize: '12px' }}>
                    <strong>Bio:</strong><br />
                    {user.bio}
                  </div>
                )}

                {currentUser && currentUser.id !== user.id && (
                  <div style={{ marginTop: '15px' }}>
                    <Link href={`/messages/new?to=${user.username}`} className="button" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                      Send Message
                    </Link>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div style={{ flex: 1 }}>
                {/* Tabs */}
                <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <button 
                      onClick={() => setActiveTab('overview')}
                      style={{ 
                        padding: '10px 15px', 
                        border: 'none', 
                        backgroundColor: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'overview' ? 'white' : 'var(--link-color)',
                        cursor: 'pointer',
                        borderRadius: '3px 3px 0 0'
                      }}
                    >
                      Overview
                    </button>
                    <button 
                      onClick={() => setActiveTab('threads')}
                      style={{ 
                        padding: '10px 15px', 
                        border: 'none', 
                        backgroundColor: activeTab === 'threads' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'threads' ? 'white' : 'var(--link-color)',
                        cursor: 'pointer',
                        borderRadius: '3px 3px 0 0'
                      }}
                    >
                      Recent Threads
                    </button>
                    <button 
                      onClick={() => setActiveTab('posts')}
                      style={{ 
                        padding: '10px 15px', 
                        border: 'none', 
                        backgroundColor: activeTab === 'posts' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'posts' ? 'white' : 'var(--link-color)',
                        cursor: 'pointer',
                        borderRadius: '3px 3px 0 0'
                      }}
                    >
                      Recent Posts
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div>
                    <h4>User Statistics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ padding: '15px', backgroundColor: 'var(--thread-alt-bg)', borderRadius: '5px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{user.postCount || 0}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Posts</div>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: 'var(--thread-alt-bg)', borderRadius: '5px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{user.threads?.length || 0}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Threads Started</div>
                      </div>
                    </div>

                    {user.signature && (
                      <div>
                        <h4>Signature</h4>
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: 'var(--thread-alt-bg)', 
                          borderLeft: '3px solid var(--primary-color)',
                          fontSize: '12px',
                          fontStyle: 'italic'
                        }}>
                          {user.signature}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'threads' && (
                  <div>
                    <h4>Recent Threads</h4>
                    {recentThreads.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        No threads found.
                      </div>
                    ) : (
                      recentThreads.map(thread => (
                        <div key={thread.id} style={{ 
                          padding: '10px', 
                          borderBottom: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <Link href={`/threads/${thread.id}`} style={{ fontWeight: 'bold' }}>
                              {thread.title}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              in <Link href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</Link>
                            </div>
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {formatDate(thread.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'posts' && (
                  <div>
                    <h4>Recent Posts</h4>
                    {recentPosts.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        No posts found.
                      </div>
                    ) : (
                      recentPosts.map(post => (
                        <div key={post.id} style={{ 
                          padding: '15px', 
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: 'var(--thread-alt-bg)',
                          marginBottom: '10px',
                          borderRadius: '3px'
                        }}>
                          <div style={{ marginBottom: '10px' }}>
                            <Link href={`/threads/${post.threadId}#post-${post.id}`} style={{ fontWeight: 'bold' }}>
                              Re: {post.thread?.title}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {formatDate(post.createdAt)} in <Link href={`/subjects/${post.thread?.subjectId}`}>{post.thread?.subject?.name}</Link>
                            </div>
                          </div>
                          <div style={{ fontSize: '13px' }}>
                            {post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
