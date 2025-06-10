import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/messages/conversations', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversations data:', data); // Debug log
        setConversations(data.conversations || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
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
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const getOtherUser = (conversation) => {
    if (!user || !conversation) return null;

    // Check if current user is the sender
    if (conversation.senderId === user.id.toString() || conversation.senderId === user.id) {
      return {
        id: conversation.recipientId,
        username: conversation.recipient_username,
        avatar: conversation.recipient_avatar
      };
    } else {
      return {
        id: conversation.senderId,
        username: conversation.sender_username,
        avatar: conversation.sender_avatar
      };
    }
  };

  return (
    <Layout>
      <div className="messages-page">
        <div className="page-header">
          <h1>✉️ Messages</h1>
          <button 
            onClick={() => setShowCompose(true)}
            className="button primary"
          >
            ✏️ New Message
          </button>
        </div>

        <div className="messages-container">
          <div className="conversations-list">
            {loading ? (
              <div className="loading">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="no-conversations">
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <h3>No conversations yet</h3>
                  <p>Start a conversation by sending a message to another user.</p>
                  <button 
                    onClick={() => setShowCompose(true)}
                    className="button primary"
                  >
                    Send Your First Message
                  </button>
                </div>
              </div>
            ) : (
              conversations.map(conversation => {
                const otherUser = getOtherUser(conversation, conversation.current_user_id);
                return (
                  <Link 
                    key={conversation.conversation_id}
                    href={`/messages/${conversation.conversation_id}`}
                    className="conversation-item"
                  >
                    <div className="conversation-avatar">
                      {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt={otherUser.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {otherUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <span className="conversation-user">{otherUser.username}</span>
                        <span className="conversation-time">{formatDate(conversation.created_at)}</span>
                      </div>
                      
                      <div className="conversation-preview">
                        {conversation.subject && (
                          <span className="message-subject">{conversation.subject}</span>
                        )}
                        <span className="message-content">
                          {conversation.content.length > 100 
                            ? conversation.content.substring(0, 100) + '...'
                            : conversation.content
                          }
                        </span>
                      </div>
                      
                      {conversation.unread_count > 0 && (
                        <div className="unread-badge">{conversation.unread_count}</div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {showCompose && (
          <ComposeModal 
            onClose={() => setShowCompose(false)}
            onSent={() => {
              setShowCompose(false);
              fetchConversations();
            }}
          />
        )}
      </div>

      <style jsx>{`
        .messages-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border-color);
        }

        .page-header h1 {
          margin: 0;
          color: var(--text-color);
        }

        .messages-container {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .loading {
          padding: 40px;
          text-align: center;
          color: #666;
        }

        .no-conversations {
          padding: 60px 20px;
        }

        .empty-state {
          text-align: center;
          color: #666;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .empty-state p {
          margin-bottom: 20px;
        }

        .conversations-list {
          display: flex;
          flex-direction: column;
        }

        .conversation-item {
          display: flex;
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
          text-decoration: none;
          color: inherit;
          transition: background-color 0.2s;
          position: relative;
        }

        .conversation-item:hover {
          background-color: #f8f9fa;
        }

        .conversation-item:last-child {
          border-bottom: none;
        }

        .conversation-avatar {
          margin-right: 15px;
          flex-shrink: 0;
        }

        .conversation-avatar img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1.2rem;
        }

        .conversation-content {
          flex: 1;
          min-width: 0;
        }

        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .conversation-user {
          font-weight: 600;
          color: #333;
        }

        .conversation-time {
          font-size: 0.85rem;
          color: #999;
        }

        .conversation-preview {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .message-subject {
          font-weight: 500;
          color: #555;
          font-size: 0.9rem;
        }

        .message-content {
          color: #666;
          font-size: 0.9rem;
          line-height: 1.3;
        }

        .unread-badge {
          position: absolute;
          top: 15px;
          right: 20px;
          background: var(--primary-color);
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }

        .button {
          padding: 10px 20px;
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-color);
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .button:hover {
          background: #f5f5f5;
        }

        .button.primary {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .button.primary:hover {
          background: var(--primary-color-dark);
        }

        @media (max-width: 768px) {
          .messages-page {
            padding: 15px;
          }

          .page-header {
            flex-direction: column;
            gap: 15px;
            align-items: flex-start;
          }

          .conversation-item {
            padding: 12px 15px;
          }

          .conversation-avatar img,
          .avatar-placeholder {
            width: 40px;
            height: 40px;
          }

          .avatar-placeholder {
            font-size: 1rem;
          }
        }
      `}</style>
    </Layout>
  );
}

// Simple compose modal component
function ComposeModal({ onClose, onSent }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipient || !content) {
      setError('Recipient and message content are required');
      return;
    }

    try {
      setSending(true);
      setError('');

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientUsername: recipient,
          subject,
          content
        }),
      });

      if (response.ok) {
        onSent();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ New Message</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="compose-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>To:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div className="form-group">
            <label>Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject (optional)"
            />
          </div>

          <div className="form-group">
            <label>Message:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="button">
              Cancel
            </button>
            <button type="submit" disabled={sending} className="button primary">
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          padding: 20px;
          overflow-y: auto;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          margin: auto;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 0 20px;
          border-bottom: 1px solid #eee;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #333;
        }

        .compose-form {
          padding: 0 20px 20px 20px;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          border: 1px solid #f5c6cb;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 120px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
