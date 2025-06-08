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

        .mark-read-card {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          margin-bottom: 30px;
        }

        .icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .mark-read-card h2 {
          margin: 0 0 15px 0;
          color: #333;
        }

        .stats {
          margin: 25px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 5px;
          text-align: left;
        }

        .stats h3 {
          margin: 0 0 15px 0;
          color: #333;
          text-align: center;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .stat-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 5px;
          border: 1px solid #e9ecef;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
        }

        .warning {
          margin: 25px 0;
          padding: 20px;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          text-align: left;
        }

        .warning h4 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .warning ul {
          margin: 0;
          padding-left: 20px;
          color: #856404;
        }

        .warning li {
          margin-bottom: 5px;
        }

        .actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
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

        .help-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 8px;
        }

        .help-section h3 {
          margin: 0 0 20px 0;
          color: #333;
          text-align: center;
        }

        .help-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .help-item {
          background: white;
          padding: 20px;
          border-radius: 5px;
          border: 1px solid #e9ecef;
        }

        .help-item h4 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 1rem;
        }

        .help-item p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
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
