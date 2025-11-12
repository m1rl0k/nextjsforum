import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

export default function ConversationView() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const fetchingRef = useRef(false);

  // Reset state when ID changes
  useEffect(() => {
    if (id && id !== '[id]' && typeof id === 'string') {
      setHasInitialized(false);
      setIsReady(false);
      fetchingRef.current = false;
      setMessages([]);
      setOtherUser(null);
      setError('');
    }
  }, [id]);

  useEffect(() => {
    // Wait for router and auth to be ready
    if (!router.isReady || authLoading) return;

    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    // Only fetch once when we have a valid ID and haven't initialized yet
    if (id && id !== '[id]' && typeof id === 'string' && !hasInitialized) {
      setHasInitialized(true);
      fetchConversation();
    }
  }, [router.isReady, authLoading, id, user, hasInitialized]);

  const stripHtml = (html) => {
    if (!html) return '';
    if (typeof window === 'undefined') return html;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const fetchConversation = async () => {
    // Don't fetch if ID is invalid or already fetching
    if (!id || id === '[id]' || typeof id !== 'string' || fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError('');

      const res = await fetch(`/api/messages/conversations?conversationId=${id}`, {
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          
          // Determine the other user from the first message
          const firstMessage = data.messages[0];
          const isCurrentUserSender = firstMessage.senderId === user.id.toString() || firstMessage.senderId === user.id;
          
          if (isCurrentUserSender) {
            setOtherUser({
              id: firstMessage.recipientId,
              username: firstMessage.recipient?.username,
              avatar: firstMessage.recipient?.avatar
            });
          } else {
            setOtherUser({
              id: firstMessage.senderId,
              username: firstMessage.sender?.username,
              avatar: firstMessage.sender?.avatar
            });
          }
          
          // Mark conversation as read
          markAsRead();
          setIsReady(true);
        } else {
          setError('No messages found in this conversation');
          setIsReady(true);
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load conversation');
        setIsReady(true);
      }
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
      setIsReady(true);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const markAsRead = async () => {
    if (!id || id === '[id]') return;

    try {
      await fetch('/api/messages/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: id
        }),
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim() || !otherUser) {
      return;
    }
    
    setSending(true);

    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipientUsername: otherUser.username,
          content: replyContent.trim(),
          conversationId: id
        }),
      });

      if (res.ok) {
        setReplyContent('');
        // Reset the initialization flag to allow refresh
        setHasInitialized(false);
        setIsReady(false);
        fetchingRef.current = false;
        await fetchConversation(); // Refresh the conversation
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  // Don't render anything if router is not ready or auth is loading
  if (!router.isReady || authLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="loading-spinner">💬</div>
          <div>Loading...</div>
        </div>
      </Layout>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return null; // Will redirect to login
  }

  // Don't render if we don't have a valid conversation ID
  if (!id || id === '[id]' || typeof id !== 'string') {
    return (
      <Layout>
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-text">Invalid conversation ID</div>
          <Link href="/messages" className="button">
            Back to Messages
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading || !isReady) {
    return (
      <Layout>
        <div className="loading">
          <div className="loading-spinner">💬</div>
          <div>Loading conversation...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error}</div>
          <Link href="/messages" className="button">
            Back to Messages
          </Link>
        </div>
      </Layout>
    );
  }

  if (!messages.length) {
    return (
      <Layout>
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No messages found</h3>
          <Link href="/messages" className="button">
            Back to Messages
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Conversation with ${otherUser?.username || 'Unknown User'}`}>
      <div className="conversation-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <Link href="/messages">Messages</Link> &raquo;
          <span> Conversation with {otherUser?.username || 'Unknown User'}</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            <div className="category-title">
              <span className="category-icon">💬</span>
              Conversation with {otherUser?.username || 'Unknown User'}
            </div>
            <div className="conversation-actions">
              <Link href="/messages" className="back-btn">
                ← Back to Messages
              </Link>
            </div>
          </div>

          <div className="conversation-info">
            <div className="other-user-avatar">
              {otherUser?.avatar ? (
                <img src={otherUser.avatar} alt={otherUser.username} />
              ) : (
                <div className="avatar-placeholder">
                  {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <div className="conversation-details">
              <div className="user-name">
                <Link href={`/profile/${otherUser?.username || 'user'}`}>
                  {otherUser?.username || 'Unknown User'}
                </Link>
              </div>
              <div className="message-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        <div className="category-block">
          <div className="category-header">
            Messages
          </div>

          <table className="messages-table" cellSpacing="1" cellPadding="0">
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === user.id.toString() || message.senderId === user.id;
              const messageUser = isCurrentUser ? user : otherUser;
              const messageUserData = isCurrentUser ? user : message.sender;

              return (
                <tbody key={message.id} className={`message-post ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}>
                  <tr className="post-header-row">
                    <td className="post-user-cell">
                      <div className="post-user-info">
                        <div className="post-avatar">
                          {isCurrentUser ? (
                            user.avatar ? (
                              <img src={user.avatar} alt={user.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )
                          ) : (
                            otherUser?.avatar ? (
                              <img src={otherUser.avatar} alt={otherUser.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                {otherUser?.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                              </div>
                            )
                          )}
                        </div>
                        <div className="post-username">
                          {isCurrentUser ? (
                            <Link href={`/profile/${user.username}`}>
                              {user.username}
                            </Link>
                          ) : (
                            <Link href={`/profile/${otherUser?.username || 'user'}`}>
                              {otherUser?.username || 'Unknown User'}
                            </Link>
                          )}
                        </div>
                        <div className="post-user-title">
                          {messageUserData?.role === 'ADMIN' ? 'Administrator' :
                           messageUserData?.role === 'MODERATOR' ? 'Moderator' : 'Member'}
                        </div>
                      </div>
                    </td>
                    <td className="post-info-cell">
                      <div className="post-header-info">
                        <div className="post-number">#{index + 1}</div>
                        <div className="post-date">{formatDate(message.createdAt)}</div>
                      </div>
                      {message.subject && (
                        <div className="post-subject">Re: {message.subject}</div>
                      )}
                    </td>
                  </tr>
                  <tr className="post-content-row">
                    <td className="post-user-stats">
                      <div className="user-stats">
                        <div className="stat-item">
                          Posts: {messageUserData?.postCount || messageUserData?._count?.posts || 0}
                        </div>
                        <div className="stat-item">
                          Joined: {messageUserData?.createdAt ?
                            new Date(messageUserData.createdAt).toLocaleDateString([], {
                              month: 'short',
                              year: 'numeric'
                            }) : 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="post-content-cell">
                      <div className="post-content">
                        {message.content.split('\n').map((line, lineIndex) => (
                          <div key={lineIndex}>
                            {line || '\u00A0'}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
        </div>

        <div className="category-block">
          <div className="category-header">
            Reply to {otherUser?.username || 'Unknown User'}
          </div>

          <div className="reply-form">
            <form onSubmit={handleSendReply}>
              <div className="form-group">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  className="reply-textarea"
                  rows="6"
                  required
                  disabled={sending}
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="reply-btn"
                  disabled={sending || !replyContent.trim()}
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .conversation-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          min-height: 400px;
          opacity: 1;
          transition: opacity 0.2s ease-in-out;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 15px;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .breadcrumbs {
          background-color: #F5F5F5;
          padding: 8px 15px;
          border-bottom: 1px solid var(--border-color);
          font-size: 11px;
          margin-bottom: 20px;
        }

        .breadcrumbs a {
          color: var(--link-color);
        }

        .category-block {
          background: white;
          border: 1px solid var(--border-color);
          margin-bottom: 20px;
        }

        .category-header {
          background: var(--category-header-bg);
          color: var(--category-header-color);
          padding: 12px 15px;
          font-weight: bold;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }

        .category-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-icon {
          font-size: 14px;
        }

        .back-btn {
          background: var(--primary-color);
          color: white;
          text-decoration: none;
          padding: 6px 12px;
          font-size: 11px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }

        .back-btn:hover {
          background: var(--secondary-color);
        }

        .conversation-info {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
        }

        .other-user-avatar img,
        .other-user-avatar .avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }

        .avatar-placeholder {
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .user-name {
          font-weight: 600;
          font-size: 14px;
        }

        .user-name a {
          color: var(--link-color);
          text-decoration: none;
        }

        .user-name a:hover {
          text-decoration: underline;
        }

        .message-count {
          color: #666;
          font-size: 12px;
        }

        .messages-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 1px;
          background-color: var(--border-color);
        }

        .message-post.row-even .post-header-row td,
        .message-post.row-even .post-content-row td {
          background-color: #FAFBFC;
        }

        .message-post.row-odd .post-header-row td,
        .message-post.row-odd .post-content-row td {
          background-color: #F1F3F4;
        }

        .post-header-row td {
          padding: 8px 10px;
          vertical-align: top;
          border-bottom: 1px solid var(--border-color);
        }

        .post-content-row td {
          padding: 10px;
          vertical-align: top;
        }

        .post-user-cell {
          width: 150px;
          background: var(--post-header-bg);
          text-align: center;
        }

        .post-info-cell {
          background: var(--post-header-bg);
        }

        .post-user-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .post-avatar img,
        .post-avatar .avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
        }

        .post-username {
          font-weight: 600;
          font-size: 11px;
        }

        .post-username a {
          color: var(--link-color);
          text-decoration: none;
        }

        .post-username a:hover {
          text-decoration: underline;
        }

        .post-user-title {
          font-size: 10px;
          color: #666;
          font-style: italic;
        }

        .post-header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .post-number {
          font-size: 10px;
          color: #666;
        }

        .post-date {
          font-size: 10px;
          color: #666;
        }

        .post-subject {
          font-size: 11px;
          color: #666;
          font-style: italic;
          margin-top: 5px;
        }

        .post-user-stats {
          width: 150px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }

        .user-stats {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .post-content-cell {
          padding: 15px !important;
        }

        .post-content {
          line-height: 1.5;
          color: #333;
          font-size: 11px;
        }

        .reply-form {
          padding: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .reply-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border-color);
          font-family: inherit;
          font-size: 12px;
          resize: vertical;
          min-height: 120px;
          box-sizing: border-box;
        }

        .reply-textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 1px var(--primary-color);
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .reply-btn {
          background: var(--primary-color);
          color: white;
          border: 1px solid var(--primary-color);
          padding: 8px 16px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reply-btn:hover {
          background: var(--secondary-color);
        }

        .reply-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading,
        .error-message,
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner,
        .error-icon,
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          display: block;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .conversation-page {
            padding: 15px;
          }

          .conversation-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .message-item {
            padding: 15px;
          }

          .message-avatar img,
          .message-avatar .avatar-placeholder {
            width: 40px;
            height: 40px;
          }

          .other-user-avatar img,
          .other-user-avatar .avatar-placeholder {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </Layout>
  );
}
