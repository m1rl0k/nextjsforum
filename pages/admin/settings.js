import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminSettings.module.css';

const AdminSettings = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    allowRegistration: true,
    requireEmailVerification: false,
    defaultUserRole: 'USER',
    postsPerPage: 20,
    threadsPerPage: 20,
    maxFileSize: 5,
    allowedFileTypes: 'jpg,jpeg,png,gif,pdf',
    enableNotifications: true,
    enablePrivateMessages: true,
    moderationMode: 'auto',
    spamFilterEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch settings');
      }
      
      setSettings(prev => ({ ...prev, ...data.settings }));
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
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
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Forum Settings</h1>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {success && (
          <div className={styles.success}>{success}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h2>General Settings</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="siteName">Site Name</label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                value={settings.siteName}
                onChange={handleInputChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="siteDescription">Site Description</label>
              <textarea
                id="siteDescription"
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleInputChange}
                className={styles.textarea}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>User Registration</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={handleInputChange}
                />
                Allow new user registration
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={handleInputChange}
                />
                Require email verification
              </label>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="defaultUserRole">Default User Role</label>
              <select
                id="defaultUserRole"
                name="defaultUserRole"
                value={settings.defaultUserRole}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="USER">User</option>
                <option value="MODERATOR">Moderator</option>
              </select>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Content Settings</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="postsPerPage">Posts per Page</label>
              <input
                type="number"
                id="postsPerPage"
                name="postsPerPage"
                value={settings.postsPerPage}
                onChange={handleInputChange}
                className={styles.input}
                min="5"
                max="100"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="threadsPerPage">Threads per Page</label>
              <input
                type="number"
                id="threadsPerPage"
                name="threadsPerPage"
                value={settings.threadsPerPage}
                onChange={handleInputChange}
                className={styles.input}
                min="5"
                max="100"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>File Upload Settings</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="maxFileSize">Max File Size (MB)</label>
              <input
                type="number"
                id="maxFileSize"
                name="maxFileSize"
                value={settings.maxFileSize}
                onChange={handleInputChange}
                className={styles.input}
                min="1"
                max="50"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="allowedFileTypes">Allowed File Types (comma-separated)</label>
              <input
                type="text"
                id="allowedFileTypes"
                name="allowedFileTypes"
                value={settings.allowedFileTypes}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="jpg,jpeg,png,gif,pdf"
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Features</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={handleInputChange}
                />
                Enable notifications
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="enablePrivateMessages"
                  checked={settings.enablePrivateMessages}
                  onChange={handleInputChange}
                />
                Enable private messages
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Moderation</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="moderationMode">Moderation Mode</label>
              <select
                id="moderationMode"
                name="moderationMode"
                value={settings.moderationMode}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="auto">Automatic</option>
                <option value="manual">Manual Review</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="spamFilterEnabled"
                  checked={settings.spamFilterEnabled}
                  onChange={handleInputChange}
                />
                Enable spam filter
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Maintenance</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleInputChange}
                />
                Enable maintenance mode
              </label>
            </div>

            {settings.maintenanceMode && (
              <div className={styles.formGroup}>
                <label htmlFor="maintenanceMessage">Maintenance Message</label>
                <textarea
                  id="maintenanceMessage"
                  name="maintenanceMessage"
                  value={settings.maintenanceMessage}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={3}
                  placeholder="The forum is currently under maintenance. Please check back later."
                />
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              disabled={saving}
              className={styles.saveButton}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
