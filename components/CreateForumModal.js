import { useState, useEffect } from 'react';
import styles from '../styles/Modal.module.css';

export default function CreateForumModal({ isOpen, onClose, onSuccess, categoryId = null }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: categoryId || '',
    displayOrder: 0,
    canPost: true,
    canReply: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (categoryId) {
      setFormData(prev => ({ ...prev, categoryId }));
    }
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          categoryId: parseInt(formData.categoryId),
          order: formData.displayOrder,
          canPost: formData.canPost,
          canReply: formData.canReply
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create forum');
      }

      setFormData({
        name: '',
        description: '',
        categoryId: categoryId || '',
        displayOrder: 0,
        canPost: true,
        canReply: true
      });
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'displayOrder' || name === 'categoryId' ? parseInt(value) || 0 : value)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create New Forum</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="categoryId">Category *</label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
              className={styles.select}
              disabled={!!categoryId}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Forum Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Introductions"
              className={styles.input}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of this forum"
              className={styles.textarea}
              rows="3"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="displayOrder">Display Order</label>
            <input
              type="number"
              id="displayOrder"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              className={styles.input}
              min="0"
            />
            <small className={styles.helpText}>Lower numbers appear first</small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="canPost"
                checked={formData.canPost}
                onChange={handleChange}
              />
              Allow users to create new threads
            </label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="canReply"
                checked={formData.canReply}
                onChange={handleChange}
              />
              Allow users to reply to threads
            </label>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Forum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

