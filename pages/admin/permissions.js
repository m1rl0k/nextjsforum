import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/AdminPermissions.module.css';

const PERMISSION_FIELDS = [
  { key: 'canPost', label: 'Post', description: 'Create new posts' },
  { key: 'canReply', label: 'Reply', description: 'Reply to threads' },
  { key: 'canEdit', label: 'Edit', description: 'Edit own content' },
  { key: 'canDelete', label: 'Delete', description: 'Delete own content' },
  { key: 'canModerate', label: 'Moderate', description: 'Moderate content' },
  { key: 'canAdmin', label: 'Admin', description: 'Admin access' },
  { key: 'canViewProfiles', label: 'Profiles', description: 'View profiles' },
  { key: 'canSendMessages', label: 'Messages', description: 'Send PMs' }
];

const defaultFormData = {
  name: '',
  description: '',
  color: '#3B82F6',
  priority: 0,
  isDefault: false,
  canPost: true,
  canReply: true,
  canEdit: true,
  canDelete: false,
  canModerate: false,
  canAdmin: false,
  canViewProfiles: true,
  canSendMessages: true
};

export default function AdminPermissions() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'matrix'

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/groups?includeMembers=false', {
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load groups');
      setGroups(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'ADMIN') return;
    fetchGroups();
  }, [user, authLoading, fetchGroups]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreateModal = () => {
    setSelectedGroup(null);
    setFormData(defaultFormData);
    setShowModal(true);
    setError('');
  };

  const openEditModal = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color || '#3B82F6',
      priority: group.priority || 0,
      isDefault: group.isDefault || false,
      canPost: group.canPost,
      canReply: group.canReply,
      canEdit: group.canEdit,
      canDelete: group.canDelete,
      canModerate: group.canModerate,
      canAdmin: group.canAdmin,
      canViewProfiles: group.canViewProfiles,
      canSendMessages: group.canSendMessages
    });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = selectedGroup
        ? `/api/admin/groups/${selectedGroup.id}`
        : '/api/admin/groups';

      const res = await fetch(url, {
        method: selectedGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          priority: parseInt(formData.priority, 10) || 0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      setSuccess(selectedGroup ? 'Group updated successfully' : 'Group created successfully');
      setShowModal(false);
      await fetchGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group) => {
    if (!confirm(`Delete group "${group.name}"? This will remove all members from this group.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete group');

      setSuccess('Group deleted successfully');
      await fetchGroups();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const openMembersModal = async (group) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
    setUserSearch('');

    try {
      const res = await fetch(`/api/admin/groups/${group.id}?`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.data.members || []);
      }
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const searchUsers = async (search) => {
    if (search.length < 2) {
      setAvailableUsers([]);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=10`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        const memberIds = new Set(members.map(m => m.user.id));
        setAvailableUsers((data.data || []).filter(u => !memberIds.has(u.id)));
      }
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const addMember = async (userId) => {
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds: [userId] })
      });

      if (res.ok) {
        await openMembersModal(selectedGroup);
        setUserSearch('');
        setAvailableUsers([]);
        await fetchGroups();
      }
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  const removeMember = async (userId) => {
    try {
      const res = await fetch(`/api/admin/groups/${selectedGroup.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds: [userId] })
      });

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.user.id !== userId));
        await fetchGroups();
      }
    } catch (err) {
      console.error('Error removing member:', err);
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
        <div className={styles.accessDenied}>Admin access required.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Groups & Permissions</h1>
            <p>Manage user groups and their permissions for role-based access control.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.viewToggle}>
              <button
                className={viewMode === 'cards' ? styles.active : ''}
                onClick={() => setViewMode('cards')}
              >
                Cards
              </button>
              <button
                className={viewMode === 'matrix' ? styles.active : ''}
                onClick={() => setViewMode('matrix')}
              >
                Matrix
              </button>
            </div>
            <button onClick={openCreateModal} className={styles.createButton}>
              + Create Group
            </button>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {viewMode === 'cards' ? (
          <div className={styles.groupsGrid}>
            {groups.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No groups created yet.</p>
                <button onClick={openCreateModal}>Create your first group</button>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.id} className={styles.groupCard}>
                  <div className={styles.groupHeader}>
                    <div
                      className={styles.groupColor}
                      style={{ backgroundColor: group.color || '#3B82F6' }}
                    />
                    <div className={styles.groupInfo}>
                      <h3>{group.name}</h3>
                      <p>{group.description || 'No description'}</p>
                    </div>
                    <div className={styles.groupBadges}>
                      {group.isDefault && <span className={styles.defaultBadge}>Default</span>}
                      <span className={styles.priorityBadge}>Priority: {group.priority}</span>
                    </div>
                  </div>

                  <div className={styles.permissions}>
                    {PERMISSION_FIELDS.map(perm => (
                      <span
                        key={perm.key}
                        className={`${styles.permBadge} ${group[perm.key] ? styles.granted : styles.denied}`}
                        title={perm.description}
                      >
                        {group[perm.key] ? '✓' : '✗'} {perm.label}
                      </span>
                    ))}
                  </div>

                  <div className={styles.groupFooter}>
                    <span className={styles.memberCount}>
                      {group.memberCount || 0} members
                    </span>
                    <div className={styles.groupActions}>
                      <button onClick={() => openMembersModal(group)} title="Manage Members">
                        👥
                      </button>
                      <button onClick={() => openEditModal(group)} title="Edit Group">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(group)} title="Delete Group" className={styles.deleteBtn}>
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.matrixContainer}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Priority</th>
                  {PERMISSION_FIELDS.map(perm => (
                    <th key={perm.key} title={perm.description}>{perm.label}</th>
                  ))}
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <tr key={group.id}>
                    <td>
                      <div className={styles.groupName}>
                        <span
                          className={styles.colorDot}
                          style={{ backgroundColor: group.color || '#3B82F6' }}
                        />
                        {group.name}
                        {group.isDefault && <span className={styles.defaultTag}>Default</span>}
                      </div>
                    </td>
                    <td>{group.priority}</td>
                    {PERMISSION_FIELDS.map(perm => (
                      <td key={perm.key} className={styles.permCell}>
                        <span className={group[perm.key] ? styles.checkmark : styles.cross}>
                          {group[perm.key] ? '✓' : '✗'}
                        </span>
                      </td>
                    ))}
                    <td>{group.memberCount || 0}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button onClick={() => openMembersModal(group)}>👥</button>
                        <button onClick={() => openEditModal(group)}>✏️</button>
                        <button onClick={() => handleDelete(group)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedGroup ? 'Edit Group' : 'Create Group'}</h2>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Group Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Premium Members"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Color</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                    />
                    <span>{formData.color}</span>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of this group..."
                  rows="2"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                  <small>Higher priority groups take precedence</small>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={formData.isDefault}
                      onChange={handleChange}
                    />
                    Default group for new users
                  </label>
                </div>
              </div>

              <div className={styles.permissionsSection}>
                <h3>Permissions</h3>
                <div className={styles.permissionsGrid}>
                  {PERMISSION_FIELDS.map(perm => (
                    <label key={perm.key} className={styles.permCheckbox}>
                      <input
                        type="checkbox"
                        name={perm.key}
                        checked={formData[perm.key]}
                        onChange={handleChange}
                      />
                      <span className={styles.permLabel}>
                        <strong>{perm.label}</strong>
                        <small>{perm.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className={styles.formError}>{error}</div>}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={styles.submitBtn}>
                  {saving ? 'Saving...' : selectedGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className={styles.modalBackdrop} onClick={() => setShowMembersModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: selectedGroup.color }}
                />
                {selectedGroup.name} Members
              </h2>
              <button onClick={() => setShowMembersModal(false)} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.membersContent}>
              <div className={styles.addMemberSection}>
                <input
                  type="text"
                  placeholder="Search users to add..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    searchUsers(e.target.value);
                  }}
                />
                {availableUsers.length > 0 && (
                  <div className={styles.userSuggestions}>
                    {availableUsers.map(u => (
                      <div key={u.id} className={styles.userSuggestion} onClick={() => addMember(u.id)}>
                        <span className={styles.avatar}>{u.username[0].toUpperCase()}</span>
                        <span>{u.username}</span>
                        <span className={styles.addIcon}>+</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.membersList}>
                {members.length === 0 ? (
                  <p className={styles.noMembers}>No members in this group yet.</p>
                ) : (
                  members.map(m => (
                    <div key={m.user.id} className={styles.memberItem}>
                      <div className={styles.memberInfo}>
                        <span className={styles.avatar}>{m.user.username[0].toUpperCase()}</span>
                        <div>
                          <strong>{m.user.username}</strong>
                          <small>{m.user.email}</small>
                        </div>
                      </div>
                      <button
                        onClick={() => removeMember(m.user.id)}
                        className={styles.removeBtn}
                        title="Remove from group"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
