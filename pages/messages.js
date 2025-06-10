import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingConversation, setDeletingConversation] = useState(null);
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

  const handleDeleteConversation = async (conversationId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    setDeletingConversation(conversationId);

    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove the conversation from the list
        setConversations(prev => prev.filter(conv => {
          const convId = conv.conversationId || conv.id;
          return convId !== conversationId;
        }));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    } finally {
      setDeletingConversation(null);
    }
  };

  return (
    <Layout>
      <div className="messages-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo; <span>Private Messages</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            <div className="category-title">
              <span className="category-icon">✉️</span>
              Private Messages
            </div>
            <button
              onClick={() => setShowCompose(true)}
              className="new-message-btn"
            >
              ✏️ New Message
            </button>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <div className="error-text">{error}</div>
              <button onClick={fetchConversations} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          <table className="forum-table" cellSpacing="1" cellPadding="0">
            <thead>
              <tr className="table-header">
                <td className="col-icon">&nbsp;</td>
                <td className="col-subject">Subject / Conversation</td>
                <td className="col-user">Started By</td>
                <td className="col-date">Last Message</td>
                <td className="col-actions">Actions</td>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="table-row loading-row">
                  <td colSpan="5" className="loading-cell">
                    <div className="loading-content">
                      <div className="loading-spinner">💬</div>
                      <div>Loading conversations...</div>
                    </div>
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr className="table-row empty-row">
                  <td colSpan="5" className="empty-cell">
                    <div className="empty-content">
                      <div className="empty-icon">💬</div>
                      <h3>No conversations yet</h3>
                      <p>Start a conversation by sending a message to another user.</p>
                      <button
                        onClick={() => setShowCompose(true)}
                        className="new-message-btn"
                      >
                        Send Your First Message
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                conversations.map((conversation, index) => {
                  const otherUser = getOtherUser(conversation);

                  if (!otherUser) {
                    console.warn('Could not determine other user for conversation:', conversation);
                    return null;
                  }

                  // Ensure we have a valid conversation ID
                  const conversationId = conversation.conversationId || conversation.id;
                  if (!conversationId) {
                    console.warn('No valid conversation ID found:', conversation);
                    return null;
                  }

                  return (
                    <tr
                      key={conversationId}
                      className={`table-row conversation-row ${index % 2 === 0 ? 'row-even' : 'row-odd'} ${conversation.unread_count > 0 ? 'unread' : ''}`}
                      onClick={() => window.location.href = `/messages/conversation/${conversationId}`}
                    >
                      <td className="col-icon">
                        <div className="message-icon">
                          {conversation.unread_count > 0 ? '📩' : '📧'}
                        </div>
                      </td>

                      <td className="col-subject">
                        <div className="subject-line">
                          <Link href={`/messages/conversation/${conversationId}`}>
                            {conversation.subject || 'Private Message'}
                          </Link>
                          {conversation.unread_count > 0 && (
                            <span className="unread-badge">{conversation.unread_count}</span>
                          )}
                        </div>
                        <div className="message-preview">
                          {conversation.content && conversation.content.length > 60
                            ? conversation.content.substring(0, 60) + '...'
                            : conversation.content || 'No content'
                          }
                        </div>
                      </td>

                      <td className="col-user">
                        <div className="user-info">
                          <div className="user-avatar">
                            {otherUser.avatar ? (
                              <img src={otherUser.avatar} alt={otherUser.username} />
                            ) : (
                              <div className="avatar-placeholder">
                                {otherUser.username ? otherUser.username.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                          </div>
                          <div className="username">
                            <Link href={`/profile/${otherUser.username}`}>
                              {otherUser.username || 'Unknown User'}
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td className="col-date">
                        <div className="date-info">
                          {formatDate(conversation.createdAt)}
                        </div>
                      </td>

                      <td className="col-actions">
                        <button
                          onClick={(e) => handleDeleteConversation(conversationId, e)}
                          className="delete-btn"
                          disabled={deletingConversation === conversationId}
                          title="Delete conversation"
                        >
                          {deletingConversation === conversationId ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  );
                }).filter(Boolean)
              )}
            </tbody>
          </table>
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
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
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

        .new-message-btn {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 6px 12px;
          font-size: 11px;
          cursor: pointer;
          border-radius: 3px;
          transition: background-color 0.2s;
        }

        .new-message-btn:hover {
          background: var(--secondary-color);
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          padding: 15px;
          margin: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #991b1b;
          font-size: 12px;
        }

        .error-icon {
          font-size: 16px;
        }

        .error-text {
          flex: 1;
        }

        .retry-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          border-radius: 2px;
        }

        .forum-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 1px;
          background-color: var(--border-color);
        }

        .table-header {
          background: var(--table-header-bg);
          color: var(--table-header-color);
          font-size: 11px;
          font-weight: bold;
          text-align: left;
        }

        .table-header td {
          padding: 8px 10px;
          background: var(--table-header-bg);
        }

        .table-row {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .table-row td {
          padding: 10px;
          vertical-align: top;
          font-size: 11px;
        }

        .table-row.row-even td {
          background-color: #FAFBFC;
        }

        .table-row.row-odd td {
          background-color: #F1F3F4;
        }

        .table-row:hover td {
          background-color: #E8F4FD !important;
        }

        .table-row.unread td {
          background-color: #FFFBEB !important;
          font-weight: 500;
        }

        .table-row.unread:hover td {
          background-color: #FEF3C7 !important;
        }

        .loading-cell,
        .empty-cell {
          text-align: center;
          padding: 40px 20px !important;
          background-color: white !important;
        }

        .loading-content,
        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          color: #666;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: pulse 2s infinite;
        }

        .empty-icon {
          font-size: 3rem;
        }

        .empty-content h3 {
          margin: 0;
          color: #333;
        }

        .empty-content p {
          margin: 0 0 15px 0;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .col-icon {
          width: 30px;
          text-align: center;
        }

        .message-icon {
          font-size: 14px;
        }

        .col-subject {
          width: auto;
          min-width: 300px;
        }

        .col-user {
          width: 150px;
        }

        .col-date {
          width: 120px;
          text-align: center;
        }

        .col-actions {
          width: 60px;
          text-align: center;
        }

        .subject-line {
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .subject-line a {
          color: var(--link-color);
          text-decoration: none;
          font-weight: 500;
        }

        .subject-line a:hover {
          text-decoration: underline;
        }

        .message-preview {
          color: #666;
          line-height: 1.3;
          font-size: 10px;
        }

        .unread-badge {
          background: var(--primary-color);
          color: white;
          border-radius: 8px;
          padding: 1px 5px;
          font-size: 9px;
          font-weight: 600;
          min-width: 14px;
          text-align: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-avatar {
          flex-shrink: 0;
        }

        .user-avatar img,
        .avatar-placeholder {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .avatar-placeholder {
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 9px;
        }

        .username a {
          color: var(--link-color);
          text-decoration: none;
          font-weight: 500;
        }

        .username a:hover {
          text-decoration: underline;
        }

        .date-info {
          color: #666;
          white-space: nowrap;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }

        .delete-btn:hover {
          background-color: #fee2e2;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .messages-page {
            padding: 10px;
          }

          .col-user {
            display: none;
          }

          .col-subject {
            min-width: 200px;
          }

          .col-date {
            width: 100px;
          }

          .col-actions {
            width: 50px;
          }

          .category-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .user-avatar img,
          .avatar-placeholder {
            width: 18px;
            height: 18px;
          }

          .subject-line a {
            font-size: 10px;
          }

          .message-preview {
            font-size: 9px;
          }

          .delete-btn {
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .col-date {
            display: none;
          }

          .col-subject {
            min-width: 150px;
          }

          .col-actions {
            width: 40px;
          }

          .subject-line a {
            font-size: 9px;
          }

          .message-preview {
            font-size: 8px;
          }

          .table-row td {
            padding: 8px 5px;
          }

          .delete-btn {
            font-size: 10px;
            padding: 2px;
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
          <div className="modal-title">✏️ New Private Message</div>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="compose-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <label className="form-label">To:</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter username"
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Message subject (optional)"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <label className="form-label">Message:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              className="form-textarea"
              rows={8}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={sending} className="btn-send">
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
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          padding: 20px;
          overflow-y: auto;
        }

        .modal-content {
          background: white;
          border: 2px solid var(--border-color);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          margin: auto;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
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

        .modal-title {
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
          padding: 15px;
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

        .form-row {
          margin-bottom: 15px;
        }

        .form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
          font-size: 12px;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border-color);
          font-size: 12px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 1px var(--primary-color);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.4;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .btn-cancel,
        .btn-send {
          padding: 8px 16px;
          font-size: 11px;
          cursor: pointer;
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }

        .btn-cancel {
          background: white;
          color: #666;
        }

        .btn-cancel:hover {
          background: #f5f5f5;
        }

        .btn-send {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .btn-send:hover {
          background: var(--secondary-color);
        }

        .btn-send:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 10px;
          margin-bottom: 15px;
          font-size: 11px;
          border: 1px solid #fecaca;
        }
      `}</style>
    </div>
  );
}
