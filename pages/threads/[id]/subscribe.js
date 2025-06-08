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
          padding: 20px;
        }

        .breadcrumb {
          margin-bottom: 20px;
          color: #666;
        }

        .breadcrumb a {
          color: #007bff;
          text-decoration: none;
        }

        .thread-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .thread-info h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .subscription-card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          margin-bottom: 20px;
        }

        .status-icon {
          font-size: 3rem;
          margin-bottom: 15px;
        }

        .subscription-card h3 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .subscription-details,
        .subscription-benefits {
          text-align: left;
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 5px;
        }

        .subscription-details h4,
        .subscription-benefits h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .subscription-details ul,
        .subscription-benefits ul {
          margin: 0;
          padding-left: 20px;
        }

        .subscription-details li,
        .subscription-benefits li {
          margin-bottom: 5px;
        }

        .actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }

        .button {
          padding: 12px 24px;
          border: 1px solid #ddd;
          background: white;
          color: #333;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-size: 14px;
        }

        .button:hover {
          background: #f8f9fa;
        }

        .button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .button.primary:hover {
          background: #0056b3;
        }

        .button.danger {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .button.danger:hover {
          background: #c82333;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .help-text {
          background: #e9ecef;
          padding: 20px;
          border-radius: 5px;
          font-size: 14px;
        }

        .help-text h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .help-text p {
          margin: 10px 0;
          line-height: 1.5;
        }

        .help-text a {
          color: #007bff;
          text-decoration: none;
        }

        .help-text a:hover {
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
