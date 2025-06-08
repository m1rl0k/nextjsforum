import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import AdminLayout from '../../../components/admin/AdminLayout';
import styles from '../../../styles/AdminSettings.module.css';

const AdminSettings = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: 'NextJS Forum',
    siteDescription: 'A modern forum built with Next.js',
    allowRegistration: true,
    requireEmailVerification: false,
    postsPerPage: 10,
    threadsPerPage: 20,
    maxFileSize: 5, // MB
    allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx',
    maintenanceMode: false,
    maintenanceMessage: 'The forum is currently under maintenance. Please check back later.'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/admin/settings');
      return;
    }

    if (user?.role !== 'ADMIN' && !loading) {
      router.push('/');
      return;
    }
  }, [user, isAuthenticated, loading]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setIsLoading(false);
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
          <p>Configure your forum's general settings and preferences.</p>
        </div>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
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
                rows="3"
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
                Require email verification for new accounts
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Content Settings</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="postsPerPage">Posts per page</label>
                <input
                  type="number"
                  id="postsPerPage"
                  name="postsPerPage"
                  value={settings.postsPerPage}
                  onChange={handleInputChange}
                  min="5"
                  max="50"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="threadsPerPage">Threads per page</label>
                <input
                  type="number"
                  id="threadsPerPage"
                  name="threadsPerPage"
                  value={settings.threadsPerPage}
                  onChange={handleInputChange}
                  min="10"
                  max="100"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>File Upload Settings</h2>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="maxFileSize">Max file size (MB)</label>
                <input
                  type="number"
                  id="maxFileSize"
                  name="maxFileSize"
                  value={settings.maxFileSize}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="allowedFileTypes">Allowed file types</label>
                <input
                  type="text"
                  id="allowedFileTypes"
                  name="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={handleInputChange}
                  placeholder="jpg,png,pdf,doc"
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>Maintenance Mode</h2>
            
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

            <div className={styles.formGroup}>
              <label htmlFor="maintenanceMessage">Maintenance message</label>
              <textarea
                id="maintenanceMessage"
                name="maintenanceMessage"
                value={settings.maintenanceMessage}
                onChange={handleInputChange}
                className={styles.textarea}
                rows="3"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
