import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/VerifyEmail.module.css';

export default function VerifyEmail() {
  const router = useRouter();
  const { token, message: queryMessage } = router.query;
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch {
      setStatus('error');
      setMessage('An error occurred while verifying your email');
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendStatus('sending');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail })
      });
      setResendStatus(res.ok ? 'sent' : 'error');
    } catch {
      setResendStatus('error');
    }
  };

  const ResendForm = () => (
    <form onSubmit={handleResend} className={styles.form}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Email Address</label>
        <input
          type="email"
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          className={styles.input}
          required
        />
      </div>
      <button type="submit" className={styles.submitButton} disabled={resendStatus === 'sending'}>
        {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification Email'}
      </button>
      {resendStatus === 'sent' && (
        <div className={styles.successMessage}>Verification email sent! Check your inbox.</div>
      )}
      {resendStatus === 'error' && (
        <div className={styles.error}>Failed to send. Please try again.</div>
      )}
    </form>
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Email Verification</h1>
        <div className={styles.content}>
          {!token && (
            <>
              {queryMessage && <div className={styles.infoMessage}>{queryMessage}</div>}
              <p className={styles.description}>
                Please check your email for a verification link. If you haven't received it, request a new one below.
              </p>
              <ResendForm />
            </>
          )}

          {token && status === 'verifying' && (
            <div className={styles.statusBox}>
              <span className={styles.icon}>⏳</span>
              <p className={styles.statusText}>Verifying your email address...</p>
            </div>
          )}

          {token && status === 'success' && (
            <div className={styles.statusBox}>
              <span className={styles.iconSuccess}>✓</span>
              <p className={styles.statusTextSuccess}>Email Verified Successfully!</p>
              <p className={styles.description}>{message}</p>
              <div className={styles.footer}>
                <Link href="/login" className={styles.link}>Click here to log in</Link>
              </div>
            </div>
          )}

          {token && status === 'error' && (
            <div className={styles.statusBox}>
              <span className={styles.iconError}>✗</span>
              <p className={styles.statusTextError}>Verification Failed</p>
              <p className={styles.description}>{message}</p>
              <div className={styles.divider} />
              <p className={styles.description}>Request a new verification email:</p>
              <ResendForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
