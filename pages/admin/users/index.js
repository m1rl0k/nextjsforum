import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../../../styles/AdminUsers.module.css';

const AdminUsers = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    sendWelcomeEmail: true
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchUsers();
  }, [user, authLoading, router, pagination.page, searchTerm, sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { page, limit } = pagination;
      const query = new URLSearchParams({
        page,
        limit,
        search: searchTerm,
        sort: sortBy
      }).toString();
      
      const res = await fetch(`/api/admin/users?${query}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }
      
      setUsers(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (err) {
      setError(err.message || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('Username, email, and password are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      alert('✅ User created successfully!');
      setShowAddUserModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'USER',
        sendWelcomeEmail: true
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleUserAction = async (userId, action, role = null) => {
    // Confirm destructive actions
    if (action === 'ban' || action === 'delete') {
      const actionName = action === 'ban' ? 'ban' : 'permanently delete';
      if (!confirm(`Are you sure you want to ${actionName} this user? This action cannot be undone.`)) {
        return;
      }
    }

    try {
      setError(''); // Clear previous errors
      const payload = { action };

      // Include role for promotion actions
      if (action === 'promote' && role) {
        payload.role = role;
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to perform action');
      }

      // Show success message
      const actionMessages = {
        'ban': 'User banned successfully',
        'unban': 'User unbanned successfully',
        'promote': `User promoted to ${role} successfully`,
        'delete': 'User deleted successfully'
      };
      alert(actionMessages[action] || 'Action completed successfully');

      // Refresh users after action
      await fetchUsers();
    } catch (err) {
      console.error('Error performing user action:', err);
      setError(err.message || 'Failed to perform action');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading users...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.error}>{error}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <h1>Manage Users</h1>
            <button
              onClick={() => setShowAddUserModal(true)}
              className={styles.addButton}
            >
              ➕ Add User
            </button>
          </div>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>
        </div>

        <div className={styles.usersTableContainer}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.username}>{user.username}</div>
                          <div className={styles.postsCount}>
                            {user.threadCount || 0} threads • {user.postCount || 0} posts
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.role} ${user.role === 'ADMIN' ? styles.admin : ''}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={user.isActive ? styles.active : styles.banned}>
                        {user.isActive ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className={styles.actionButton}
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, user.isActive ? 'ban' : 'unban')}
                          className={`${styles.actionButton} ${user.isActive ? styles.banButton : styles.unbanButton}`}
                          title={user.isActive ? 'Ban User' : 'Unban User'}
                        >
                          {user.isActive ? '🚫' : '✅'}
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleUserAction(user.id, 'promote', 'ADMIN')}
                            className={`${styles.actionButton} ${styles.promoteButton}`}
                            title="Promote to Admin"
                          >
                            ⬆️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noResults}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={styles.pageButton}
            >
              Previous
            </button>
            <div className={styles.pageInfo}>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className={styles.modal} onClick={() => setShowAddUserModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Add New User</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowAddUserModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddUser} className={styles.addUserForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="username">Username *</label>
                  <input
                    type="text"
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Enter username"
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <small>Minimum 6 characters</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="USER">User</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newUser.sendWelcomeEmail}
                      onChange={(e) => setNewUser({ ...newUser, sendWelcomeEmail: e.target.checked })}
                    />
                    <span>Send welcome email</span>
                  </label>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(false)}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
