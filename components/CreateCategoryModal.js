import { useState } from 'react';
import styles from '../styles/Modal.module.css';

export default function CreateCategoryModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          order: formData.displayOrder
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create category');
      }

      setFormData({ name: '', description: '', displayOrder: 0 });
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'displayOrder' ? parseInt(value) || 0 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create New Category</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Category Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., General Discussion"
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
              placeholder="Brief description of this category"
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
              {loading ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

