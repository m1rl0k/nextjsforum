import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ModerationLayout from '../../components/moderation/ModerationLayout';
import { useAuth } from '../../context/AuthContext';
import { 
  AdminPageHeader, 
  AdminCard, 
  AdminTabs,
  AdminTable,
  AdminPagination,
  AdminLoading,
  AdminButton,
  AdminFormGroup,
  AdminEmptyState,
  AdminAlert
} from '../../components/admin/AdminComponents';

export default function UserManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!loading && (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR'))) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR')) {
      fetchUsers();
    }
  }, [isAuthenticated, user, loading, router, filter, pagination.page]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        filter,
        search: searchTerm
      });
      
      const res = await fetch(`/api/admin/moderation/users?${params}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          totalPages: data.totalPages || 1
        }));
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    const actionKey = `${action}-${userId}`;
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    
    try {
      const res = await fetch(`/api/admin/moderation/user-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          action,
          reason: `${action} by moderator`
        })
      });

      if (res.ok) {
        await fetchUsers();
        setError('');
      } else {
        const data = await res.json();
        setError(data.message || `Failed to ${action} user`);
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      setError(`Failed to ${action} user`);
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  if (loading || isLoading) {
    return (
      <ModerationLayout>
        <AdminLoading size="large" text="Loading users..." />
      </ModerationLayout>
    );
  }

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR')) {
    return null;
  }

  const tabs = [
    { id: 'all', label: 'All Users', icon: '👥' },
    { id: 'active', label: 'Active', icon: '✅' },
    { id: 'banned', label: 'Banned', icon: '🚫' },
    { id: 'moderators', label: 'Moderators', icon: '🛡️' },
    { id: 'recent', label: 'Recent', icon: '🆕' }
  ];

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_, user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 'bold' }}>
              <Link href={`/profile/${user.username}`} style={{ color: '#3b82f6' }}>
                {user.username}
              </Link>
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {user.postCount || 0} posts • {user.threadCount || 0} threads
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (role) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: role === 'ADMIN' ? '#dc2626' : role === 'MODERATOR' ? '#2563eb' : '#6b7280',
          color: 'white'
        }}>
          {role === 'ADMIN' ? '👑 Admin' : role === 'MODERATOR' ? '🛡️ Moderator' : '👤 User'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (createdAt) => new Date(createdAt).toLocaleDateString()
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (isActive) => (
        <span style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          fontWeight: '500',
          backgroundColor: isActive ? '#16a34a' : '#dc2626',
          color: 'white'
        }}>
          {isActive ? '✅ Active' : '🚫 Banned'}
        </span>
      )
    }
  ];

  return (
    <ModerationLayout>
      <AdminPageHeader 
        title="User Management"
        description="Manage forum users and their permissions"
        breadcrumbs={[
          { label: 'Moderation', href: '/moderation' },
          { label: 'User Management' }
        ]}
      />

      {error && <AdminAlert type="error">{error}</AdminAlert>}

      <AdminCard>
        <div style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleSearch}>
            <AdminFormGroup label="Search Users">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.375rem'
                  }}
                />
                <AdminButton type="submit">Search</AdminButton>
              </div>
            </AdminFormGroup>
          </form>
        </div>

        <AdminTabs
          tabs={tabs}
          activeTab={filter}
          onTabChange={setFilter}
        />

        {users.length > 0 ? (
          <>
            <AdminTable
              columns={columns}
              data={users}
              loading={isLoading}
              actions={(targetUser) => (
                <>
                  <AdminButton
                    size="small"
                    variant="outline"
                    onClick={() => window.open(`/profile/${targetUser.username}`, '_blank')}
                    icon="👤"
                  >
                    Profile
                  </AdminButton>
                  {targetUser.isActive ? (
                    <AdminButton
                      size="small"
                      variant="danger"
                      onClick={() => handleUserAction(targetUser.id, 'ban')}
                      disabled={actionLoading[`ban-${targetUser.id}`]}
                      loading={actionLoading[`ban-${targetUser.id}`]}
                      icon="🚫"
                    >
                      Ban
                    </AdminButton>
                  ) : (
                    <AdminButton
                      size="small"
                      variant="success"
                      onClick={() => handleUserAction(targetUser.id, 'unban')}
                      disabled={actionLoading[`unban-${targetUser.id}`]}
                      loading={actionLoading[`unban-${targetUser.id}`]}
                      icon="✅"
                    >
                      Unban
                    </AdminButton>
                  )}
                  {user?.role === 'ADMIN' && targetUser.role !== 'ADMIN' && targetUser.role !== 'MODERATOR' && (
                    <AdminButton
                      size="small"
                      variant="secondary"
                      onClick={() => handleUserAction(targetUser.id, 'promote')}
                      disabled={actionLoading[`promote-${targetUser.id}`]}
                      loading={actionLoading[`promote-${targetUser.id}`]}
                      icon="⬆️"
                    >
                      Promote
                    </AdminButton>
                  )}
                  {user?.role === 'ADMIN' && targetUser.role === 'MODERATOR' && (
                    <AdminButton
                      size="small"
                      variant="warning"
                      onClick={() => handleUserAction(targetUser.id, 'demote')}
                      disabled={actionLoading[`demote-${targetUser.id}`]}
                      loading={actionLoading[`demote-${targetUser.id}`]}
                      icon="⬇️"
                    >
                      Demote
                    </AdminButton>
                  )}
                </>
              )}
            />
            
            <AdminPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </>
        ) : (
          <AdminEmptyState
            icon="👥"
            title="No users found"
            description="Try adjusting your filters or search terms."
          />
        )}
      </AdminCard>
    </ModerationLayout>
  );
}
