import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Filipino'];

export default function Profile() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const userData = localStorage.getItem('bb_user');
    if (!token || !userData) { router.push('/login'); return; }

    const parsed = JSON.parse(userData);
    setUser(parsed);
    setName(parsed.name || '');
    setSubjects(parsed.preferredSubjects || []);

    // Use consistent key: bb_photo_<id> and bb_note_<id>
    const savedPhoto = localStorage.getItem(`bb_photo_${parsed.id}`);
    const savedNote = localStorage.getItem(`bb_note_${parsed.id}`);
    if (savedPhoto) setPhoto(savedPhoto);
    if (savedNote) setNote(savedNote);
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      localStorage.setItem(`bb_photo_${user.id}`, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleSubject = (subject) => {
    setSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleSave = () => {
    const updated = { ...user, name, preferredSubjects: subjects };
    localStorage.setItem('bb_user', JSON.stringify(updated));
    localStorage.setItem(`bb_note_${user.id}`, note);
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    // Note: we intentionally keep bb_photo_<id> and bb_note_<id>
    // so they persist after re-login
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.navLogo}>🧠 BrainBytes</span>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => router.push('/')}>Chat</span>
          <span style={{ ...s.navLink, color: '#4f46e5', fontWeight: 700 }}>Profile</span>
          <span style={s.navLink} onClick={() => router.push('/dashboard')}>Dashboard</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.container}>
        <h2 style={s.pageTitle}>My Profile</h2>

        {saved && <div style={s.successAlert}>✅ Profile saved successfully!</div>}

        <div style={s.card}>
          <h3 style={s.cardTitle}>Profile Photo</h3>
          <div style={s.photoSection}>
            <div style={s.avatarWrapper} onClick={() => fileRef.current.click()}>
              {photo
                ? <img src={photo} alt="profile" style={s.avatar} />
                : <div style={s.avatarPlaceholder}>
                    <span style={{ fontSize: 40 }}>👤</span>
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9ca3af' }}>Click to upload</p>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            <div style={s.photoInfo}>
              <p style={{ margin: 0, color: '#374151', fontWeight: 600 }}>{name}</p>
              <p style={{ margin: '4px 0 12px', color: '#9ca3af', fontSize: 13 }}>{user.email}</p>
              <button style={s.uploadBtn} onClick={() => fileRef.current.click()}>
                📷 Change Photo
              </button>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Display Name</h3>
          <input
            style={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Preferred Subjects</h3>
          <div style={s.subjectGrid}>
            {SUBJECTS.map((subject) => (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                style={subjects.includes(subject) ? s.subjectActive : s.subjectInactive}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>📝 My Notes</h3>
          <p style={s.cardSubtitle}>This will appear on your Dashboard.</p>
          <textarea
            style={s.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your personal notes, reminders, or study goals here..."
            rows={5}
          />
        </div>

        <button style={s.saveBtn} onClick={handleSave}>
          💾 Save Profile
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 32px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' },
  navLogo: { fontWeight: 700, fontSize: 20, color: '#4f46e5' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 24 },
  navLink: { cursor: 'pointer', fontSize: 14, color: '#374151' },
  logoutBtn: { padding: '8px 18px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  container: { maxWidth: 680, margin: '0 auto', padding: '32px 16px' },
  pageTitle: { fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 24 },
  successAlert: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '24px', marginBottom: 20 },
  cardTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#111827' },
  cardSubtitle: { margin: '-10px 0 12px', fontSize: 13, color: '#9ca3af' },
  photoSection: { display: 'flex', alignItems: 'center', gap: 24 },
  avatarWrapper: { cursor: 'pointer', flexShrink: 0 },
  avatar: { width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f46e5' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: '50%', backgroundColor: '#f3f4f6', border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  photoInfo: { flex: 1 },
  uploadBtn: { padding: '8px 16px', backgroundColor: '#ede9fe', color: '#4f46e5', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  subjectGrid: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  subjectActive: { padding: '8px 18px', border: '2px solid #4f46e5', backgroundColor: '#4f46e5', color: '#fff', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  subjectInactive: { padding: '8px 18px', border: '2px solid #d1d5db', backgroundColor: '#fff', color: '#374151', borderRadius: 20, cursor: 'pointer', fontSize: 13 },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif', lineHeight: 1.6 },
  saveBtn: { width: '100%', padding: '14px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
};