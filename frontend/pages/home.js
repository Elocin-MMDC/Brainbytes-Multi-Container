import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../Navbar';

const TIPS = [
  "A 25-minute focused study burst followed by a 5-minute break (the Pomodoro Technique) is more effective than hours of distracted reading. Try one round before your next quiz!",
  "Explaining a concept out loud — even to yourself — is one of the best ways to check if you truly understand it. Try teaching BrainBytes what you just learned!",
  "Reviewing notes within 24 hours of learning something can boost retention by up to 60%. Try asking BrainBytes to quiz you on yesterday's topic!",
  "Breaking a big topic into smaller questions makes it easier to understand. Instead of 'study Math,' try asking 'What is a quadratic equation?'",
  "Staying hydrated improves focus and memory. Keep a glass of water nearby while you study!",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [tip, setTip] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const userData = localStorage.getItem('bb_user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    const savedPhoto = localStorage.getItem(`bb_photo_${parsed.id}`);
    if (savedPhoto) setPhoto(savedPhoto);
   // Random tip every time you open the page
setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  if (!user) return null;

  const cards = [
    {
      icon: '💬',
      title: 'Start a chat',
      desc: 'Ask any question — math, science, history, or general.',
      onClick: () => router.push('/chat'),
    },
    {
      icon: '📈',
      title: 'See your progress',
      desc: 'KPIs, weekly activity, subject breakdown, and study tips.',
      onClick: () => router.push('/dashboard'),
    },
    {
      icon: '⚙️',
      title: 'Personalize',
      desc: 'Pick your avatar, study time target, and personal goals.',
      onClick: () => router.push('/profile'),
    },
  ];

  return (
    <div style={s.page}>
      <Navbar activePage="home" />

      <div style={s.container}>
        {/* Hero */}
        <div style={s.hero}>
          {photo
            ? <img src={photo} alt="avatar" style={s.heroAvatar} />
            : <div style={s.heroEmoji}>🦄</div>
          }
          <h1 style={s.greeting}>{getGreeting()}, {user.name}!</h1>
          <p style={s.subgreeting}>What would you like to learn today?</p>
        </div>

        {/* Feature Cards */}
        <div style={s.cardsGrid}>
          {cards.map((card, i) => (
            <div key={i} style={s.card} onClick={card.onClick}>
              <span style={s.cardIcon}>{card.icon}</span>
              <h3 style={s.cardTitle}>{card.title}</h3>
              <p style={s.cardDesc}>{card.desc}</p>
            </div>
          ))}
        </div>

        {/* Today's Tip */}
        <div style={s.tipCard}>
          <h3 style={s.tipTitle}>Today's tip 💡</h3>
          <p style={s.tipText}>{tip}</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9ff', fontFamily: "'Segoe UI', Arial, sans-serif" },
  container: { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  hero: { textAlign: 'center', marginBottom: 48 },
  heroAvatar: { width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1', marginBottom: 16 },
  heroEmoji: { fontSize: 64, marginBottom: 16 },
  greeting: { margin: '0 0 8px', fontSize: 32, fontWeight: 700, color: '#1e1b4b' },
  subgreeting: { margin: 0, color: '#6b7280', fontSize: 16 },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: '28px 24px',
    border: '1px solid #e5e7eb', cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardIcon: { fontSize: 28, display: 'block', marginBottom: 12 },
  cardTitle: { margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#1e1b4b' },
  cardDesc: { margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 },
  tipCard: { backgroundColor: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  tipTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e1b4b' },
  tipText: { margin: 0, color: '#4b5563', fontSize: 15, lineHeight: 1.7 },
};