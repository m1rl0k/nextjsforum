import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from '../../styles/AdminBackup.module.css';

const AdminBackup = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [backupOptions, setBackupOptions] = useState({
    includeUsers: true,
    includeThreads: true,
    includePosts: true,
    includeCategories: true,
    includeSettings: true,
    includeImages: false,
    format: 'json'
  });
  const [importOptions, setImportOptions] = useState({
    importCategories: true,
    importUsers: true,
    importThreads: true,
    importPosts: true,
    importSettings: true,
    overwriteExisting: false
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchBackups();
  }, [user, authLoading, router, pagination.page]);

  const fetchBackups = async (page = pagination.page) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/backup?page=${page}&limit=${pagination.limit}`, {
        credentials: 'include'
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch backups');
      }

      setBackups(data.backups || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to load backups');
      console.error('Error fetching backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(backupOptions)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create backup');
      }

      setSuccess('Backup created successfully!');
      fetchBackups(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (backupId) => {
    try {
      setError('');

      const res = await fetch(`/api/admin/backup/${backupId}/download`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download backup');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `forum-backup-${backupId}.json`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Backup downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Failed to download backup');
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/backup/${backupId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to delete backup');
      }

      setSuccess('Backup deleted successfully!');
      fetchBackups(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to delete backup');
    }
  };

  const handleExport = async (type) => {
    try {
      setError('');

      const res = await fetch(`/api/admin/export/${type}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error(`Failed to export ${type}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `${type}-export-${new Date().toISOString().split('T')[0]}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      } else {
        // Add appropriate extension
        filename += type === 'settings' ? '.json' : '.csv';
      }

      // Create blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (err) {
      setError(err.message || `Failed to export ${type}`);
    }
  };

  const handleOptionChange = (e) => {
    const { name, checked } = e.target;
    setBackupOptions(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImportOptionChange = (e) => {
    const { name, checked } = e.target;
    setImportOptions(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImportBackup = async () => {
    const fileInput = document.getElementById('importFile');
    const file = fileInput?.files?.[0];

    if (!file) {
      setError('Please select a backup file to import');
      return;
    }

    if (!confirm('Are you sure you want to import this backup? This may overwrite existing data if "Overwrite existing" is enabled. Make sure you have a current backup first.')) {
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importCategories', importOptions.importCategories);
      formData.append('importUsers', importOptions.importUsers);
      formData.append('importThreads', importOptions.importThreads);
      formData.append('importPosts', importOptions.importPosts);
      formData.append('importSettings', importOptions.importSettings);
      formData.append('overwriteExisting', importOptions.overwriteExisting);

      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to import backup');
      }

      const results = data.results;
      const summaryParts = [];
      if (results.categories) summaryParts.push(`Categories: ${results.categories.imported} imported, ${results.categories.skipped} skipped`);
      if (results.users) summaryParts.push(`Users: ${results.users.imported} imported, ${results.users.skipped} skipped`);
      if (results.threads) summaryParts.push(`Threads: ${results.threads.imported} imported, ${results.threads.skipped} skipped`);
      if (results.posts) summaryParts.push(`Posts: ${results.posts.imported} imported, ${results.posts.skipped} skipped`);

      setSuccess(`Backup imported successfully!\n${summaryParts.join('\n')}`);
      fileInput.value = ''; // Clear the file input
    } catch (err) {
      setError(err.message || 'Failed to import backup');
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading backup information...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Backup & Export</h1>
        </div>

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {success && (
          <div className={styles.success}>{success}</div>
        )}

        <div className={styles.content}>
          {/* Create New Backup */}
          <div className={styles.section}>
            <h2>Create New Backup</h2>
            
            <div className={styles.backupOptions}>
              <h3>What to include:</h3>
              <div className={styles.optionsGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="includeUsers"
                    checked={backupOptions.includeUsers}
                    onChange={handleOptionChange}
                  />
                  Users & Profiles
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="includeThreads"
                    checked={backupOptions.includeThreads}
                    onChange={handleOptionChange}
                  />
                  Threads
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="includePosts"
                    checked={backupOptions.includePosts}
                    onChange={handleOptionChange}
                  />
                  Posts & Replies
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="includeCategories"
                    checked={backupOptions.includeCategories}
                    onChange={handleOptionChange}
                  />
                  Categories & Forums
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="includeSettings"
                    checked={backupOptions.includeSettings}
                    onChange={handleOptionChange}
                  />
                  Settings & Configuration
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="includeImages"
                    checked={backupOptions.includeImages}
                    onChange={handleOptionChange}
                  />
                  Images & Files (Large)
                </label>
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={creating}
              className={styles.createButton}
            >
              {creating ? '🔄 Creating Backup...' : '💾 Create Backup'}
            </button>
          </div>

          {/* Existing Backups */}
          <div className={styles.section}>
            <h2>Existing Backups</h2>
            
            {backups.length > 0 ? (
              <div className={styles.backupsList}>
                {backups.map((backup) => (
                  <div key={backup.id} className={styles.backupItem}>
                    <div className={styles.backupInfo}>
                      <div className={styles.backupName}>
                        Backup #{backup.id}
                      </div>
                      <div className={styles.backupMeta}>
                        Created: {new Date(backup.createdAt).toLocaleString()}
                        {backup.size && (
                          <span> • Size: {formatFileSize(Number(backup.size))}</span>
                        )}
                        {backup.creator && (
                          <span> • By: {backup.creator.username}</span>
                        )}
                      </div>
                      <div className={styles.backupIncludes}>
                        Includes: {backup.includes?.join(', ') || 'All data'}
                      </div>
                      {backup.description && (
                        <div className={styles.backupDescription}>
                          {backup.description}
                        </div>
                      )}
                    </div>
                    <div className={styles.backupActions}>
                      <button
                        onClick={() => handleDownloadBackup(backup.id)}
                        className={styles.downloadButton}
                        title="Download Backup"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className={styles.deleteButton}
                        title="Delete Backup"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                No backups found. Create your first backup above.
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => {
                    const newPage = pagination.page - 1;
                    setPagination(prev => ({ ...prev, page: newPage }));
                    fetchBackups(newPage);
                  }}
                  disabled={pagination.page <= 1}
                  className={styles.paginationButton}
                >
                  ← Previous
                </button>

                <span className={styles.paginationInfo}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>

                <button
                  onClick={() => {
                    const newPage = pagination.page + 1;
                    setPagination(prev => ({ ...prev, page: newPage }));
                    fetchBackups(newPage);
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className={styles.paginationButton}
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Import Section */}
          <div className={styles.section}>
            <h2>Import Data</h2>
            <div className={styles.importSection}>
              <p className={styles.importDescription}>
                Import data from a previous backup or another forum system.
              </p>

              <div className={styles.backupOptions} style={{ marginBottom: '20px' }}>
                <h3>What to import:</h3>
                <div className={styles.optionsGrid}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="importCategories"
                      checked={importOptions.importCategories}
                      onChange={handleImportOptionChange}
                    />
                    Categories & Forums
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="importUsers"
                      checked={importOptions.importUsers}
                      onChange={handleImportOptionChange}
                    />
                    Users & Profiles
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="importThreads"
                      checked={importOptions.importThreads}
                      onChange={handleImportOptionChange}
                    />
                    Threads
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="importPosts"
                      checked={importOptions.importPosts}
                      onChange={handleImportOptionChange}
                    />
                    Posts & Replies
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="overwriteExisting"
                      checked={importOptions.overwriteExisting}
                      onChange={handleImportOptionChange}
                    />
                    Overwrite existing data
                  </label>
                </div>
              </div>

              <div className={styles.importActions}>
                <input
                  type="file"
                  id="importFile"
                  accept=".json"
                  className={styles.fileInput}
                />
                <button
                  onClick={handleImportBackup}
                  disabled={importing}
                  className={styles.importButton}
                >
                  {importing ? '⏳ Importing...' : '📤 Import Backup'}
                </button>
              </div>
              <div className={styles.importWarning}>
                ⚠️ Warning: Importing data may affect existing content if "Overwrite existing data" is enabled. Make sure to create a backup first.
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className={styles.section}>
            <h2>Quick Export</h2>
            <div className={styles.exportGrid}>
              <button
                onClick={() => handleExport('users')}
                className={styles.exportButton}
              >
                👥 Export Users (CSV)
              </button>
              <button
                onClick={() => handleExport('threads')}
                className={styles.exportButton}
              >
                💬 Export Threads (CSV)
              </button>
              <button
                onClick={() => handleExport('posts')}
                className={styles.exportButton}
              >
                📝 Export Posts (CSV)
              </button>
              <button
                onClick={() => handleExport('settings')}
                className={styles.exportButton}
              >
                ⚙️ Export Settings (JSON)
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBackup;
