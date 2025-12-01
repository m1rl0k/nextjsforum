import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function ViewMessage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    
    if (id) {
      fetchMessage();
    }
  }, [id, user]);

  const fetchMessage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
      } else {
        setError('Message not found or access denied');
      }
    } catch (err) {
      setError('Failed to load message');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      return;
    }
    
    setReplyLoading(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient: message.sender.username,
          content: `Re: ${message.content.substring(0, 50)}...\n\n${replyContent.trim()}`
        }),
      });

      if (res.ok) {
        router.push('/messages?sent=1');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reply');
      }
    } catch (err) {
      setError('An error occurred while sending the reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner">💬</div>
          <div>Loading message...</div>
        </div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            gap: 15px;
            font: 11px Tahoma, Verdana, Arial, sans-serif;
          }
          .loading-spinner {
            font-size: 2rem;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error}</div>
          <Link href="/messages" className="back-btn">Back to Messages</Link>
        </div>
        <style jsx>{`
          .error-container {
            text-align: center;
            padding: 60px 20px;
            font: 11px Tahoma, Verdana, Arial, sans-serif;
          }
          .error-icon { font-size: 3rem; margin-bottom: 15px; }
          .error-text { color: #991b1b; margin-bottom: 20px; }
          .back-btn {
            display: inline-block;
            background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
            border: 1px solid #808080;
            padding: 6px 12px;
            color: #333;
            text-decoration: none;
            font-size: 11px;
          }
        `}</style>
      </Layout>
    );
  }

  if (!message) {
    return (
      <Layout>
        <div className="error-container">
          <div className="error-icon">📭</div>
          <div>Message not found</div>
          <Link href="/messages" className="back-btn">Back to Messages</Link>
        </div>
        <style jsx>{`
          .error-container {
            text-align: center;
            padding: 60px 20px;
            font: 11px Tahoma, Verdana, Arial, sans-serif;
          }
          .error-icon { font-size: 3rem; margin-bottom: 15px; }
          .back-btn {
            display: inline-block;
            background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
            border: 1px solid #808080;
            padding: 6px 12px;
            color: #333;
            text-decoration: none;
            font-size: 11px;
            margin-top: 20px;
          }
        `}</style>
      </Layout>
    );
  }

  const isRecipient = message.recipientId === user.id;
  const otherUser = isRecipient ? message.sender : message.recipient;

  return (
    <Layout title="View Message">
      <div className="view-message-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;{' '}
          <Link href="/messages">Private Messages</Link> &raquo;
          <span> View Message</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            <span className="header-icon">✉️</span>
            Private Message
          </div>

          <div className="message-container">
            {/* Message Header */}
            <div className="message-header">
              <div className="header-left">
                <div className="from-line">
                  {isRecipient ? 'From' : 'To'}: <Link href={`/profile/${otherUser.username}`}>{otherUser.username}</Link>
                </div>
                <div className="date-line">
                  {formatDate(message.createdAt)}
                </div>
              </div>
              <div className="header-actions">
                {isRecipient && (
                  <button
                    onClick={() => setShowReply(!showReply)}
                    className="vb-button"
                  >
                    {showReply ? 'Cancel Reply' : '↩️ Reply'}
                  </button>
                )}
                <Link href="/messages" className="vb-button secondary">
                  ← Back
                </Link>
              </div>
            </div>

            {/* Message Content */}
            <div className="message-content">
              {message.content.split('\n').map((line, index) => (
                <div key={index} className={line.trim() === '' ? 'empty-line' : ''}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {showReply && isRecipient && (
              <div className="reply-section">
                <div className="reply-header">Reply to {otherUser.username}</div>
                <form onSubmit={handleReply}>
                  <div className="form-row">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="reply-textarea"
                      placeholder="Enter your reply..."
                      rows="8"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="vb-button"
                      disabled={replyLoading}
                    >
                      {replyLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReply(false)}
                      className="vb-button secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Actions */}
            <div className="bottom-actions">
              <Link href="/messages" className="vb-button">
                📥 Back to Messages
              </Link>
              <Link href={`/messages/new?to=${otherUser.username}`} className="vb-button">
                ✉️ New Message to {otherUser.username}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .view-message-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
        }

        .breadcrumbs {
          background-color: #F5F5F5;
          padding: 8px 15px;
          border: 1px solid #6B84AA;
          border-bottom: none;
          font-size: 11px;
        }

        .breadcrumbs a {
          color: #22497D;
          text-decoration: none;
        }

        .breadcrumbs a:hover {
          color: #FF4400;
          text-decoration: underline;
        }

        .category-block {
          background: white;
          border: 1px solid #6B84AA;
        }

        .category-header {
          background: linear-gradient(to bottom, #8FA3C7 0%, #738FBF 100%);
          color: white;
          padding: 8px 15px;
          font-weight: bold;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          font-size: 14px;
        }

        .message-container {
          padding: 15px;
          background: #E5E5E5;
        }

        .message-header {
          background: linear-gradient(to bottom, #E8E8E8 0%, #D8D8D8 100%);
          border: 1px solid #808080;
          padding: 10px 15px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .from-line {
          font-weight: bold;
          margin-bottom: 3px;
        }

        .from-line a {
          color: #22497D;
          text-decoration: none;
        }

        .from-line a:hover {
          color: #FF4400;
          text-decoration: underline;
        }

        .date-line {
          font-size: 10px;
          color: #666;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .vb-button {
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          border: 1px solid #808080;
          padding: 5px 12px;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
          color: #333;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .vb-button:hover {
          background: linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%);
        }

        .vb-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vb-button.secondary {
          background: linear-gradient(to bottom, #E0E0E0 0%, #C8C8C8 100%);
        }

        .message-content {
          background: #F5F5F5;
          border: 1px solid #808080;
          padding: 15px;
          line-height: 1.6;
          font-size: 11px;
          margin-bottom: 15px;
        }

        .message-content .empty-line {
          margin-bottom: 10px;
        }

        .reply-section {
          background: #F5F5F5;
          border: 1px solid #808080;
          margin-bottom: 15px;
        }

        .reply-header {
          background: linear-gradient(to bottom, #E8E8E8 0%, #D8D8D8 100%);
          padding: 8px 15px;
          font-weight: bold;
          border-bottom: 1px solid #808080;
        }

        .form-row {
          padding: 15px;
        }

        .reply-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #808080;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
          resize: vertical;
          box-sizing: border-box;
        }

        .reply-textarea:focus {
          outline: none;
          border-color: #4C76B2;
        }

        .form-actions {
          padding: 0 15px 15px;
          display: flex;
          gap: 8px;
        }

        .bottom-actions {
          text-align: center;
          padding-top: 10px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
      `}</style>
    </Layout>
  );
}
