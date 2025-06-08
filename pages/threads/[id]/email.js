import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../context/AuthContext';

export default function EmailThread() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [thread, setThread] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    toEmail: '',
    fromName: '',
    fromEmail: '',
    subject: '',
    message: '',
    includeLink: true
  });

  useEffect(() => {
    if (id) {
      fetchThreadData();
    }
  }, [id]);

  useEffect(() => {
    if (user && thread) {
      setFormData(prev => ({
        ...prev,
        fromName: user.username,
        fromEmail: user.email,
        subject: `Forum Thread: ${thread.title}`
      }));
    }
  }, [user, thread]);

  const fetchThreadData = async () => {
    try {
      const res = await fetch(`/api/threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setThread(data);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      setError('Failed to load thread');
    } finally {
      setIsLoading(false);
    }
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
    setIsSending(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`/api/threads/${id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Email sent successfully!');
        setFormData(prev => ({ ...prev, toEmail: '', message: '' }));
      } else {
        setError(data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="email-thread">
          <h1>Email Thread</h1>
          <div className="error">You must be logged in to email threads.</div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="loading">Loading thread...</div>
      </Layout>
    );
  }

  if (!thread) {
    return (
      <Layout>
        <div className="error">Thread not found</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Email: ${thread.title} - NextJS Forum`}>
      <div className="email-thread">
        <div className="breadcrumb">
          <a href="/">Forum</a> › 
          <a href={`/subjects/${thread.subjectId}`}>{thread.subject?.name}</a> › 
          <a href={`/threads/${thread.id}`}>{thread.title}</a> › 
          <span>Email Thread</span>
        </div>

        <h1>📧 Email this Thread</h1>
        
        <div className="thread-info">
          <h2>{thread.title}</h2>
          <p>Started by <strong>{thread.user?.username}</strong> on {new Date(thread.createdAt).toLocaleDateString()}</p>
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="email-form">
          <div className="form-group">
            <label htmlFor="toEmail">To Email Address *</label>
            <input
              type="email"
              id="toEmail"
              name="toEmail"
              value={formData.toEmail}
              onChange={handleInputChange}
              required
              placeholder="recipient@example.com"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fromName">Your Name</label>
              <input
                type="text"
                id="fromName"
                name="fromName"
                value={formData.fromName}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fromEmail">Your Email</label>
              <input
                type="email"
                id="fromEmail"
                name="fromEmail"
                value={formData.fromEmail}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Personal Message (Optional)</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              placeholder="Add a personal message to include with the thread link..."
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="includeLink"
                checked={formData.includeLink}
                onChange={handleInputChange}
              />
              Include link to thread
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isSending}
              className="button primary"
            >
              {isSending ? 'Sending...' : '📧 Send Email'}
            </button>
            
            <button 
              type="button" 
              onClick={() => router.back()}
              className="button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .email-thread {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .breadcrumb {
          margin-bottom: 20px;
          color: #666;
        }

        .breadcrumb a {
          color: #007bff;
          text-decoration: none;
        }

        .thread-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .thread-info h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .email-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .button {
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: white;
          color: #333;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .button:hover {
          background: #f8f9fa;
        }

        .button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .button.primary:hover {
          background: #0056b3;
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          background: #d4edda;
          color: #155724;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
        `
      }} />
    </Layout>
  );
}
