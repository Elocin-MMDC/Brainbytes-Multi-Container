import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Navbar({ activePage }) {
  const router = useRouter();
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('bb_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      const savedPhoto = localStorage.getItem(`bb_photo_${parsed.id}`);
      if (savedPhoto) setPhoto(savedPhoto);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    router.push('/login');
  };

  const links = [
    { label: 'Home', path: '/home', key: 'home' },
    { label: 'Chat', path: '/chat', key: 'chat' },
    { label: 'Dashboard', path: '/dashboard', key: 'dashboard' },
    { label: 'Profile', path: '/profile', key: 'profile' },
  ];

  return (
    <nav style={s.nav}>
      <div style={s.brand} onClick={() => router.push('/home')}>
        <span style={s.emoji}>🧠</span>
        <span style={s.logo}>BrainBytes</span>
      </div>
      <div style={s.links}>
        {links.map((link) => (
          <span
            key={link.key}
            style={activePage === link.key ? s.linkActive : s.link}
            onClick={() => router.push(link.path)}
          >
            {link.label}
          </span>
        ))}
        {photo
          ? <img src={photo} alt="avatar" style={s.avatar} onClick={() => router.push('/profile')} />
          : <div style={s.avatarPlaceholder} onClick={() => router.push('/profile')}>👤</div>
        }
        
      </div>
    </nav>
  );
}

const s = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 40px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  emoji: { fontSize: 22 },
  logo: { fontWeight: 700, fontSize: 20, color: '#1e1b4b' },
  links: { display: 'flex', alignItems: 'center', gap: 24 },
  link: { cursor: 'pointer', fontSize: 14, color: '#6b7280', fontWeight: 500 },
  linkActive: { cursor: 'pointer', fontSize: 14, color: '#fff', fontWeight: 600, backgroundColor: '#6366f1', padding: '6px 16px', borderRadius: 20 },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #6366f1' },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: '50%', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 },
  logoutBtn: { padding: '8px 18px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
};