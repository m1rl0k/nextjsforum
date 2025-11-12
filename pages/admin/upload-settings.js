import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';

export default function UploadSettings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    useS3: false,
    maxFileSize: 10,
    allowedTypes: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
    s3Config: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
      bucketName: ''
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
        <div className="upload-settings-page">
          <div className="loading">Loading upload settings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <AdminLayout>
      <div className="upload-settings-page">
        <div className="page-header">
          <h1>📁 Upload Settings</h1>
          <p>Configure image upload and storage options</p>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="settings-form">
          <div className="settings-section">
            <h2>📤 Upload Configuration</h2>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.useS3}
                  onChange={(e) => updateSetting('useS3', e.target.checked)}
                />
                <span>Use Amazon S3 for image storage</span>
              </label>
              <p className="help-text">
                When enabled, images will be uploaded to S3. Otherwise, they'll be stored locally.
              </p>
            </div>

            <div className="form-group">
              <label>Maximum file size (MB):</label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxFileSize}
                onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Allowed file types:</label>
              <div className="checkbox-group">
                {['jpeg', 'jpg', 'png', 'gif', 'webp'].map(type => (
                  <label key={type} className="checkbox-item">
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
                    <span>{type.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {settings.useS3 && (
            <div className="settings-section">
              <h2>☁️ Amazon S3 Configuration</h2>
              
              <div className="form-group">
                <label>AWS Access Key ID:</label>
                <input
                  type="text"
                  value={settings.s3Config.accessKeyId}
                  onChange={(e) => updateS3Setting('accessKeyId', e.target.value)}
                  placeholder="AKIA..."
                />
              </div>

              <div className="form-group">
                <label>AWS Secret Access Key:</label>
                <input
                  type="password"
                  value={settings.s3Config.secretAccessKey}
                  onChange={(e) => updateS3Setting('secretAccessKey', e.target.value)}
                  placeholder="Enter secret key"
                />
              </div>

              <div className="form-group">
                <label>AWS Region:</label>
                <select
                  value={settings.s3Config.region}
                  onChange={(e) => updateS3Setting('region', e.target.value)}
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

              <div className="form-group">
                <label>S3 Bucket Name:</label>
                <input
                  type="text"
                  value={settings.s3Config.bucketName}
                  onChange={(e) => updateS3Setting('bucketName', e.target.value)}
                  placeholder="my-forum-uploads"
                />
              </div>

              <div className="info-box">
                <h4>📋 S3 Setup Instructions:</h4>
                <ol>
                  <li>Create an S3 bucket in your AWS account</li>
                  <li>Set bucket policy to allow public read access for uploaded images</li>
                  <li>Create an IAM user with S3 upload permissions</li>
                  <li>Enter the IAM user's access keys above</li>
                </ol>
              </div>
            </div>
          )}

          <div className="settings-section">
            <h2>📁 Local Storage</h2>
            <div className="info-box">
              <p><strong>Upload Directory:</strong> <code>public/uploads/images/</code></p>
              <p><strong>Permissions:</strong> Make sure the directory is writable (755)</p>
              <p><strong>URL Path:</strong> Images will be accessible at <code>/uploads/images/filename.jpg</code></p>
            </div>
          </div>

          <div className="form-actions">
            <button 
              onClick={saveSettings}
              disabled={saving}
              className="button primary"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .upload-settings-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .page-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid var(--border-color);
        }

        .back-link {
          color: var(--primary-color);
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 10px;
          display: inline-block;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .page-header h1 {
          margin: 10px 0;
          color: var(--text-color);
        }

        .page-header p {
          color: #666;
          margin: 0;
        }

        .message {
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .settings-form {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .settings-section {
          padding: 25px;
          border-bottom: 1px solid var(--border-color);
        }

        .settings-section:last-child {
          border-bottom: none;
        }

        .settings-section h2 {
          margin: 0 0 20px 0;
          color: var(--text-color);
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }

        .form-group input[type="number"] {
          width: 120px;
        }

        .help-text {
          font-size: 0.85rem;
          color: #666;
          margin-top: 5px;
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
        }

        .checkbox-item input {
          margin-right: 5px;
        }

        .info-box {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 15px;
          margin-top: 15px;
        }

        .info-box h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .info-box ol {
          margin: 0;
          padding-left: 20px;
        }

        .info-box li {
          margin-bottom: 5px;
        }

        .info-box code {
          background: #e9ecef;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
        }

        .form-actions {
          padding: 25px;
          background: #f8f9fa;
          text-align: center;
        }

        .button {
          padding: 12px 24px;
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-color);
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .button:hover {
          background: #f5f5f5;
        }

        .button.primary {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .button.primary:hover {
          background: var(--primary-color-dark);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .upload-settings-page {
            padding: 15px;
          }

          .settings-section {
            padding: 20px 15px;
          }

          .form-actions {
            padding: 20px 15px;
          }

          .checkbox-group {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </AdminLayout>
  );
}
