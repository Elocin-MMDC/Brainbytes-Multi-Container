import axios from 'axios';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');

  const subjects = ['All', 'Math', 'Science', 'History', 'English', 'Filipino', 'General'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = newMessage;
    setNewMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/ai/chat', {
        message: userMsg,
        subject: selectedSubject
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        text: response.data.aiResponse,
        subject: response.data.subject,
        questionType: response.data.questionType,
        sentiment: response.data.sentiment
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Sorry, I could not process that.'
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#666', textDecoration: 'none' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#666', textDecoration: 'none' }}>Dashboard</a></Link>
      </nav>

      <h1 style={{ color: '#0070f3' }}>BrainBytes AI Chat</h1>

      {/* Subject Filter */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Subject:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '5px', border: '1px solid #ddd' }}
        >
          {subjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>

      {/* Chat area */}
      <div style={{
        minHeight: '400px',
        maxHeight: '500px',
        overflowY: 'auto',
        marginBottom: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: '#fafafa'
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#999', textAlign: 'center' }}>Start a conversation! Try "What is algebra?" or "Explain photosynthesis"</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.role === 'user' ? 'right' : 'left',
            margin: '10px 0'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#0070f3' : '#fff',
              color: msg.role === 'user' ? 'white' : 'black',
              maxWidth: '75%',
              border: msg.role === 'ai' ? '1px solid #ddd' : 'none',
              textAlign: 'left'
            }}>
              {msg.text}
              {msg.role === 'ai' && msg.subject && (
                <div style={{ fontSize: '11px', marginTop: '6px', color: '#888' }}>
                  Subject: {msg.subject} | Type: {msg.questionType} | Sentiment: {msg.sentiment}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p style={{ color: '#999' }}>AI is thinking...</p>}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask BrainBytes something..."
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
        />
        <button type="submit" style={{
          padding: '10px 24px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Send
        </button>
      </form>
    </div>
  );
}
