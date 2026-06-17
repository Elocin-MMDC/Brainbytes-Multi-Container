import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [note, setNote] = useState('');
  const [stats, setStats] = useState({ total: 0, bySubject: {}, recent: [], daily: {} });

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const userData = localStorage.getItem('bb_user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    setUser(parsed);
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

      // Build last 7 days
      const daily = {};
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        daily[days[d.getDay()]] = 0;
      }
      (data.recentMessages || []).forEach(msg => {
        const d = new Date(msg.createdAt);
        const day = days[d.getDay()];
        if (daily[day] !== undefined) daily[day]++;
      });

      setStats({
        total: data.totalMessages || 0,
        bySubject,
        recent: data.recentMessages || [],
        daily,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    router.push('/login');
  };

  if (!user) return null;

  const subjectColors = {
    Math: '#f59e0b', Science: '#10b981', History: '#f97316',
    English: '#ec4899', Filipino: '#8b5cf6', General: '#6366f1',
  };

  const favoriteSubject = Object.entries(stats.bySubject).sort((a, b) => b[1] - a[1])[0];
  const topicsExplored = Object.keys(stats.bySubject).length;
  const maxDaily = Math.max(...Object.values(stats.daily), 1);
  const maxSubject = Math.max(...Object.values(stats.bySubject), 1);

  const insight = favoriteSubject
    ? `Great pace this week! You're focusing on ${favoriteSubject[0]}. Try sprinkling in another subject to broaden your knowledge.`
    : 'Start chatting with BrainBytes to get personalized insights about your learning!';

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navEmoji}>🧠</span>
          <span style={s.navLogo}>BrainBytes</span>
        </div>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => router.push('/')}>Home</span>
          <span style={s.navLink} onClick={() => router.push('/')}>Chat</span>
          <span style={s.navLinkActive}>Dashboard</span>
          <span style={s.navLink} onClick={() => router.push('/profile')}>Profile</span>
          {photo
            ? <img src={photo} alt="avatar" style={s.navAvatar} onClick={() => router.push('/profile')} />
            : <div style={s.navAvatarPlaceholder} onClick={() => router.push('/profile')}>👤</div>
          }
        </div>
      </nav>

      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.title}>Dashboard</h1>
          <p style={s.subtitle}>Here's how your learning is going, {user.name}.</p>
        </div>

        {/* Today's Goal */}
        <div style={s.goalCard}>
          <div style={s.goalHeader}>
            <span style={s.goalIcon}>🎯</span>
            <span style={s.goalTitle}>Today's goal</span>
          </div>
          <p style={s.goalText}>
            {note ? `"${note.split('\n')[0]}"` : '"No goal set yet — add one in your Profile!"'}
          </p>
          <div style={s.goalFooter}>
            <div style={s.progressBar}>
              <div style={{ ...s.progressFill, width: `${Math.min((stats.total / 10) * 100, 100)}%` }} />
            </div>
            <div style={s.goalMeta}>
              <span style={s.goalMin}>{stats.total} questions asked today</span>
              <button style={s.continueBtn} onClick={() => router.push('/')}>
                Continue chatting →
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={s.statsGrid}>
          <div style={s.statCard}>
            <div style={{ ...s.statBar, backgroundColor: '#6366f1' }} />
            <span style={s.statIcon}>💬</span>
            <p style={s.statLabel}>QUESTIONS ASKED</p>
            <p style={s.statNumber}>{stats.total}</p>
            <p style={s.statSub}>{stats.total > 0 ? '1 session' : 'No sessions yet'}</p>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statBar, backgroundColor: '#10b981' }} />
            <span style={s.statIcon}>🏆</span>
            <p style={s.statLabel}>FAVORITE SUBJECT</p>
            <p style={s.statNumber}>{favoriteSubject ? favoriteSubject[0] : '—'}</p>
            <p style={s.statSub}>{favoriteSubject ? `${favoriteSubject[1]} questions` : 'Start chatting!'}</p>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statBar, backgroundColor: '#f97316' }} />
            <span style={s.statIcon}>🔥</span>
            <p style={s.statLabel}>STREAK</p>
            <p style={s.statNumber}>{stats.total > 0 ? '1 day' : '0 days'}</p>
            <p style={s.statSub}>{stats.total > 0 ? 'Keep it up!' : 'Start one today'}</p>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statBar, backgroundColor: '#8b5cf6' }} />
            <span style={s.statIcon}>📚</span>
            <p style={s.statLabel}>TOPICS EXPLORED</p>
            <p style={s.statNumber}>{topicsExplored}</p>
            <p style={s.statSub}>Unique question subjects</p>
          </div>
        </div>

        {/* Insight */}
        <div style={s.insightCard}>
          <div style={s.insightHeader}>
            <span>💡</span>
            <span style={s.insightTitle}>Insight</span>
          </div>
          <div style={s.insightBody}>
            <p style={s.insightText}>{insight}</p>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={s.bottomGrid}>
          {/* Last 7 Days */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span>📅</span>
              <h3 style={s.cardTitle}>Last 7 days</h3>
            </div>
            <p style={s.cardSubtitle}>Questions asked each day.</p>
            <div style={s.barChart}>
              {Object.entries(stats.daily).map(([day, count]) => (
                <div key={day} style={s.barCol}>
                  <div style={s.barWrapper}>
                    <div style={{
                      ...s.bar,
                      height: `${Math.max((count / maxDaily) * 120, count > 0 ? 8 : 0)}px`,
                      backgroundColor: count > 0 ? '#6366f1' : '#e5e7eb',
                    }} />
                  </div>
                  <span style={s.barLabel}>{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Breakdown */}
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span>🔢</span>
              <h3 style={s.cardTitle}>Subject breakdown</h3>
            </div>
            <div style={s.subjectList}>
              {Object.entries(stats.bySubject).length === 0
                ? <p style={{ color: '#9ca3af', fontSize: 14 }}>No data yet. Start chatting!</p>
                : Object.entries(stats.bySubject)
                    .sort((a, b) => b[1] - a[1])
                    .map(([subject, count]) => (
                      <div key={subject} style={s.subjectRow}>
                        <span style={{ ...s.subjectBadge, backgroundColor: subjectColors[subject] || '#6b7280' }}>
                          {subject}
                        </span>
                        <div style={s.subjectBarBg}>
                          <div style={{
                            ...s.subjectBarFill,
                            width: `${(count / maxSubject) * 100}%`,
                            backgroundColor: subjectColors[subject] || '#6366f1',
                          }} />
                        </div>
                        <span style={s.subjectCount}>{count}</span>
                      </div>
                    ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9ff', fontFamily: "'Segoe UI', Arial, sans-serif" },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 40px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  navBrand: { display: 'flex', alignItems: 'center', gap: 8 },
  navEmoji: { fontSize: 22 },
  navLogo: { fontWeight: 700, fontSize: 20, color: '#1e1b4b' },
  navLinks: { display: 'flex', alignItems: 'center', gap: 28 },
  navLink: { cursor: 'pointer', fontSize: 14, color: '#6b7280', fontWeight: 500 },
  navLinkActive: { cursor: 'pointer', fontSize: 14, color: '#fff', fontWeight: 600, backgroundColor: '#6366f1', padding: '6px 16px', borderRadius: 20 },
  navAvatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #6366f1' },
  navAvatarPlaceholder: { width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 },
  container: { maxWidth: 1000, margin: '0 auto', padding: '32px 24px' },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: '#1e1b4b' },
  subtitle: { margin: '4px 0 0', color: '#6b7280', fontSize: 15 },
  goalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  goalHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  goalIcon: { fontSize: 18 },
  goalTitle: { fontWeight: 600, fontSize: 15, color: '#374151' },
  goalText: { color: '#6b7280', fontSize: 15, fontStyle: 'italic', margin: '0 0 16px' },
  goalFooter: { display: 'flex', flexDirection: 'column', gap: 10 },
  progressBar: { backgroundColor: '#e5e7eb', borderRadius: 99, height: 6, overflow: 'hidden' },
  progressFill: { backgroundColor: '#6366f1', height: '100%', borderRadius: 99, transition: 'width 0.5s' },
  goalMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  goalMin: { fontSize: 13, color: '#9ca3af' },
  continueBtn: { backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: '20px 20px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' },
  statBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '16px 16px 0 0' },
  statIcon: { fontSize: 22, display: 'block', marginBottom: 10 },
  statLabel: { margin: '0 0 6px', fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: 1 },
  statNumber: { margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: '#1e1b4b' },
  statSub: { margin: 0, fontSize: 12, color: '#9ca3af' },
  insightCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  insightHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  insightTitle: { fontWeight: 600, fontSize: 15, color: '#374151' },
  insightBody: { borderLeft: '3px solid #6366f1', paddingLeft: 16 },
  insightText: { margin: 0, color: '#4b5563', fontSize: 14, lineHeight: 1.6 },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: '#1e1b4b' },
  cardSubtitle: { margin: '0 0 20px', fontSize: 13, color: '#9ca3af' },
  barChart: { display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, paddingTop: 10 },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 6 },
  barWrapper: { display: 'flex', alignItems: 'flex-end', height: 120 },
  bar: { width: '100%', minWidth: 20, borderRadius: '4px 4px 0 0', transition: 'height 0.4s' },
  barLabel: { fontSize: 11, color: '#9ca3af' },
  subjectList: { display: 'flex', flexDirection: 'column', gap: 14 },
  subjectRow: { display: 'flex', alignItems: 'center', gap: 10 },
  subjectBadge: { color: '#fff', borderRadius: 8, padding: '2px 10px', fontSize: 12, fontWeight: 600, minWidth: 64, textAlign: 'center' },
  subjectBarBg: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 99, height: 8, overflow: 'hidden' },
  subjectBarFill: { height: '100%', borderRadius: 99, transition: 'width 0.5s' },
  subjectCount: { fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 20, textAlign: 'right' },
};