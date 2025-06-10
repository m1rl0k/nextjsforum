import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminTemplates.module.css';

const AdminTemplates = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState({
    primaryColor: '#4299e1',
    secondaryColor: '#2d3748',
    backgroundColor: '#ffffff',
    textColor: '#2d3748',
    linkColor: '#4299e1',
    borderColor: '#e2e8f0',
    headerBackground: '#2d3748',
    headerText: '#ffffff',
    sidebarBackground: '#f7fafc',
    buttonStyle: 'rounded',
    fontFamily: 'Inter',
    fontSize: '14',
    logoEnabled: false,
    logoUrl: '',
    customCSS: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/templates', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch templates');
      }
      
      setTemplates(prev => ({ ...prev, ...data.templates }));
    } catch (err) {
      setError(err.message || 'Failed to load templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTemplates(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(templates)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save templates');
      }

      setSuccess('Theme settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setTemplates({
      primaryColor: '#4299e1',
      secondaryColor: '#2d3748',
      backgroundColor: '#ffffff',
      textColor: '#2d3748',
      linkColor: '#4299e1',
      borderColor: '#e2e8f0',
      headerBackground: '#2d3748',
      headerText: '#ffffff',
      sidebarBackground: '#f7fafc',
      buttonStyle: 'rounded',
      fontFamily: 'Inter',
      fontSize: '14',
      logoEnabled: false,
      logoUrl: '',
      customCSS: ''
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading theme settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Theme Customization</h1>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={styles.previewButton}
            >
              {previewMode ? '👁️ Exit Preview' : '👁️ Preview'}
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              className={styles.resetButton}
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {success && (
          <div className={styles.success}>{success}</div>
        )}

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
              <h2>Colors</h2>
              
              <div className={styles.colorGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="primaryColor">Primary Color</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      id="primaryColor"
                      name="primaryColor"
                      value={templates.primaryColor}
                      onChange={handleInputChange}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={templates.primaryColor}
                      onChange={handleInputChange}
                      name="primaryColor"
                      className={styles.colorText}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="secondaryColor">Secondary Color</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      id="secondaryColor"
                      name="secondaryColor"
                      value={templates.secondaryColor}
                      onChange={handleInputChange}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={templates.secondaryColor}
                      onChange={handleInputChange}
                      name="secondaryColor"
                      className={styles.colorText}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="backgroundColor">Background Color</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      id="backgroundColor"
                      name="backgroundColor"
                      value={templates.backgroundColor}
                      onChange={handleInputChange}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={templates.backgroundColor}
                      onChange={handleInputChange}
                      name="backgroundColor"
                      className={styles.colorText}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="textColor">Text Color</label>
                  <div className={styles.colorInput}>
                    <input
                      type="color"
                      id="textColor"
                      name="textColor"
                      value={templates.textColor}
                      onChange={handleInputChange}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={templates.textColor}
                      onChange={handleInputChange}
                      name="textColor"
                      className={styles.colorText}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2>Typography</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="fontFamily">Font Family</label>
                <select
                  id="fontFamily"
                  name="fontFamily"
                  value={templates.fontFamily}
                  onChange={handleInputChange}
                  className={styles.select}
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fontSize">Base Font Size (px)</label>
                <input
                  type="number"
                  id="fontSize"
                  name="fontSize"
                  value={templates.fontSize}
                  onChange={handleInputChange}
                  className={styles.input}
                  min="12"
                  max="20"
                />
              </div>
            </div>

            <div className={styles.section}>
              <h2>Logo Settings</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="logoEnabled"
                    checked={templates.logoEnabled}
                    onChange={handleInputChange}
                  />
                  Enable custom logo
                </label>
              </div>

              {templates.logoEnabled && (
                <div className={styles.formGroup}>
                  <label htmlFor="logoUrl">Logo URL</label>
                  <input
                    type="url"
                    id="logoUrl"
                    name="logoUrl"
                    value={templates.logoUrl}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h2>Custom CSS</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="customCSS">Additional CSS</label>
                <textarea
                  id="customCSS"
                  name="customCSS"
                  value={templates.customCSS}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={10}
                  placeholder="/* Add your custom CSS here */"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Saving...' : 'Save Theme Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTemplates;
