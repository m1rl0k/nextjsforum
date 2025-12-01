import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

export default function SubscribeThread() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [thread, setThread] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchThreadData();
      checkSubscriptionStatus();
    }
  }, [id, isAuthenticated]);

  const fetchThreadData = async () => {
    try {
      const res = await fetch(`/api/threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      setError('Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const res = await fetch(`/api/threads/${id}/subscription`);
      if (res.ok) {
        const data = await res.json();
        setIsSubscribed(data.isSubscribed);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/threads/${id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok) {
        setIsSubscribed(true);
        setMessage('Successfully subscribed to thread! You will receive notifications for new posts.');
      } else {
        setError(data.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setError('Failed to subscribe to thread');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/threads/${id}/subscription`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (res.ok) {
        setIsSubscribed(false);
        setMessage('Successfully unsubscribed from thread.');
      } else {
        setError(data.message || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setError('Failed to unsubscribe from thread');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="subscribe-thread">
          <h1>Thread Subscription</h1>
          <div className="error">You must be logged in to subscribe to threads.</div>
          <div className="actions">
            <button onClick={() => router.push('/login')} className="button primary">
              Login
            </button>
            <button onClick={() => router.back()} className="button">
              Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading thread...</div>
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

  return (
    <Layout title={`Subscribe: ${thread.title} - NextJS Forum`}>
      <div className="subscribe-thread">
        <div className="breadcrumb">
          <a href="/">Forum</a> › 
          <a href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</a> › 
          <a href={`/threads/${thread.id}`}>{thread.title}</a> › 
          <span>Subscribe</span>
        </div>

        <h1>🔔 Thread Subscription</h1>
        
        <div className="thread-info">
          <h2>{thread.title}</h2>
          <p>Started by <strong>{thread.user?.username}</strong> on {new Date(thread.createdAt).toLocaleDateString()}</p>
          <p>Posts: {thread.postCount || 0} | Views: {thread.viewCount || 0}</p>
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="subscription-card">
          {isSubscribed ? (
            <div className="subscribed-state">
              <div className="status-icon">✅</div>
              <h3>You are subscribed to this thread</h3>
              <p>You will receive notifications when new posts are added to this thread.</p>
              
              <div className="subscription-details">
                <h4>Notification Settings:</h4>
                <ul>
                  <li>✉️ Email notifications (if enabled in your profile)</li>
                  <li>🔔 In-forum notifications</li>
                  <li>📱 Instant notifications for new posts</li>
                </ul>
              </div>

              <div className="actions">
                <button 
                  onClick={handleUnsubscribe}
                  disabled={isProcessing}
                  className="button danger"
                >
                  {isProcessing ? 'Processing...' : '🔕 Unsubscribe'}
                </button>
                
                <button 
                  onClick={() => router.back()}
                  className="button"
                >
                  Back to Thread
                </button>
              </div>
            </div>
          ) : (
            <div className="unsubscribed-state">
              <div className="status-icon">🔔</div>
              <h3>Subscribe to this thread</h3>
              <p>Get notified when new posts are added to this thread.</p>
              
              <div className="subscription-benefits">
                <h4>Benefits of subscribing:</h4>
                <ul>
                  <li>📧 Email notifications for new posts</li>
                  <li>🔔 In-forum notification alerts</li>
                  <li>📱 Stay updated on discussions you care about</li>
                  <li>⚡ Never miss important replies</li>
                </ul>
              </div>

              <div className="actions">
                <button 
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="button primary"
                >
                  {isProcessing ? 'Processing...' : '🔔 Subscribe to Thread'}
                </button>
                
                <button 
                  onClick={() => router.back()}
                  className="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="help-text">
          <h4>💡 Subscription Help</h4>
          <p><strong>How it works:</strong> When you subscribe to a thread, you'll receive notifications whenever someone posts a new reply.</p>
          <p><strong>Managing subscriptions:</strong> You can view and manage all your thread subscriptions in your <a href="/profile">user profile</a>.</p>
          <p><strong>Email settings:</strong> Email notifications can be controlled in your <a href="/profile/settings">notification preferences</a>.</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .subscribe-thread {
          max-width: 600px;
          margin: 0 auto;
          padding: 10px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          font-size: 11px;
        }

        .subscribe-thread h1 {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          padding: 8px 12px;
          margin: 0 0 0 0;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #6B84AA;
          border-bottom: none;
        }

        .breadcrumb {
          margin-bottom: 10px;
          color: #666;
          font-size: 10px;
        }

        .breadcrumb a {
          color: #22497D;
          text-decoration: none;
        }

        .breadcrumb a:hover {
          color: #FF4400;
          text-decoration: underline;
        }

        .thread-info {
          background: #F5F5F5;
          padding: 10px;
          border: 1px solid #6B84AA;
          border-top: none;
        }

        .thread-info h2 {
          margin: 0 0 8px 0;
          color: #22497D;
          font-size: 12px;
        }

        .thread-info p {
          margin: 3px 0;
          color: #333;
        }

        .subscription-card {
          background: white;
          padding: 20px;
          border: 1px solid #6B84AA;
          border-top: none;
          text-align: center;
        }

        .status-icon {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .subscription-card h3 {
          margin: 0 0 10px 0;
          color: #22497D;
          font-size: 12px;
        }

        .subscribed-state,
        .unsubscribed-state {
          padding: 10px;
        }

        .subscription-details,
        .subscription-benefits {
          text-align: left;
          margin: 15px 0;
          padding: 10px;
          background: #F5F5F5;
          border: 1px solid #C0C0C0;
        }

        .subscription-details h4,
        .subscription-benefits h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 11px;
          font-weight: bold;
        }

        .subscription-details ul,
        .subscription-benefits ul {
          margin: 0;
          padding-left: 18px;
        }

        .subscription-details li,
        .subscription-benefits li {
          margin-bottom: 4px;
        }

        .actions {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 15px;
        }

        .button {
          padding: 5px 15px;
          border: 1px solid #808080;
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          color: #333;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }

        .button:hover {
          background: linear-gradient(to bottom, #E0E0E0 0%, #D0D0D0 100%);
        }

        .button.primary {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          border-color: #2B4F81;
        }

        .button.primary:hover {
          background: linear-gradient(to bottom, #3A6090 0%, #1E3A5F 100%);
        }

        .button.danger {
          background: linear-gradient(to bottom, #CC0000 0%, #990000 100%);
          color: white;
          border-color: #990000;
        }

        .button.danger:hover {
          background: linear-gradient(to bottom, #990000 0%, #660000 100%);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          background: #D4EDDA;
          color: #155724;
          padding: 10px;
          border: 1px solid #C3E6CB;
          margin-bottom: 10px;
        }

        .error {
          background: #F8D7DA;
          color: #721C24;
          padding: 10px;
          border: 1px solid #F5C6CB;
          margin-bottom: 10px;
        }

        .help-text {
          background: #F5F5F5;
          padding: 12px;
          border: 1px solid #C0C0C0;
          margin-top: 10px;
        }

        .help-text h4 {
          margin: 0 0 8px 0;
          color: #22497D;
          font-size: 11px;
          font-weight: bold;
        }

        .help-text p {
          margin: 8px 0;
          line-height: 1.5;
        }

        .help-text a {
          color: #22497D;
          text-decoration: none;
        }

        .help-text a:hover {
          color: #FF4400;
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .actions {
            flex-direction: column;
          }
        }
        `
      }} />
    </Layout>
  );
}
