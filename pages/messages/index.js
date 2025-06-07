import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function Messages() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    
    fetchMessages();
  }, [user, activeTab]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages?type=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="Private Messages">
      <div className="messages-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;
          <span> Private Messages</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            Private Messages
          </div>
          
          <div style={{ padding: '15px', backgroundColor: 'var(--subject-header-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <button 
                  onClick={() => setActiveTab('inbox')}
                  style={{ 
                    padding: '8px 16px', 
                    border: 'none', 
                    backgroundColor: activeTab === 'inbox' ? 'var(--primary-color)' : 'transparent',
                    color: activeTab === 'inbox' ? 'white' : 'var(--link-color)',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    fontWeight: activeTab === 'inbox' ? 'bold' : 'normal'
                  }}
                >
                  📥 Inbox
                </button>
                <button 
                  onClick={() => setActiveTab('sent')}
                  style={{ 
                    padding: '8px 16px', 
                    border: 'none', 
                    backgroundColor: activeTab === 'sent' ? 'var(--primary-color)' : 'transparent',
                    color: activeTab === 'sent' ? 'white' : 'var(--link-color)',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    fontWeight: activeTab === 'sent' ? 'bold' : 'normal'
                  }}
                >
                  📤 Sent
                </button>
              </div>
              <Link href="/messages/new" className="button">
                ✉️ New Message
              </Link>
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#ffebee', 
              color: '#c62828',
              border: '1px solid #ef5350'
            }}>
              {error}
            </div>
          )}

          <div className="forum-table">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 150px 150px 80px', 
              backgroundColor: 'var(--subject-header-bg)', 
              padding: '10px', 
              fontWeight: 'bold',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div>Message</div>
              <div style={{ textAlign: 'center' }}>
                {activeTab === 'inbox' ? 'From' : 'To'}
              </div>
              <div style={{ textAlign: 'center' }}>Date</div>
              <div style={{ textAlign: 'center' }}>Actions</div>
            </div>
            
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {activeTab === 'inbox' ? 'No messages in your inbox.' : 'No sent messages.'}
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 150px 150px 80px', 
                  padding: '12px 10px',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: 'white',
                  alignItems: 'center'
                }}>
                  <div>
                    <Link href={`/messages/${message.id}`} style={{ fontWeight: 'bold' }}>
                      {message.content.length > 50 
                        ? message.content.substring(0, 50) + '...' 
                        : message.content}
                    </Link>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <Link href={`/profile/${activeTab === 'inbox' ? message.sender?.username : message.recipient?.username}`}>
                      {activeTab === 'inbox' ? message.sender?.username : message.recipient?.username}
                    </Link>
                  </div>
                  
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    {formatDate(message.createdAt)}
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <Link href={`/messages/${message.id}`} style={{ fontSize: '12px' }}>
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/messages/new" className="button">
            ✉️ Compose New Message
          </Link>
        </div>
      </div>
    </Layout>
  );
}
