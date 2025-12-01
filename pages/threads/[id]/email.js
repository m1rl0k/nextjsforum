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
          padding: 10px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          font-size: 11px;
        }

        .email-thread h1 {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          padding: 8px 12px;
          margin: 0;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid #6B84AA;
          border-bottom: none;
        }

        .breadcrumb {
          margin-bottom: 10px;
          color: #666;
          font-size: 10px;
        }

        .breadcrumb a {
          color: #22497D;
          text-decoration: none;
        }

        .breadcrumb a:hover {
          color: #FF4400;
          text-decoration: underline;
        }

        .thread-info {
          background: #F5F5F5;
          padding: 10px;
          border: 1px solid #6B84AA;
          border-top: none;
        }

        .thread-info h2 {
          margin: 0 0 8px 0;
          color: #22497D;
          font-size: 12px;
        }

        .thread-info p {
          margin: 3px 0;
          color: #333;
        }

        .email-form {
          background: white;
          padding: 15px;
          border: 1px solid #6B84AA;
          border-top: none;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: bold;
          color: #333;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #808080;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #4C76B2;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
          padding-top: 12px;
          border-top: 1px solid #C0C0C0;
        }

        .button {
          padding: 5px 15px;
          border: 1px solid #808080;
          background: linear-gradient(to bottom, #F5F5F5 0%, #E0E0E0 100%);
          color: #333;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-size: 11px;
          font-family: Tahoma, Verdana, Arial, sans-serif;
        }

        .button:hover {
          background: linear-gradient(to bottom, #E0E0E0 0%, #D0D0D0 100%);
        }

        .button.primary {
          background: linear-gradient(to bottom, #4C76B2 0%, #2B4F81 100%);
          color: white;
          border-color: #2B4F81;
        }

        .button.primary:hover {
          background: linear-gradient(to bottom, #3A6090 0%, #1E3A5F 100%);
        }

        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .success {
          background: #D4EDDA;
          color: #155724;
          padding: 8px 10px;
          border: 1px solid #C3E6CB;
          margin-bottom: 10px;
        }

        .error {
          background: #F8D7DA;
          color: #721C24;
          padding: 8px 10px;
          border: 1px solid #F5C6CB;
          margin-bottom: 10px;
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
