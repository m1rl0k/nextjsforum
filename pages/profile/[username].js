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

  const stripHtml = (html) => {
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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
    <Layout
      title={`${user.username}'s Profile`}
      description={user.bio || `View ${user.username}'s profile, posts, and activity on the forum.`}
      type="profile"
      profile={{
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      }}
    >
      <div className="profile-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; 
          <Link href="/members">Members</Link> &raquo;
          <span> {user.username}</span>
        </div>

        <div className="profile-card">
          <div className="profile-header">
            {user.username}'s Profile
          </div>

          <div className="profile-content">
            <div className="profile-layout">
              {/* User Info Sidebar */}
              <div className="profile-sidebar">
                <div className="avatar-section">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.username}'s avatar`}
                      className="avatar-img"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="username-section">
                  <h3>{user.username}</h3>
                  <div className="user-role">
                    {user.role === 'ADMIN' && '👑 Administrator'}
                    {user.role === 'MODERATOR' && '🛡️ Moderator'}
                    {user.role === 'USER' && '👤 Member'}
                  </div>
                </div>

                <div className="user-stats">
                  <div className="stat-row"><strong>Joined:</strong> {getJoinDate(user.createdAt)}</div>
                  <div className="stat-row"><strong>Posts:</strong> {user.postCount || 0}</div>
                  <div className="stat-row"><strong>Threads:</strong> {user.threadCount || user.threads?.length || 0}</div>
                  {user.location && <div className="stat-row"><strong>Location:</strong> {user.location}</div>}
                </div>

                {user.bio && (
                  <div className="bio-section">
                    <strong>Bio:</strong><br />
                    {user.bio}
                  </div>
                )}

                {user.website && (
                  <div className="website-section">
                    <strong>Website:</strong><br />
                    <a href={user.website} target="_blank" rel="noopener noreferrer">
                      {user.website}
                    </a>
                  </div>
                )}

                {currentUser && currentUser.id === user.id && (
                  <div className="action-section">
                    <Link href="/account/settings" className="profile-btn">
                      ✏️ Edit Profile
                    </Link>
                  </div>
                )}

                {currentUser && currentUser.id !== user.id && (
                  <div className="action-section">
                    <Link href={`/messages/new?to=${user.username}`} className="profile-btn">
                      ✉️ Send Message
                    </Link>
                  </div>
                )}
              </div>

              {/* Main Content */}
              <div className="profile-main">
                {/* Tabs */}
                <div className="profile-tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('threads')}
                    className={`tab-btn ${activeTab === 'threads' ? 'active' : ''}`}
                  >
                    Recent Threads
                  </button>
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                  >
                    Recent Posts
                  </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {activeTab === 'overview' && (
                    <div>
                      <h4 className="section-title">User Statistics</h4>
                      <div className="stats-grid">
                        <div className="stats-box">
                          <div className="stats-number">{user.postCount || 0}</div>
                          <div className="stats-label">Total Posts</div>
                        </div>
                        <div className="stats-box">
                          <div className="stats-number">{user.threadCount || user.threads?.length || 0}</div>
                          <div className="stats-label">Total Threads</div>
                        </div>
                      </div>

                      {user.signature && (
                        <div>
                          <h4 className="section-title">Signature</h4>
                          <div className="signature-box">
                            {user.signature}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'threads' && (
                    <div>
                      <h4 className="section-title">Recent Threads</h4>
                      {recentThreads.length === 0 ? (
                        <div className="empty-message">No threads found.</div>
                      ) : (
                        recentThreads.map(thread => (
                          <div key={thread.id} className="thread-row">
                            <div>
                              <Link href={`/threads/${thread.id}`} className="thread-link">
                                {thread.title}
                              </Link>
                              <div className="thread-meta">
                                in <Link href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</Link>
                              </div>
                            </div>
                            <div className="thread-date">
                              {formatDate(thread.createdAt)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'posts' && (
                    <div>
                      <h4 className="section-title">Recent Posts</h4>
                      {recentPosts.length === 0 ? (
                        <div className="empty-message">No posts found.</div>
                      ) : (
                        recentPosts.map(post => {
                          const cleanContent = stripHtml(post.content);
                          return (
                            <div key={post.id} className="post-row">
                              <div className="post-header">
                                <Link href={`/threads/${post.threadId}#post-${post.id}`} className="thread-link">
                                  {post.thread?.title}
                                </Link>
                                <div className="thread-meta">
                                  {formatDate(post.createdAt)} in <Link href={`/subjects/${post.thread?.subjectId}`}>{post.thread?.subject?.name}</Link>
                                </div>
                              </div>
                              <div className="post-excerpt">
                                {cleanContent.length > 200 ? cleanContent.substring(0, 200) + '...' : cleanContent}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .profile-page {
            font-family: Tahoma, Verdana, Arial, sans-serif;
            font-size: 11px;
          }
          .profile-card {
            border: 1px solid #6B84AA;
            margin-top: 10px;
          }
          .profile-header {
            background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
            color: white;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: bold;
          }
          .profile-content {
            background: white;
            padding: 15px;
          }
          .profile-layout {
            display: flex;
            gap: 15px;
          }
          .profile-sidebar {
            width: 200px;
            background: #F5F5F5;
            padding: 12px;
            border: 1px solid #C0C0C0;
          }
          .avatar-section {
            text-align: center;
            margin-bottom: 10px;
          }
          .avatar-img {
            width: 80px;
            height: 80px;
            border-radius: 3px;
            border: 1px solid #6B84AA;
          }
          .avatar-placeholder {
            width: 80px;
            height: 80px;
            border-radius: 3px;
            background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin: 0 auto;
            border: 1px solid #2B4F81;
          }
          .username-section {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid #C0C0C0;
          }
          .username-section h3 {
            margin: 0 0 3px 0;
            font-size: 13px;
            color: #22497D;
          }
          .user-role {
            font-size: 10px;
            color: #666;
          }
          .user-stats {
            font-size: 10px;
            line-height: 1.6;
          }
          .stat-row {
            margin-bottom: 2px;
          }
          .bio-section, .website-section {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #C0C0C0;
            font-size: 10px;
          }
          .website-section a {
            color: #22497D;
            word-break: break-all;
          }
          .website-section a:hover {
            color: #FF4400;
          }
          .action-section {
            margin-top: 12px;
          }
          .profile-btn {
            display: block;
            padding: 5px 10px;
            text-align: center;
            background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
            color: white;
            font-size: 10px;
            text-decoration: none;
            border: 1px solid #2B4F81;
          }
          .profile-btn:hover {
            background: linear-gradient(to bottom, #3A6090 0%, #1E3A5F 100%);
          }
          .profile-main {
            flex: 1;
          }
          .profile-tabs {
            display: flex;
            gap: 2px;
            border-bottom: 1px solid #6B84AA;
            margin-bottom: 12px;
          }
          .tab-btn {
            padding: 6px 12px;
            border: 1px solid #6B84AA;
            border-bottom: none;
            background: linear-gradient(to bottom, #E0E0E0 0%, #C0C0C0 100%);
            color: #333;
            cursor: pointer;
            font-size: 10px;
            font-family: Tahoma, Verdana, Arial, sans-serif;
          }
          .tab-btn:hover {
            background: linear-gradient(to bottom, #F0F0F0 0%, #D0D0D0 100%);
          }
          .tab-btn.active {
            background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
            color: white;
          }
          .tab-content {
            min-height: 200px;
          }
          .section-title {
            background: linear-gradient(to bottom, #8FA3C7 0%, #738FBF 100%);
            color: white;
            padding: 5px 10px;
            margin: 0 0 10px 0;
            font-size: 11px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          .stats-box {
            padding: 12px;
            background: #F5F5F5;
            border: 1px solid #C0C0C0;
            text-align: center;
          }
          .stats-number {
            font-size: 20px;
            font-weight: bold;
            color: #22497D;
          }
          .stats-label {
            font-size: 10px;
            color: #666;
          }
          .signature-box {
            padding: 10px;
            background: #F5F5F5;
            border-left: 3px solid #4C76B2;
            font-size: 10px;
            font-style: italic;
          }
          .empty-message {
            padding: 20px;
            text-align: center;
            color: #666;
            background: #F5F5F5;
          }
          .thread-row {
            padding: 8px 10px;
            border-bottom: 1px solid #E0E0E0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .thread-row:hover {
            background: #F5F5F5;
          }
          .thread-link {
            font-weight: bold;
            color: #22497D;
            text-decoration: none;
          }
          .thread-link:hover {
            color: #FF4400;
            text-decoration: underline;
          }
          .thread-meta {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
          .thread-meta a {
            color: #22497D;
          }
          .thread-date {
            font-size: 10px;
            color: #666;
          }
          .post-row {
            padding: 10px;
            background: #F5F5F5;
            border: 1px solid #E0E0E0;
            margin-bottom: 8px;
          }
          .post-header {
            margin-bottom: 8px;
          }
          .post-excerpt {
            font-size: 11px;
            color: #333;
            line-height: 1.5;
          }
          @media (max-width: 768px) {
            .profile-layout {
              flex-direction: column;
            }
            .profile-sidebar {
              width: 100%;
            }
            .stats-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}
