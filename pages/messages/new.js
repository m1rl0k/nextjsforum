import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';

export default function NewMessage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [formData, setFormData] = useState({
    recipient: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    // Check if there's a 'to' parameter in the URL
    if (router.query.to) {
      setFormData(prev => ({
        ...prev,
        recipient: router.query.to
      }));
    }
  }, [user, router.query]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Show user suggestions when typing recipient
    if (name === 'recipient' && value.length > 1) {
      searchUsers(value);
    } else if (name === 'recipient') {
      setShowSuggestions(false);
    }
  };

  const searchUsers = async (searchTerm) => {
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setUserSuggestions(data.users);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    }
  };

  const selectUser = (username) => {
    setFormData(prev => ({
      ...prev,
      recipient: username
    }));
    setShowSuggestions(false);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    for (const file of files) {
      // Validate file size (3MB)
      if (file.size > 3 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 3MB.`);
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload/attachment', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          uploadedFiles.push({
            url: data.url,
            filename: data.originalName,
            size: data.size,
            type: data.type
          });
        } else {
          const error = await res.json();
          alert(`Failed to upload ${file.name}: ${error.error}`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert(`Failed to upload ${file.name}`);
      }
    }

    setAttachments([...attachments, ...uploadedFiles]);
    setUploading(false);
    e.target.value = ''; // Reset file input
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient is required';
    }

    if (!formData.content.trim() && attachments.length === 0) {
      newErrors.content = 'Message content or attachment is required';
    } else if (formData.content.trim() && formData.content.length < 10) {
      newErrors.content = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipient: formData.recipient.trim(),
          content: formData.content.trim() || '(Attachment)',
          attachments: attachments.length > 0 ? attachments : null
        }),
      });

      if (res.ok) {
        router.push('/messages?sent=1');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('An error occurred while sending the message');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="New Message">
      <div className="new-message-page">
        <div className="breadcrumbs">
          <Link href="/">Forum Index</Link> &raquo;{' '}
          <Link href="/messages">Private Messages</Link> &raquo;
          <span> New Message</span>
        </div>

        <div className="category-block">
          <div className="category-header">
            <span className="header-icon">✏️</span>
            Compose New Message
          </div>

          <div className="form-container">
            {error && (
              <div className="error-box">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <table className="form-table" cellSpacing="1" cellPadding="4">
                <tbody>
                  <tr>
                    <td className="form-label-cell">To (Username) *</td>
                    <td className="form-input-cell">
                      <div className="recipient-wrapper">
                        <input
                          id="recipient"
                          name="recipient"
                          type="text"
                          value={formData.recipient}
                          onChange={handleChange}
                          className={`vb-input ${errors.recipient ? 'error' : ''}`}
                          placeholder="Enter recipient's username..."
                          autoComplete="off"
                        />
                        {errors.recipient && (
                          <div className="field-error">{errors.recipient}</div>
                        )}

                        {/* User suggestions dropdown */}
                        {showSuggestions && userSuggestions.length > 0 && (
                          <div className="suggestions-dropdown">
                            {userSuggestions.map(u => (
                              <div
                                key={u.id}
                                onClick={() => selectUser(u.username)}
                                className="suggestion-item"
                              >
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.username} className="suggestion-avatar" />
                                ) : (
                                  <div className="suggestion-avatar-placeholder">
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span>{u.username}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="form-label-cell">Message *</td>
                    <td className="form-input-cell">
                      <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className={`vb-textarea ${errors.content ? 'error' : ''}`}
                        placeholder="Enter your message..."
                        rows="12"
                      />
                      {errors.content && (
                        <div className="field-error">{errors.content}</div>
                      )}
                    </td>
                  </tr>
                  {attachments.length > 0 && (
                    <tr>
                      <td className="form-label-cell">Attachments</td>
                      <td className="form-input-cell">
                        <div className="attachments-list">
                          {attachments.map((att, idx) => (
                            <div key={idx} className="attachment-item">
                              {att.type?.startsWith('image/') ? (
                                <img src={att.url} alt={att.filename} className="attachment-thumb" />
                              ) : (
                                <span>📄 {att.filename}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="remove-btn"
                                title="Remove attachment"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="form-label-cell">&nbsp;</td>
                    <td className="form-input-cell">
                      <div className="form-actions">
                        <label className="attach-btn">
                          <input
                            type="file"
                            multiple
                            accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf,text/plain,application/zip"
                            onChange={handleFileUpload}
                            disabled={uploading || loading}
                          />
                          {uploading ? '⏳ Uploading...' : '📎 Attach File'}
                        </label>
                        <button type="submit" className="vb-button" disabled={loading}>
                          {loading ? 'Sending...' : 'Send Message'}
                        </button>
                        <Link href="/messages" className="vb-button secondary">
                          Cancel
                        </Link>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .new-message-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
        }

        .breadcrumbs {
          background-color: #F5F5F5;
          padding: 8px 15px;
          border: 1px solid #6B84AA;
          border-bottom: none;
          font-size: 11px;
        }

        .breadcrumbs a {
          color: #22497D;
          text-decoration: none;
        }

        .breadcrumbs a:hover {
          color: #FF4400;
          text-decoration: underline;
        }

        .category-block {
          background: white;
          border: 1px solid #6B84AA;
        }

        .category-header {
          background: linear-gradient(to bottom, #8FA3C7 0%, #738FBF 100%);
          color: white;
          padding: 8px 15px;
          font-weight: bold;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          font-size: 14px;
        }

        .form-container {
          padding: 15px;
          background: #E5E5E5;
        }

        .error-box {
          background: #FFEBE8;
          border: 1px solid #CC0000;
          color: #CC0000;
          padding: 8px 12px;
          margin-bottom: 15px;
          font-size: 11px;
        }

        .form-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 1px;
          background: #808080;
        }

        .form-label-cell {
          background: linear-gradient(to bottom, #E8E8E8 0%, #D8D8D8 100%);
          padding: 8px 12px;
          font-weight: bold;
          width: 120px;
          vertical-align: top;
        }

        .form-input-cell {
          background: #F5F5F5;
          padding: 8px 12px;
        }

        .recipient-wrapper {
          position: relative;
        }

        .vb-input {
          width: 300px;
          padding: 4px 6px;
          border: 1px solid #808080;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
        }

        .vb-input:focus {
          outline: none;
          border-color: #4C76B2;
        }

        .vb-input.error {
          border-color: #CC0000;
        }

        .vb-textarea {
          width: 100%;
          padding: 6px;
          border: 1px solid #808080;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
          resize: vertical;
          box-sizing: border-box;
        }

        .vb-textarea:focus {
          outline: none;
          border-color: #4C76B2;
        }

        .vb-textarea.error {
          border-color: #CC0000;
        }

        .field-error {
          color: #CC0000;
          font-size: 10px;
          margin-top: 4px;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          width: 300px;
          background: white;
          border: 1px solid #808080;
          border-top: none;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
        }

        .suggestion-item {
          padding: 6px 10px;
          cursor: pointer;
          border-bottom: 1px solid #E0E0E0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .suggestion-item:hover {
          background: #E8F4FD;
        }

        .suggestion-avatar {
          width: 18px;
          height: 18px;
          border-radius: 50%;
        }

        .suggestion-avatar-placeholder {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #4C76B2;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: bold;
        }

        .attachments-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .attachment-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: white;
          border: 1px solid #808080;
          font-size: 10px;
        }

        .attachment-thumb {
          max-width: 60px;
          max-height: 40px;
        }

        .remove-btn {
          background: #CC0000;
          color: white;
          border: none;
          width: 16px;
          height: 16px;
          cursor: pointer;
          font-size: 10px;
          line-height: 1;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-btn:hover {
          background: #990000;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .attach-btn {
          display: inline-block;
          background: linear-gradient(to bottom, #E0E0E0 0%, #C8C8C8 100%);
          border: 1px solid #808080;
          padding: 5px 12px;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
          color: #333;
          cursor: pointer;
        }

        .attach-btn:hover {
          background: linear-gradient(to bottom, #E8E8E8 0%, #D0D0D0 100%);
        }

        .attach-btn input {
          display: none;
        }

        .vb-button {
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          border: 1px solid #808080;
          padding: 5px 12px;
          font: 11px Tahoma, Verdana, Arial, sans-serif;
          color: #333;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .vb-button:hover {
          background: linear-gradient(to bottom, #FFFFFF 0%, #E8E8E8 100%);
        }

        .vb-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .vb-button.secondary {
          background: linear-gradient(to bottom, #E0E0E0 0%, #C8C8C8 100%);
        }
      `}</style>
    </Layout>
  );
}
