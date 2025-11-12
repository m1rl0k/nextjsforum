import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../../../styles/AdminForums.module.css';

const AdminForums = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    categoryId: null,
    order: 0,
    isCategory: false,
    canPost: true,
    canReply: true,
    requiresApproval: false,
    guestPosting: false,
    isActive: true,
    icon: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    // Wait for auth to load before checking permissions
    if (authLoading) {
      return;
    }

    // Redirect non-admins
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    // Fetch forums only if user is admin
    fetchForums();
  }, [user, authLoading, router]);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/forums', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch forums');
      }
      
      setCategories(data.data);
      // Expand all categories by default
      const expanded = {};
      data.data.forEach(cat => {
        expanded[cat.id] = true;
      });
      setExpandedCategories(expanded);
    } catch (err) {
      setError(err.message || 'Failed to load forums');
      console.error('Error fetching forums:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
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
    
    try {
      const url = isEditing 
        ? `/api/admin/forums/${isEditing}`
        : '/api/admin/forums';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          order: Number.parseInt(formData.order, 10)
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save forum');
      }
      
      // Reset form and refresh data
      setFormData({
        name: '',
        description: '',
        slug: '',
        categoryId: null,
        order: 0,
        isCategory: false,
        canPost: true,
        canReply: true,
        requiresApproval: false,
        guestPosting: false,
        isActive: true,
        icon: ''
      });
      setIsCreating(false);
      setIsEditing(null);
      fetchForums();
    } catch (err) {
      setError(err.message || 'Failed to save forum');
      console.error('Error saving forum:', err);
    }
  };

  const handleEdit = (forum) => {
    setFormData({
      name: forum.name,
      description: forum.description || '',
      slug: forum.slug || '',
      categoryId: forum.categoryId || null,
      order: forum.order || 0,
      isCategory: forum.isCategory || false,
      canPost: forum.canPost !== false,
      canReply: forum.canReply !== false,
      requiresApproval: forum.requiresApproval || false,
      guestPosting: forum.guestPosting || false,
      isActive: forum.isActive !== false,
      icon: forum.icon || ''
    });
    setIsEditing(forum.id);
    setIsCreating(true);
  };

  const handleDelete = async (forumId, isCategory = false, cascade = false) => {
    if (!cascade && !confirm('Are you sure you want to delete this forum? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/forums/${forumId}?type=${isCategory ? 'category' : 'subject'}${cascade ? '&cascade=true' : ''}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        // If it's a category with children and cascade wasn't requested, ask user
        if (data.hasChildren && !cascade) {
          const confirmCascade = confirm(
            `${data.message}\n\nDo you want to delete this category and all ${data.childCount} forum(s) under it?\n\nForums to be deleted:\n${data.children?.join('\n- ')}`
          );

          if (confirmCascade) {
            // Retry with cascade=true
            return handleDelete(forumId, isCategory, true);
          }
          return;
        }

        throw new Error(data.message || 'Failed to delete forum');
      }

      fetchForums();
    } catch (err) {
      setError(err.message || 'Failed to delete forum');
      console.error('Error deleting forum:', err);
    }
  };

  const renderForums = (forums, level = 0) => {
    return forums.map(forum => (
      <div key={forum.id} className={styles.forumItem} style={{ marginLeft: `${level * 20}px` }}>
        <div className={styles.forumHeader}>
          <div className={styles.forumInfo}>
            <h3 className={styles.forumName}>
              {forum.icon && <span>{forum.icon} </span>}
              {forum.name}
            </h3>
            <span className={styles.forumMeta}>
              {forum.isCategory ? 'Category' : 'Forum'} • {forum.isCategory ? (forum.children?.length || 0) + ' forums' : (forum.threadCount || 0) + ' threads'} • {forum.postCount || 0} posts
              {!forum.isActive && <span className={styles.badge}>Inactive</span>}
              {!forum.canPost && !forum.isCategory && <span className={styles.badge}>Read Only</span>}
              {forum.requiresApproval && <span className={styles.badge}>Moderated</span>}
            </span>
            {forum.slug && (
              <span className={styles.forumSlug}>/{forum.slug}</span>
            )}
          </div>
          <div className={styles.forumActions}>
            <button
              onClick={() => handleEdit(forum)}
              className={styles.actionButton}
              title="Edit"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(forum.id, forum.isCategory)}
              className={`${styles.actionButton} ${styles.deleteButton}`}
              title="Delete"
            >
              Delete
            </button>
            {forum.isCategory && (
              <button
                onClick={() => toggleCategory(forum.id)}
                className={styles.actionButton}
                title={expandedCategories[forum.id] ? 'Collapse' : 'Expand'}
              >
                {expandedCategories[forum.id] ? 'Collapse' : 'Expand'}
              </button>
            )}
          </div>
        </div>

        {forum.description && (
          <p className={styles.forumDescription}>{forum.description}</p>
        )}

        {forum.isCategory && expandedCategories[forum.id] && forum.children && forum.children.length > 0 && (
          <div className={styles.forumChildren}>
            {renderForums(forum.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading forums...</div>
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
          <h1>Manage Forums</h1>
          <button 
            onClick={() => {
              setIsCreating(true);
              setIsEditing(null);
              setFormData({
                name: '',
                description: '',
                slug: '',
                categoryId: null,
                order: 0,
                isCategory: false,
                canPost: true,
                canReply: true,
                requiresApproval: false,
                guestPosting: false,
                isActive: true,
                icon: ''
              });
            }}
            className={styles.addButton}
          >
            + Add New
          </button>
        </div>

        {isCreating && (
          <div className={styles.formContainer}>
            <h2>{isEditing ? 'Edit' : 'Create New'} {formData.isCategory ? 'Category' : 'Forum'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    name="isCategory"
                    checked={formData.isCategory}
                    onChange={handleInputChange}
                  />
                  Is Category
                </label>
              </div>
              
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows="3"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated-if-blank"
                  className={styles.input}
                />
              </div>
              
              {!formData.isCategory && (
                <div className={styles.formGroup}>
                  <label>Parent Category *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleInputChange}
                    className={styles.select}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Order</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                  className={styles.input}
                  style={{ width: '80px' }}
                />
              </div>

              {!formData.isCategory && (
                <>
                  <div className={styles.formGroup}>
                    <label>Icon (emoji or text)</label>
                    <input
                      type="text"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                      placeholder="📝"
                      className={styles.input}
                      style={{ width: '100px' }}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        name="canPost"
                        checked={formData.canPost}
                        onChange={handleInputChange}
                      />
                      {' '}Allow new threads
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        name="canReply"
                        checked={formData.canReply}
                        onChange={handleInputChange}
                      />
                      {' '}Allow replies
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        name="requiresApproval"
                        checked={formData.requiresApproval}
                        onChange={handleInputChange}
                      />
                      {' '}Require approval for new threads
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        name="guestPosting"
                        checked={formData.guestPosting}
                        onChange={handleInputChange}
                      />
                      {' '}Allow guest posting
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      {' '}Active (visible to users)
                    </label>
                  </div>
                </>
              )}
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton}>
                  {isEditing ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className={styles.forumsList}>
          {categories.length > 0 ? (
            renderForums(categories)
          ) : (
            <div className={styles.emptyState}>
              <p>No forums found. Create your first category or forum to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminForums;
