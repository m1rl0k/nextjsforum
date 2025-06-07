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
    return <Layout><div>Loading...</div></Layout>;
  }

  if (error) {
    return <Layout><div>Error: {error}</div></Layout>;
  }

  if (!message) {
    return <Layout><div>Message not found</div></Layout>;
  }

  const isRecipient = message.recipientId === user.id;
  const otherUser = isRecipient ? message.sender : message.recipient;

  return (
    <Layout title="View Message">
      <div className="view-message-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <Link href="/messages">Private Messages</Link> &raquo;
          <span> View Message</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Private Message
          </div>
          
          <div style={{ padding: '20px', backgroundColor: 'white' }}>
            {/* Message Header */}
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'var(--post-header-bg)', 
              borderRadius: '3px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  {isRecipient ? 'From' : 'To'}: <Link href={`/profile/${otherUser.username}`}>{otherUser.username}</Link>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatDate(message.createdAt)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {isRecipient && (
                  <button 
                    onClick={() => setShowReply(!showReply)}
                    className="button"
                    style={{ fontSize: '12px' }}
                  >
                    {showReply ? 'Cancel Reply' : 'Reply'}
                  </button>
                )}
                <Link href="/messages" className="button" style={{ fontSize: '12px', backgroundColor: '#666' }}>
                  Back to Messages
                </Link>
              </div>
            </div>

            {/* Message Content */}
            <div style={{ 
              padding: '20px', 
              backgroundColor: 'var(--thread-alt-bg)', 
              borderRadius: '3px',
              marginBottom: '20px',
              lineHeight: '1.6'
            }}>
              {message.content.split('\n').map((line, index) => (
                <div key={index} style={{ marginBottom: line.trim() === '' ? '10px' : '0' }}>
                  {line || '\u00A0'}
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {showReply && isRecipient && (
              <div style={{ 
                padding: '20px', 
                backgroundColor: 'var(--sidebar-bg)', 
                borderRadius: '3px',
                marginBottom: '20px'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Reply to {otherUser.username}</h4>
                <form onSubmit={handleReply}>
                  <div className="form-group">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="form-textarea"
                      placeholder="Enter your reply..."
                      rows="8"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <button 
                      type="submit" 
                      className="button"
                      disabled={replyLoading}
                      style={{ marginRight: '10px' }}
                    >
                      {replyLoading ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowReply(false)}
                      className="button"
                      style={{ backgroundColor: '#666' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Actions */}
            <div style={{ textAlign: 'center' }}>
              <Link href="/messages" className="button" style={{ marginRight: '10px' }}>
                📥 Back to Messages
              </Link>
              <Link href={`/messages/new?to=${otherUser.username}`} className="button">
                ✉️ New Message to {otherUser.username}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
