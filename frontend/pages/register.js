import { useRouter } from 'next/router';
import { useState } from 'react';

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Filipino'];

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    preferredSubjects: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const toggleSubject = (subject) => {
    setForm((prev) => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.includes(subject)
        ? prev.preferredSubjects.filter((s) => s !== subject)
        : [...prev.preferredSubjects, subject],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        // Clear form
        setForm({ name: '', email: '', password: '', preferredSubjects: [] });
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Cannot connect to server. Is Docker running?' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo / Title */}
        <div style={styles.header}>
          <h1 style={styles.logo}>🧠 BrainBytes</h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>

        {/* Alert */}
        {message && (
          <div style={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              type="text"
              placeholder="Juan Dela Cruz"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="juan@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Preferred Subjects (optional)</label>
            <div style={styles.subjectGrid}>
              {SUBJECTS.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  style={
                    form.preferredSubjects.includes(subject)
                      ? styles.subjectActive
                      : styles.subjectInactive
                  }
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <span style={styles.link} onClick={() => router.push('/login')}>
            Log in
          </span>
        </p>
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
    padding: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '36px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  logo: { margin: 0, fontSize: '28px', color: '#4f46e5' },
  subtitle: { margin: '4px 0 0', color: '#6b7280', fontSize: '14px' },
  alertSuccess: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    border: '1px solid #6ee7b7',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  alertError: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#374151' },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  subjectGrid: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  subjectActive: {
    padding: '6px 14px',
    border: '2px solid #4f46e5',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  subjectInactive: {
    padding: '6px 14px',
    border: '2px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  },
  switchText: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6b7280' },
  link: { color: '#4f46e5', cursor: 'pointer', fontWeight: 600 },
};