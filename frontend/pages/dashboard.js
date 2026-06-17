import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState('');
  const [stats, setStats] = useState({ total: 0, bySubject: {}, recent: [] });

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const userData = localStorage.getItem('bb_user');
    if (!token || !userData) { router.push('/login'); return; }

    const parsed = JSON.parse(userData);
    setUser(parsed);

    // Use same consistent key as profile.js: bb_photo_<id> and bb_note_<id>
    const savedPhoto = localStorage.getItem(`bb_photo_${parsed.id}`);
    const savedNote = localStorage.getItem(`bb_note_${parsed.id}`);
    if (savedPhoto) setPhoto(savedPhoto);
    if (savedNote) setNote(savedNote);

    fetchStats(parsed.id);
  }, []);

  const fetchStats = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/dashboard/recent?userId=${userId}`);
      const data = await res.json();

      const bySubject = {};
      (data.subjectCounts || []).forEach(item => {
        if (item._id) bySubject[item._id] = item.count;
      });

      setStats({
        total: data.totalMessages || 0,
        bySubject,
        recent: data.recentMessages || [],
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    // Note: intentionally keep bb_photo_<id> and bb_note_<id> so they persist after re-login
    router.push('/login');
  };

  if (!user) return null;

  const subjectColors = {
    Math: '#4f46e5', Science: '#059669', History: '#d97706',
    English: '#db2777', Filipino: '#7c3aed', General: '#6b7280',
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.navLogo}>🧠 BrainBytes</span>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => router.push('/')}>Chat</span>
          <span style={s.navLink} onClick={() => router.push('/profile')}>Profile</span>
          <span style={{ ...s.navLink, color: '#4f46e5', fontWeight: 700 }}>Dashboard</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.headerCard}>
          <div style={s.userInfo}>
            {photo
              ? <img src={photo} alt="profile" style={s.avatar} />
              : <div style={s.avatarPlaceholder}>👤</div>
            }
            <div>
              <h2 style={{ margin: 0, fontSize: 22, color: '#111827' }}>
                Welcome, {user.name}! 👋
              </h2>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>{user.email}</p>
              {user.preferredSubjects?.length > 0 && (
                <div style={s.subjectTags}>
                  {user.preferredSubjects.map((sub) => (
                    <span key={sub} style={{ ...s.subjectTag, backgroundColor: subjectColors[sub] || '#6b7280' }}>
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={s.statsRow}>
          <div style={s.statCard}>
            <p style={s.statNumber}>{stats.total}</p>
            <p style={s.statLabel}>Total Conversations</p>
          </div>
          {Object.entries(stats.bySubject).slice(0, 3).map(([subject, count]) => (
            <div key={subject} style={{ ...s.statCard, borderTop: `4px solid ${subjectColors[subject] || '#6b7280'}` }}>
              <p style={s.statNumber}>{count}</p>
              <p style={s.statLabel}>{subject}</p>
            </div>
          ))}
        </div>

        <div style={s.twoCol}>
          <div style={s.card}>
            <h3 style={s.cardTitle}>📝 My Notes</h3>
            {note
              ? <div style={s.noteContent}>
                  {note.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{line || <br />}</p>
                  ))}
                </div>
              : <div style={s.emptyNote}>
                  <p style={{ color: '#9ca3af', fontSize: 14, margin: 0 }}>
                    No notes yet. Go to{' '}
                    <span style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={() => router.push('/profile')}>
                      Profile
                    </span>{' '}
                    to add your notes!
                  </p>
                </div>
            }
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>🕐 Recent Activity</h3>
            {stats.recent.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: 14 }}>No conversations yet. Start chatting!</p>
              : stats.recent.slice(0, 5).map((msg, i) => (
                  <div key={i} style={s.activityItem}>
                    <span style={{ ...s.subjectBadge, backgroundColor: subjectColors[msg.subject] || '#6b7280' }}>
                      {msg.subject || 'General'}
                    </span>
                    <p style={s.activityText}>{msg.text?.slice(0, 60)}...</p>
                  </div>
                ))
            }
          </div>
        </div>
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
  container: { maxWidth: 900, margin: '0 auto', padding: '32px 16px' },
  headerCard: { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, marginBottom: 20 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 20 },
  avatar: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #4f46e5' },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 },
  subjectTags: { display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  subjectTag: { color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 140, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', borderTop: '4px solid #4f46e5', padding: '20px 24px', textAlign: 'center' },
  statNumber: { margin: 0, fontSize: 32, fontWeight: 800, color: '#111827' },
  statLabel: { margin: '4px 0 0', fontSize: 13, color: '#6b7280' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 },
  cardTitle: { margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#111827' },
  noteContent: { backgroundColor: '#fafafa', borderRadius: 8, padding: '14px 16px', border: '1px solid #f3f4f6', color: '#374151', fontSize: 14 },
  emptyNote: { backgroundColor: '#fafafa', borderRadius: 8, padding: '20px 16px', border: '1px dashed #d1d5db', textAlign: 'center' },
  activityItem: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  subjectBadge: { color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', marginTop: 2 },
  activityText: { margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 },
};