import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Wait until router.query is populated
    if (!router.isReady) return;

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`https://backend-production-ed95.up.railway.app/api/auth/verify/${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Cannot connect to server. Is Docker running?');
      }
    };

    verify();
  }, [router.isReady, token]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🧠 BrainBytes</h1>

        {status === 'loading' && (
          <>
            <div style={styles.spinner} />
            <p style={styles.text}>Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.icon}>✅</div>
            <h2 style={{ ...styles.heading, color: '#065f46' }}>Email Verified!</h2>
            <p style={styles.text}>{message}</p>
            <button style={styles.btn} onClick={() => router.push('/login')}>
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.icon}>❌</div>
            <h2 style={{ ...styles.heading, color: '#991b1b' }}>Verification Failed</h2>
            <p style={styles.text}>{message}</p>
            <button style={{ ...styles.btn, backgroundColor: '#6b7280' }} onClick={() => router.push('/register')}>
              Back to Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '48px 36px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  logo: { fontSize: '24px', color: '#4f46e5', marginBottom: '24px' },
  icon: { fontSize: '48px', marginBottom: '16px' },
  heading: { margin: '0 0 12px', fontSize: '22px' },
  text: { color: '#6b7280', fontSize: '15px', marginBottom: '24px' },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  btn: {
    padding: '12px 28px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};