import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../../../styles/AdminUserEdit.module.css';

const AdminUserEdit = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'USER',
    isActive: true,
    bio: '',
    location: '',
    signature: '',
    displayName: ''
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser || currentUser.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (id) {
      fetchUser();
    }
  }, [currentUser, authLoading, router, id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users/${id}`, {
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      setUser(data.data);
      setFormData({
        username: data.data.username || '',
        email: data.data.email || '',
        role: data.data.role || 'USER',
        isActive: data.data.isActive !== false,
        bio: data.data.bio || '',
        location: data.data.location || '',
        signature: data.data.signature || '',
        displayName: data.data.displayName || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load user');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      setUser(data.data);
      
      // Redirect back to users list after 2 seconds
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update user');
      console.error('Error updating user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      
      // Redirect back to users list
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading user...</div>
      </AdminLayout>
    );
  }

  if (error && !user) {
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
          <h1>Edit User</h1>
          <button
            onClick={() => router.push('/admin/users')}
            className={styles.backButton}
          >
            ← Back to Users
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={styles.select}
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
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              Active Account
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows="4"
              className={styles.textarea}
              maxLength="500"
            />
            <small>{formData.bio.length}/500 characters</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={styles.input}
              maxLength="100"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="signature">Signature</label>
            <textarea
              id="signature"
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              rows="3"
              className={styles.textarea}
              maxLength="200"
            />
            <small>{formData.signature.length}/200 characters</small>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || user?.id === currentUser?.id}
              className={styles.deleteButton}
              title={user?.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete user'}
            >
              Delete User
            </button>
          </div>
        </form>

        {user && (
          <div className={styles.userInfo}>
            <h2>User Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <strong>User ID:</strong> {user.id}
              </div>
              <div className={styles.infoItem}>
                <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
              </div>
              <div className={styles.infoItem}>
                <strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </div>
              <div className={styles.infoItem}>
                <strong>Post Count:</strong> {user.postCount || 0}
              </div>
              <div className={styles.infoItem}>
                <strong>Thread Count:</strong> {user.threadCount || 0}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserEdit;

