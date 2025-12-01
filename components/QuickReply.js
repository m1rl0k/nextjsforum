import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/QuickReply.module.css';

export default function QuickReply({ threadId, onReplyPosted }) {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          threadId: threadId
        }),
      });

      if (response.ok) {
        setContent('');
        setExpanded(false);
        if (onReplyPosted) {
          onReplyPosted();
        } else {
          // Refresh the page to show the new post
          router.reload();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to post reply');
      }
    } catch (err) {
      setError('An error occurred while posting your reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.icon}>✏️</span>
          <span className={styles.title}>Quick Reply</span>
        </div>
        <div className={styles.loginPrompt}>
          <a href={`/login?redirect=${encodeURIComponent(router.asPath)}`}>Log in</a> to post a quick reply
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.icon}>✏️</span>
        <span className={styles.title}>Quick Reply</span>
        <span className={styles.toggle}>{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.userInfo}>
            Posting as: <strong>{user.username}</strong>
          </div>
          
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your reply here..."
            rows={5}
            disabled={isSubmitting}
          />
          
          <div className={styles.actions}>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Quick Reply'}
            </button>
            <a 
              href={`/threads/${threadId}/reply`} 
              className={styles.advancedLink}
            >
              Go Advanced
            </a>
          </div>
        </form>
      )}
    </div>
  );
}

