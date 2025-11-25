import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/AdminUsers.module.css';

export default function AdminPermissions() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007bff',
    priority: 0,
    canPost: true,
    canReply: true,
    canEdit: false,
    canDelete: false,
    canModerate: false,
    canAdmin: false
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') {
      return;
    }
    fetchGroups();
  }, [user, authLoading]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/forum-management?action=groups', {
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load groups');
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/forum-management?action=groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          priority: Number.parseInt(formData.priority, 10) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create group');
      await fetchGroups();
      setFormData({
        name: '',
        description: '',
        color: '#007bff',
        priority: 0,
        canPost: true,
        canReply: true,
        canEdit: false,
        canDelete: false,
        canModerate: false,
        canAdmin: false
      });
      alert('Group created successfully');
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading permissions...</div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <AdminLayout>
        <div className={styles.error}>Admin access required.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Permissions & Groups</h1>
          <p>Manage user groups and capabilities used for per-forum ACLs.</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.card} style={{ marginBottom: '20px' }}>
          <h2>Create Group</h2>
          <form onSubmit={handleSubmit} className={styles.addUserForm}>
            <div className={styles.formGroup}>
              <label>Name *</label>
              <input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <input name="description" value={formData.description} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Color</label>
              <input type="color" name="color" value={formData.color} onChange={handleChange} />
            </div>
            <div className={styles.formGroup}>
              <label>Priority</label>
              <input type="number" name="priority" value={formData.priority} onChange={handleChange} />
              <small>Higher priority groups can override lower ones.</small>
            </div>
            <div className={styles.formGroup}>
              <label>Capabilities</label>
              <div className={styles.checkboxRow}>
                {['canPost','canReply','canEdit','canDelete','canModerate','canAdmin'].map(key => (
                  <label key={key} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name={key}
                      checked={formData[key]}
                      onChange={handleChange}
                    />
                    {key.replace('can','Can ')}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="submit" className={styles.submitButton}>Create Group</button>
            </div>
          </form>
        </div>

        <div className={styles.card}>
          <h2>Existing Groups</h2>
          {groups.length === 0 ? (
            <div className={styles.error}>No groups found.</div>
          ) : (
            <div className={styles.usersTableContainer}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Priority</th>
                    <th>Capabilities</th>
                    <th>Members</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map(group => (
                    <tr key={group.id}>
                      <td>
                        <span style={{ color: group.color || '#000' }}>{group.name}</span>
                        <div className={styles.postsCount}>{group.description}</div>
                      </td>
                      <td>{group.priority}</td>
                      <td>
                        {['canPost','canReply','canEdit','canDelete','canModerate','canAdmin']
                          .filter(k => group[k])
                          .join(', ') || 'None'}
                      </td>
                      <td>{group.members?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
