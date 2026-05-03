import axios from 'axios';
import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = newMessage;
    setNewMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/ai/chat', {
        message: userMsg
      });
      setMessages(prev => [...prev, {
        role: 'ai',
        text: response.data.aiResponse
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>BrainBytes AI Chat</h1>

      <div style={{
        minHeight: '400px',
        marginBottom: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.role === 'user' ? 'right' : 'left',
            margin: '10px 0'
          }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: msg.role === 'user' ? '#0070f3' : '#f0f0f0',
              color: msg.role === 'user' ? 'white' : 'black',
              maxWidth: '70%'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && <p style={{ color: '#999' }}>AI is thinking...</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask BrainBytes something..."
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }}
        />
        <button type="submit" style={{
          padding: '8px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Send
        </button>
      </form>
    </div>
  );
}