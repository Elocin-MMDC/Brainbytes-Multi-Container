import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';

const API = 'http://localhost:3000';

export default function Chat() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const bottomRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('bb_token');
    const userData = localStorage.getItem('bb_user');
    if (!token || !userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    setUser(parsed);
    fetchSessions(parsed.id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (editingId && editRef.current) editRef.current.focus();
  }, [editingId]);

  const fetchSessions = async (userId) => {
    try {
      const res = await fetch(`${API}/api/sessions?userId=${userId}`);
      const data = await res.json();
      if (data.sessions?.length > 0) {
        setSessions(data.sessions);
        // Auto-select the most recent session
        setActiveId(data.sessions[0]._id);
        fetchMessages(data.sessions[0]._id, userId);
      }
    } catch (_) {}
  };

  const fetchMessages = async (sessionId, userId) => {
    try {
      const uid = userId || user?.id;
      const res = await fetch(`${API}/api/sessions/${sessionId}/messages?userId=${uid}`);
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        const mapped = [];
        data.messages.forEach((msg) => {
          mapped.push({ text: msg.text, isUser: true, time: msg.createdAt });
          if (msg.response) {
            mapped.push({ text: msg.response, isUser: false, subject: msg.subject, time: msg.createdAt });
          }
        });
        setMessages(mapped);
      }
    } catch (_) {}
  };

  const switchSession = (sessionId) => {
    setActiveId(sessionId);
    fetchMessages(sessionId);
  };

  const createNewSession = () => {
    setActiveId(null);
    setMessages([]);
    setInput('');
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    const now = new Date().toISOString();

    setMessages((prev) => [...prev, { text: userMsg, isUser: true, time: now }]);

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          userId: user.id,
          userName: user.name,
          sessionId: activeId || undefined,
        }),
      });
      const data = await res.json();

      // If new session, update activeId and refresh sessions
      if (!activeId && data.sessionId) {
        setActiveId(data.sessionId);
        await fetchSessions(user.id);
      } else {
        // Refresh session list to update message count
        fetchSessions(user.id);
      }

      setMessages((prev) => [...prev, {
        text: data.aiResponse,
        isUser: false,
        subject: data.subject,
        time: new Date().toISOString(),
      }]);
    } catch (_) {
      setMessages((prev) => [...prev, { text: 'Error connecting to server.', isUser: false, time: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (e, session) => {
    e.stopPropagation();
    setEditingId(session._id);
    setEditTitle(session.title || session.firstMessage?.slice(0, 30) || 'Chat');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await fetch(`${API}/api/sessions/${editingId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, userId: user.id }),
      });
      setSessions(prev => prev.map(s =>
        s._id === editingId ? { ...s, title: editTitle } : s
      ));
    } catch (_) {}
    setEditingId(null);
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSessionTitle = (session) => {
    return session.title || session.firstMessage?.slice(0, 25) || 'New Chat';
  };

  if (!user) return null;

  const activeSession = sessions.find(s => s._id === activeId);

  return (
    <div style={s.page}>
      <Navbar activePage="chat" />
      <div style={s.layout}>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={s.sidebar}>
            <div style={s.sidebarHeader}>
              <span style={s.sidebarTitle}>Chats</span>
              <button style={s.newBtn} onClick={createNewSession}>+ New</button>
            </div>
            <div style={s.sessionList}>
              {sessions.map(session => (
                <div
                  key={session._id}
                  style={{ ...s.sessionItem, ...(activeId === session._id ? s.sessionItemActive : {}) }}
                  onClick={() => switchSession(session._id)}
                >
                  {editingId === session._id ? (
                    <input
                      ref={editRef}
                      style={s.editInput}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div style={s.sessionTitle}>{getSessionTitle(session)}</div>
                      <div style={s.sessionMeta}>{session.messageCount} Q · just now</div>
                    </>
                  )}
                  <button style={s.editBtn} onClick={(e) => startEdit(e, session)} title="Rename session">✏️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main */}
        <div style={s.main}>
          <div style={s.chatHeader}>
            <button style={s.hideBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
              ✕ {sidebarOpen ? 'Hide' : 'Show'}
            </button>
            {activeSession && (
              <span style={s.chatTitle}>{getSessionTitle(activeSession)} ✏️</span>
            )}
          </div>

          <div style={s.chatBox}>
            {messages.length === 0 && (
              <div style={s.empty}>
                <div style={s.emptyIcon}>💬</div>
                <p style={s.emptyTitle}>Start chatting</p>
                <p style={s.emptySubtitle}>
                  Type a question below. Try{' '}
                  <em>"Who is Jose Rizal?"</em>,{' '}
                  <em>"what is 5 + 10?"</em>, or{' '}
                  <em>"convert 10 km to miles"</em>.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={msg.isUser ? s.userRow : s.aiRow}>
                <div style={msg.isUser ? s.userBubble : s.aiBubble}>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{msg.text}</p>
                  <div style={s.msgMeta}>
                    <span style={s.msgSender}>{msg.isUser ? 'You' : 'AI Tutor'}</span>
                    <span style={s.dot}>·</span>
                    <span style={s.msgTime}>{formatTime(msg.time)}</span>
                    {!msg.isUser && msg.subject && (
                      <span style={s.subjectTag}>{msg.subject}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={s.aiRow}>
                <div style={s.aiBubble}>
                  <p style={{ margin: 0, color: '#9ca3af' }}>Thinking...</p>
                  <div style={s.msgMeta}><span style={s.msgSender}>AI Tutor</span></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={s.inputArea}>
            <input
              style={s.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask a question..."
            />
            <button
              style={{ ...s.sendBtn, backgroundColor: input.trim() ? '#6366f1' : '#9ca3af' }}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', backgroundColor: '#f8f9ff', fontFamily: "'Segoe UI', Arial, sans-serif" },
  layout: { display: 'flex', height: 'calc(100vh - 65px)' },
  sidebar: { width: 260, backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '16px 12px' },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sidebarTitle: { fontWeight: 700, fontSize: 17, color: '#1e1b4b' },
  newBtn: { backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  sessionList: { display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' },
  sessionItem: { position: 'relative', borderRadius: 10, padding: '10px 36px 10px 12px', cursor: 'pointer', border: '1px solid transparent' },
  sessionItemActive: { backgroundColor: '#f8f9ff', border: '1px solid #e5e7eb' },
  sessionTitle: { fontSize: 14, fontWeight: 600, color: '#1e1b4b', marginBottom: 3 },
  sessionMeta: { fontSize: 12, color: '#9ca3af' },
  editBtn: { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.6 },
  editInput: { width: '100%', fontSize: 13, border: '1px solid #6366f1', borderRadius: 6, padding: '4px 8px', outline: 'none', fontFamily: 'inherit' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' },
  hideBtn: { backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#374151' },
  chatTitle: { fontWeight: 600, fontSize: 16, color: '#1e1b4b' },
  chatBox: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column' },
  empty: { margin: 'auto', textAlign: 'center', maxWidth: 360 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontWeight: 700, fontSize: 20, color: '#1e1b4b', margin: '0 0 10px' },
  emptySubtitle: { color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: 0 },
  userRow: { display: 'flex', justifyContent: 'flex-end', marginBottom: 12 },
  aiRow: { display: 'flex', justifyContent: 'flex-start', marginBottom: 12 },
  userBubble: { backgroundColor: '#ede9fe', color: '#1e1b4b', borderRadius: '16px 16px 4px 16px', padding: '12px 16px', maxWidth: '65%' },
  aiBubble: { backgroundColor: '#fff', color: '#1e1b4b', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', maxWidth: '70%', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  msgMeta: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' },
  msgSender: { fontSize: 11, color: '#9ca3af', fontWeight: 600 },
  dot: { fontSize: 11, color: '#d1d5db' },
  msgTime: { fontSize: 11, color: '#9ca3af' },
  subjectTag: { backgroundColor: '#e0e7ff', color: '#6366f1', borderRadius: 8, padding: '1px 8px', fontSize: 11, fontWeight: 600 },
  inputArea: { display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' },
  input: { flex: 1, padding: '12px 18px', borderRadius: 12, border: '2px solid #e5e7eb', fontSize: 15, outline: 'none', fontFamily: 'inherit' },
  sendBtn: { padding: '12px 28px', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'background-color 0.2s' },
};