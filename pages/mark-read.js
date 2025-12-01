import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function MarkForumsRead() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadStats();
    }
  }, [isAuthenticated]);

  const fetchUnreadStats = async () => {
    try {
      const res = await fetch('/api/users/unread-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching unread stats:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/users/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('All forums have been marked as read!');
        setStats({ unreadThreads: 0, unreadPosts: 0, totalThreads: stats?.totalThreads || 0 });
        
        // Redirect to home after a delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.message || 'Failed to mark forums as read');
      }
    } catch (error) {
      console.error('Error marking forums as read:', error);
      setError('Failed to mark forums as read');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="mark-read-page">
          <h1>Mark Forums Read</h1>
          <div className="error">You must be logged in to mark forums as read.</div>
          <div className="actions">
            <button onClick={() => router.push('/login')} className="button primary">
              Login
            </button>
            <button onClick={() => router.push('/')} className="button">
              Back to Forum
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Mark Forums Read - NextJS Forum">
      <div className="mark-read-page">
        <div className="breadcrumb">
          <a href="/">Forum</a> › <span>Mark Forums Read</span>
        </div>

        <h1>📖 Mark All Forums as Read</h1>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div className="mark-read-card">
          <div className="icon">📚</div>
          
          <h2>Mark all forums as read?</h2>
          
          <p>This will mark all threads and posts in all forums as read for your account.</p>

          {stats && (
            <div className="stats">
              <h3>Current Status:</h3>
              <div className="stat-grid">
                <div className="stat-item">
                  <div className="stat-number">{stats.unreadThreads || 0}</div>
                  <div className="stat-label">Unread Threads</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{stats.unreadPosts || 0}</div>
                  <div className="stat-label">Unread Posts</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{stats.totalThreads || 0}</div>
                  <div className="stat-label">Total Threads</div>
                </div>
              </div>
            </div>
          )}

          <div className="warning">
            <h4>⚠️ Important Notes:</h4>
            <ul>
              <li>This action cannot be undone</li>
              <li>All unread indicators will be cleared</li>
              <li>You will no longer see "new post" indicators on threads you haven't read</li>
              <li>This only affects your account - other users are not affected</li>
            </ul>
          </div>

          <div className="actions">
            <button 
              onClick={handleMarkAllRead}
              disabled={isLoading}
              className="button primary"
            >
              {isLoading ? 'Marking as Read...' : '✓ Mark All Forums Read'}
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="button"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="help-section">
          <h3>💡 Alternative Options</h3>
          <div className="help-grid">
            <div className="help-item">
              <h4>Mark Individual Forums</h4>
              <p>You can mark individual forums as read by visiting each forum and using the "Mark Read" option.</p>
            </div>
            <div className="help-item">
              <h4>Thread Subscriptions</h4>
              <p>Subscribe to specific threads to get notifications only for content you care about.</p>
            </div>
            <div className="help-item">
              <h4>Notification Settings</h4>
              <p>Customize your notification preferences in your profile settings.</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .mark-read-page {
          max-width: 700px;
          margin: 0 auto;
          padding: 10px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          font-size: 11px;
        }

        .mark-read-page h1 {
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

        .mark-read-card {
          background: #F5F5F5;
          padding: 20px;
          border: 1px solid #6B84AA;
          border-top: none;
          text-align: center;
          margin-bottom: 15px;
        }

        .icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .mark-read-card h2 {
          margin: 0 0 10px 0;
          color: #22497D;
          font-size: 14px;
        }

        .mark-read-card p {
          color: #333;
          margin: 0 0 15px 0;
        }

        .stats {
          margin: 15px 0;
          padding: 15px;
          background: white;
          border: 1px solid #C0C0C0;
          text-align: left;
        }

        .stats h3 {
          margin: 0 0 10px 0;
          color: #22497D;
          text-align: center;
          font-size: 12px;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .stat-item {
          text-align: center;
          padding: 10px;
          background: #F5F5F5;
          border: 1px solid #C0C0C0;
        }

        .stat-number {
          font-size: 18px;
          font-weight: bold;
          color: #22497D;
          margin-bottom: 3px;
        }

        .stat-label {
          font-size: 10px;
          color: #666;
        }

        .warning {
          margin: 15px 0;
          padding: 12px;
          background: #FFFDE7;
          border: 1px solid #FFC107;
          text-align: left;
        }

        .warning h4 {
          margin: 0 0 8px 0;
          color: #856404;
          font-size: 11px;
        }

        .warning ul {
          margin: 0;
          padding-left: 18px;
          color: #856404;
        }

        .warning li {
          margin-bottom: 3px;
        }

        .actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #C0C0C0;
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

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          background: #D4EDDA;
          color: #155724;
          padding: 10px;
          border: 1px solid #C3E6CB;
          margin-bottom: 15px;
        }

        .error {
          background: #F8D7DA;
          color: #721C24;
          padding: 10px;
          border: 1px solid #F5C6CB;
          margin-bottom: 15px;
        }

        .help-section {
          background: white;
          padding: 15px;
          border: 1px solid #6B84AA;
        }

        .help-section h3 {
          background: linear-gradient(to bottom, #8FA3C7 0%, #738FBF 100%);
          color: white;
          margin: -15px -15px 15px -15px;
          padding: 8px 12px;
          font-size: 11px;
          text-align: left;
        }

        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .help-item {
          background: #F5F5F5;
          padding: 12px;
          border: 1px solid #C0C0C0;
        }

        .help-item h4 {
          margin: 0 0 6px 0;
          color: #22497D;
          font-size: 11px;
        }

        .help-item p {
          margin: 0;
          color: #333;
          font-size: 10px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .actions {
            flex-direction: column;
          }

          .stat-grid {
            grid-template-columns: 1fr;
          }

          .help-grid {
            grid-template-columns: 1fr;
          }
        }
        `
      }} />
    </Layout>
  );
}
