import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminUploadSettings.module.css';

export default function UploadSettings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    useS3: false,
    maxFileSize: 10,
    allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    s3Config: {
      hasAccessKey: false,
      hasSecretKey: false,
      region: 'us-east-1',
      bucketName: '',
      isConfigured: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/upload-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching upload settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/upload-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateS3Setting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      s3Config: {
        ...prev.s3Config,
        [key]: value
      }
    }));
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Loading upload settings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Upload Settings</h1>
        </div>

        {/* Messages */}
        {message && (
          <div className={message.includes('success') ? styles.success : styles.error}>
            {message}
          </div>
        )}

        <div className={styles.content}>
          {/* Upload Configuration Section */}
          <div className={styles.form}>
            <div className={styles.section}>
              <h2>Upload Configuration</h2>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={settings.useS3}
                    onChange={(e) => updateSetting('useS3', e.target.checked)}
                  />
                  Use Amazon S3 for image storage
                </label>
                <p className={styles.helpText}>
                  When enabled, images will be uploaded to S3. Otherwise, they will be stored locally.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label>Maximum file size (MB):</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting('maxFileSize', Number.parseInt(e.target.value))}
                  className={styles.input}
                  style={{ width: '80px' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Allowed file types:</label>
                <div className={styles.checkboxGroup}>
                  {['jpeg', 'jpg', 'png', 'gif', 'webp'].map(type => (
                    <label key={type} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={settings.allowedTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateSetting('allowedTypes', [...settings.allowedTypes, type]);
                          } else {
                            updateSetting('allowedTypes', settings.allowedTypes.filter(t => t !== type));
                          }
                        }}
                      />
                      {type.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* S3 Configuration Section */}
            {settings.useS3 && (
              <div className={styles.section}>
                <h2>Amazon S3 Configuration</h2>

                <div className={styles.warningSection}>
                  <h3>⚠️ Security Notice</h3>
                  <p>AWS credentials are stored securely in environment variables on the server and are never exposed to the browser.</p>
                  <p>
                    {settings.s3Config.hasAccessKey && settings.s3Config.hasSecretKey ? (
                      <span style={{ color: '#3a7e3a' }}>✅ AWS credentials are configured</span>
                    ) : (
                      <span style={{ color: '#993333' }}>❌ AWS credentials are not configured</span>
                    )}
                  </p>
                </div>

                <div className={styles.infoSection}>
                  <h3>Environment Variables Required:</h3>
                  <p>Set the following in your <code>.env</code> file and restart the server:</p>
                  <ul>
                    <li><code>AWS_ACCESS_KEY_ID</code></li>
                    <li><code>AWS_SECRET_ACCESS_KEY</code></li>
                    <li><code>AWS_REGION</code></li>
                    <li><code>S3_BUCKET_NAME</code></li>
                  </ul>
                </div>

                <div className={styles.formGroup}>
                  <label>AWS Region:</label>
                  <select
                    value={settings.s3Config.region}
                    onChange={(e) => updateS3Setting('region', e.target.value)}
                    className={styles.select}
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-1">US West (N. California)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">Europe (Ireland)</option>
                    <option value="eu-central-1">Europe (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>S3 Bucket Name:</label>
                  <input
                    type="text"
                    value={settings.s3Config.bucketName}
                    onChange={(e) => updateS3Setting('bucketName', e.target.value)}
                    placeholder="my-forum-uploads"
                    className={styles.input}
                  />
                </div>

                <div className={styles.infoSection}>
                  <h3>S3 Setup Instructions:</h3>
                  <ol>
                    <li>Create an S3 bucket in your AWS account</li>
                    <li>Set bucket policy to allow public read access for uploaded images</li>
                    <li>Create an IAM user with S3 upload permissions</li>
                    <li>Enter the IAM user access keys in your environment variables</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Local Storage Section */}
            <div className={styles.section}>
              <h2>Local Storage</h2>
              <div className={styles.infoSection}>
                <p><strong>Upload Directory:</strong> <code>public/uploads/images/</code></p>
                <p><strong>Permissions:</strong> Make sure the directory is writable (755)</p>
                <p><strong>URL Path:</strong> Images will be accessible at <code>/uploads/images/filename.jpg</code></p>
              </div>
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
              <button
                onClick={saveSettings}
                disabled={saving}
                className={styles.saveButton}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
