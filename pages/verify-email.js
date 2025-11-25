import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('verifying'); // verifying, success, error
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
    } catch (error) {
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

      const data = await res.json();

      if (res.ok) {
        setResendStatus('sent');
      } else {
        setResendStatus('error: ' + data.error);
      }
    } catch (error) {
      setResendStatus('error');
    }
  };

  return (
    <Layout title="Verify Email">
      <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
        <div className="category-block">
          <div className="category-header">
            Email Verification
          </div>

          <div style={{ padding: '30px', backgroundColor: 'white', textAlign: 'center' }}>
            {!token && (
              <div>
                <h2 style={{ marginBottom: '20px' }}>Verify Your Email</h2>
                <p style={{ marginBottom: '20px', color: '#666' }}>
                  Please check your email for a verification link. If you haven't received it, you can request a new one below.
                </p>

                <form onSubmit={handleResend} style={{ marginTop: '30px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="form-input"
                      style={{ width: '100%', padding: '10px' }}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="button"
                    disabled={resendStatus === 'sending'}
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </form>

                {resendStatus === 'sent' && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '4px'
                  }}>
                    Verification email sent! Please check your inbox.
                  </div>
                )}

                {resendStatus && resendStatus.startsWith('error') && (
                  <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    borderRadius: '4px'
                  }}>
                    {resendStatus.replace('error: ', '')}
                  </div>
                )}
              </div>
            )}

            {token && status === 'verifying' && (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                <h2>Verifying your email...</h2>
                <p style={{ color: '#666' }}>Please wait while we verify your email address.</p>
              </div>
            )}

            {token && status === 'success' && (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
                <h2 style={{ color: '#2e7d32' }}>Email Verified!</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
                <Link href="/login" className="button">
                  Log In Now
                </Link>
              </div>
            )}

            {token && status === 'error' && (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                <h2 style={{ color: '#c62828' }}>Verification Failed</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>

                <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                  <p style={{ marginBottom: '15px' }}>Request a new verification email:</p>
                  <form onSubmit={handleResend}>
                    <div style={{ marginBottom: '15px' }}>
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={resendEmail}
                        onChange={(e) => setResendEmail(e.target.value)}
                        className="form-input"
                        style={{ width: '100%', padding: '10px' }}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="button"
                      disabled={resendStatus === 'sending'}
                    >
                      {resendStatus === 'sending' ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                  </form>

                  {resendStatus === 'sent' && (
                    <div style={{
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      borderRadius: '4px'
                    }}>
                      Verification email sent! Please check your inbox.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
