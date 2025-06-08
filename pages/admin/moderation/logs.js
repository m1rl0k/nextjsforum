import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function ModerationLogs() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [moderatorFilter, setModeratorFilter] = useState('all');
  const [moderators, setModerators] = useState([]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchLogs();
      fetchModerators();
    }
  }, [isAuthenticated, user, loading, router, filter, dateRange, moderatorFilter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        action: filter,
        days: dateRange,
        moderator: moderatorFilter,
        limit: '100'
      });
      
      const res = await fetch(`/api/admin/moderation/logs?${params}`);
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        throw new Error('Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load moderation logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModerators = async () => {
    try {
      const res = await fetch('/api/admin/moderation/moderators');
      if (res.ok) {
        const data = await res.json();
        setModerators(data.moderators || []);
      }
    } catch (err) {
      console.error('Error fetching moderators:', err);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      'APPROVE_THREAD': '✅',
      'REJECT_THREAD': '❌',
      'APPROVE_POST': '✅',
      'REJECT_POST': '❌',
      'DELETE_THREAD': '🗑️',
      'DELETE_POST': '🗑️',
      'LOCK_THREAD': '🔒',
      'UNLOCK_THREAD': '🔓',
      'BAN_USER': '🚫',
      'UNBAN_USER': '✅',
      'RESOLVE_REPORT': '✅',
      'DISMISS_REPORT': '❌'
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    if (action.includes('APPROVE') || action.includes('RESOLVE') || action.includes('UNBAN') || action.includes('UNLOCK')) {
      return '#28a745';
    }
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('BAN') || action.includes('DISMISS')) {
      return '#dc3545';
    }
    if (action.includes('LOCK')) {
      return '#ffc107';
    }
    return '#6c757d';
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="loading">Loading moderation logs...</div>
      </Layout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  return (
    <Layout title="Moderation Logs - Admin">
      <div className="moderation-logs">
        <div className="admin-header">
          <h1>📊 Moderation Logs</h1>
          <div className="admin-nav">
            <Link href="/admin/moderation" className="nav-link">← Back to Moderation</Link>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="log-controls">
          <div className="filters">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Actions</option>
              <option value="APPROVE">Approvals</option>
              <option value="REJECT">Rejections</option>
              <option value="DELETE">Deletions</option>
              <option value="BAN">User Bans</option>
              <option value="RESOLVE">Report Resolutions</option>
            </select>

            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            <select 
              value={moderatorFilter} 
              onChange={(e) => setModeratorFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Moderators</option>
              {moderators.map(mod => (
                <option key={mod.id} value={mod.id}>{mod.username}</option>
              ))}
            </select>

            <button onClick={fetchLogs} className="button">Refresh</button>
          </div>
        </div>

        <div className="logs-list">
          {logs.length > 0 ? (
            <div className="logs-table">
              <div className="table-header">
                <div className="col-action">Action</div>
                <div className="col-moderator">Moderator</div>
                <div className="col-target">Target</div>
                <div className="col-reason">Reason</div>
                <div className="col-date">Date</div>
              </div>

              {logs.map((log) => (
                <div key={log.id} className="log-row">
                  <div className="col-action">
                    <span 
                      className="action-badge"
                      style={{ backgroundColor: getActionColor(log.action) }}
                    >
                      {getActionIcon(log.action)} {log.action.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="col-moderator">
                    <Link href={`/profile/${log.moderator?.username}`}>
                      {log.moderator?.username}
                    </Link>
                  </div>

                  <div className="col-target">
                    <div className="target-info">
                      <span className="target-type">{log.targetType}</span>
                      <span className="target-id">#{log.targetId}</span>
                    </div>
                  </div>

                  <div className="col-reason">
                    <div className="reason-text">
                      {log.reason || 'No reason provided'}
                    </div>
                    {log.details && (
                      <details className="log-details">
                        <summary>Details</summary>
                        <pre>{JSON.stringify(JSON.parse(log.details), null, 2)}</pre>
                      </details>
                    )}
                  </div>

                  <div className="col-date">
                    <div className="date-time">
                      <div className="date">{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div className="time">{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>No moderation logs found</h3>
              <p>No moderation actions have been performed in the selected time period.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .moderation-logs {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
          }

          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
          }

          .log-controls {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .filters {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
          }

          .filter-select {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            min-width: 150px;
          }

          .logs-list {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          }

          .logs-table {
            display: flex;
            flex-direction: column;
          }

          .table-header {
            display: grid;
            grid-template-columns: 200px 150px 120px 1fr 150px;
            gap: 20px;
            padding: 20px;
            background: #f8f9fa;
            font-weight: 600;
            color: #333;
            border-bottom: 1px solid #e9ecef;
          }

          .log-row {
            display: grid;
            grid-template-columns: 200px 150px 120px 1fr 150px;
            gap: 20px;
            padding: 20px;
            border-bottom: 1px solid #f1f3f4;
            align-items: start;
          }

          .log-row:hover {
            background: #f8f9fa;
          }

          .action-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
            font-size: 0.85rem;
            font-weight: 500;
            text-transform: capitalize;
          }

          .col-moderator a {
            color: #007bff;
            text-decoration: none;
            font-weight: 500;
          }

          .target-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .target-type {
            font-weight: 500;
            color: #333;
            text-transform: capitalize;
          }

          .target-id {
            font-size: 0.85rem;
            color: #666;
          }

          .reason-text {
            color: #333;
            margin-bottom: 5px;
          }

          .log-details {
            margin-top: 5px;
          }

          .log-details summary {
            cursor: pointer;
            color: #007bff;
            font-size: 0.85rem;
          }

          .log-details pre {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.8rem;
            overflow-x: auto;
            margin-top: 5px;
          }

          .date-time {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .date {
            font-weight: 500;
            color: #333;
          }

          .time {
            font-size: 0.85rem;
            color: #666;
          }

          .button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            background: white;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }

          .button:hover {
            background: #f8f9fa;
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }

          .nav-link {
            color: #007bff;
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid #007bff;
            border-radius: 4px;
          }

          .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }

          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }

          @media (max-width: 1200px) {
            .table-header,
            .log-row {
              grid-template-columns: 1fr;
              gap: 10px;
            }
            
            .table-header {
              display: none;
            }
            
            .log-row {
              display: block;
              padding: 15px;
            }
            
            .log-row > div {
              margin-bottom: 10px;
            }
            
            .log-row > div:before {
              content: attr(class);
              font-weight: 600;
              color: #666;
              text-transform: capitalize;
              display: block;
              margin-bottom: 5px;
            }
          }

          @media (max-width: 768px) {
            .filters {
              flex-direction: column;
              align-items: stretch;
            }
            
            .filter-select {
              min-width: auto;
            }
          }
        `
      }} />
    </Layout>
  );
}
