import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminTable,
  AdminPagination,
  AdminLoading,
  AdminFormGroup,
  AdminEmptyState,
  AdminAlert
} from '../../components/admin/AdminComponents';

export default function ModerationLogs() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchLogs();
    }
  }, [isAuthenticated, user, loading, router, filter, pagination.page]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        action: filter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      const res = await fetch(`/api/admin/moderation/logs?${params}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.pagination) {
          setPagination(prev => ({ ...prev, ...data.pagination }));
        }
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

  if (loading || isLoading) {
    return (
      <ModerationLayout>
        <AdminLoading size="large" text="Loading moderation logs..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (action) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: getActionColor(action).bg,
          color: getActionColor(action).text
        }}>
          {getActionIcon(action)} {action}
        </span>
      )
    },
    {
      key: 'targetType',
      label: 'Target',
      render: (targetType, log) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            {targetType === 'thread' ? '📝' : targetType === 'post' ? '💬' : '👤'} {targetType}
          </div>
          {log.targetId && (
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              ID: {log.targetId}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'moderator',
      label: 'Moderator',
      render: (moderator) => (
        <div>
          <div style={{ fontWeight: '500' }}>{moderator?.username || 'Unknown'}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {moderator?.role || 'MODERATOR'}
          </div>
        </div>
      )
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (reason) => reason || 'No reason provided'
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (createdAt) => (
        <div>
          <div>{new Date(createdAt).toLocaleDateString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {new Date(createdAt).toLocaleTimeString()}
          </div>
        </div>
      )
    }
  ];

  const getActionIcon = (action) => {
    const icons = {
      'delete': '🗑️',
      'restore': '↩️',
      'lock': '🔒',
      'unlock': '🔓',
      'approve': '✅',
      'reject': '❌',
      'ban': '🚫',
      'unban': '✅',
      'warn': '⚠️'
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    const colors = {
      'delete': { bg: '#fee2e2', text: '#991b1b' },
      'restore': { bg: '#d1fae5', text: '#065f46' },
      'lock': { bg: '#fef3c7', text: '#92400e' },
      'unlock': { bg: '#d1fae5', text: '#065f46' },
      'approve': { bg: '#d1fae5', text: '#065f46' },
      'reject': { bg: '#fee2e2', text: '#991b1b' },
      'ban': { bg: '#fee2e2', text: '#991b1b' },
      'unban': { bg: '#d1fae5', text: '#065f46' },
      'warn': { bg: '#fef3c7', text: '#92400e' }
    };
    return colors[action] || { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="Moderation Logs"
        description="View history of all moderation actions"
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'Logs' }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}

      <AdminCard>
        <div style={{ marginBottom: '1.5rem' }}>
          <AdminFormGroup label="Filter by Action">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                background: 'white',
                minWidth: '200px'
              }}
            >
              <option value="all">All Actions</option>
              <option value="delete">Delete Actions</option>
              <option value="restore">Restore Actions</option>
              <option value="lock">Lock Actions</option>
              <option value="unlock">Unlock Actions</option>
              <option value="approve">Approve Actions</option>
              <option value="reject">Reject Actions</option>
              <option value="ban">Ban Actions</option>
              <option value="warn">Warning Actions</option>
            </select>
          </AdminFormGroup>
        </div>

        {logs.length > 0 ? (
          <>
            <AdminTable
              columns={columns}
              data={logs}
              loading={isLoading}
            />
            
            {pagination.totalPages > 1 && (
              <AdminPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            )}
          </>
        ) : (
          <AdminEmptyState
            icon="📋"
            title="No moderation logs found"
            description={filter === 'all' ? 
              "No moderation actions have been recorded yet." :
              `No ${filter} actions found. Try changing the filter.`
            }
          />
        )}
      </AdminCard>
    </ModerationLayout>
  );
}
