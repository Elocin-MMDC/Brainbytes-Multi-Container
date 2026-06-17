import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

const SUBJECTS = ['All', 'Math', 'Science', 'History', 'English', 'Filipino', 'General'];

export default function Chat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('All');
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const userData = localStorage.getItem('bb_user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchMessages(parsedUser.id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/messages?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        // Map DB messages — text = user question, response = AI answer
        const mapped = [];
        data.messages.slice().reverse().forEach((msg) => {
          mapped.push({ text: msg.text, isUser: true });
          mapped.push({
            text: msg.response,
            isUser: false,
            subject: msg.subject,
            questionType: msg.questionType,
            sentiment: msg.sentiment,
          });
        });
        setMessages(mapped);
      }
    } catch (_) {}
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { text: userMsg, isUser: true }]);

    try {
      const res = await fetch('http://localhost:3000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, subject, userId: user.id, userName: user.name }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.aiResponse,
          isUser: false,
          subject: data.subject,
          questionType: data.questionType,
          sentiment: data.sentiment,
        },
      ]);
    } catch (_) {
      setMessages((prev) => [...prev, { text: 'Error connecting to server.', isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_user');
    router.push('/login');
  };

  const filteredMessages =
    subject === 'All' ? messages : messages.filter((m) => m.subject === subject || m.isUser);

  if (!user) return null;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={s.navLogo}>🧠 BrainBytes</span>
        <div style={s.navLinks}>
          <span style={{ ...s.navLink, color: '#4f46e5', fontWeight: 700 }}>Chat</span>
          <span style={s.navLink} onClick={() => router.push('/profile')}>Profile</span>
          <span style={s.navLink} onClick={() => router.push('/dashboard')}>Dashboard</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.container}>
        <div style={s.banner}>
          👋 Welcome back, <strong>{user.name}</strong>!
        </div>

        <div style={s.filterRow}>
          <label style={s.filterLabel}>Filter by Subject:</label>
          <select style={s.select} value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((sub) => <option key={sub}>{sub}</option>)}
          </select>
        </div>

        <div style={s.chatBox}>
          {filteredMessages.length === 0 && (
            <div style={s.empty}>
              <p style={{ fontWeight: 700, fontSize: 18 }}>Welcome to BrainBytes AI Tutor!</p>
              <p style={{ color: '#6b7280' }}>Ask me anything about Math, Science, History, English, or Filipino.</p>
            </div>
          )}
          {filteredMessages.map((msg, i) => (
            <div key={i} style={msg.isUser ? s.userRow : s.aiRow}>
              <div style={msg.isUser ? s.userBubble : s.aiBubble}>
                <p style={{ margin: 0 }}>{msg.text}</p>
                {!msg.isUser && msg.subject && (
                  <div style={s.tags}>
                    <span style={s.tag}>{msg.subject}</span>
                    {msg.questionType && <span style={s.tag}>{msg.questionType}</span>}
                    {msg.sentiment && <span style={s.tag}>{msg.sentiment}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={s.aiRow}>
              <div style={s.aiBubble}>
                <p style={{ margin: 0, color: '#9ca3af' }}>Thinking...</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={s.inputRow}>
          <input
            style={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask a question..."
          />
          <button style={s.sendBtn} onClick={sendMessage} disabled={loading}>Send</button>
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
  container: { maxWidth: 800, margin: '0 auto', padding: '24px 16px' },
  banner: { backgroundColor: '#ede9fe', borderRadius: 10, padding: '12px 20px', marginBottom: 16, color: '#4f46e5', fontSize: 15 },
  filterRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  filterLabel: { fontWeight: 600, fontSize: 14, color: '#374151' },
  select: { padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 },
  chatBox: { backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', minHeight: 420, maxHeight: 500, overflowY: 'auto', padding: 20, marginBottom: 16 },
  empty: { textAlign: 'center', paddingTop: 80, color: '#374151' },
  // FIX: wrapper rows control alignment
  userRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: 12 },
  aiRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: 12 },
  userBubble: { backgroundColor: '#4f46e5', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', maxWidth: '70%' },
  aiBubble: { backgroundColor: '#f3f4f6', color: '#111827', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', maxWidth: '75%' },
  tags: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
  inputRow: { display: 'flex', gap: 10 },
  input: { flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 15, outline: 'none' },
  sendBtn: { padding: '12px 24px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 15 },
};