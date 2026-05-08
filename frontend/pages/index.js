import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeUser, setActiveUser] = useState(null);
  const messageEndRef = useRef(null);

  const subjects = ['All', 'Math', 'Science', 'History', 'English', 'Filipino', 'General'];

  // Load active user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('brainbytes_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      setActiveUser(user);
    }
  }, []);

  // Fetch messages from the API
  const fetchMessages = async () => {
    try {
      const url = selectedSubject !== 'All'
        ? `http://localhost:3000/api/messages?subject=${selectedSubject}`
        : 'http://localhost:3000/api/messages';
      const response = await axios.get(url);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  // Submit a new message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsTyping(true);
      const userMsg = newMessage;
      setNewMessage('');

      const tempUserMsg = {
        _id: Date.now().toString(),
        text: userMsg,
        isUser: true,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      const response = await axios.post('http://localhost:3000/api/ai/chat', {
        message: userMsg,
        subject: selectedSubject
      });

      const aiMsg = {
        _id: Date.now().toString() + '_ai',
        text: response.data.aiResponse,
        isUser: false,
        subject: response.data.subject,
        questionType: response.data.questionType,
        sentiment: response.data.sentiment,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error posting message:', error);
      setMessages(prev => [...prev, {
        _id: Date.now().toString(),
        text: "Sorry, I couldn't process your request. Please try again later.",
        isUser: false,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, [selectedSubject]);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Nunito, sans-serif' }}>
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #2196f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 'bold' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#666', textDecoration: 'none' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#666', textDecoration: 'none' }}>Dashboard</a></Link>
      </nav>

      {/* Active User Banner */}
      {activeUser && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #a5d6a7'
        }}>
          <div>
            <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>👤 {activeUser.name}</span>
            {activeUser.preferredSubjects?.length > 0 && (
              <span style={{ fontSize: '13px', color: '#555', marginLeft: '10px' }}>
                Preferred: {activeUser.preferredSubjects.join(', ')}
              </span>
            )}
          </div>
          <Link href="/profile">
            <a style={{ fontSize: '12px', color: '#2196f3', textDecoration: 'none' }}>Switch Profile</a>
          </Link>
        </div>
      )}

      {!activeUser && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #ffcc80',
          fontSize: '13px',
          color: '#e65100'
        }}>
          💡 No active profile. <Link href="/profile"><a style={{ color: '#2196f3' }}>Set up your profile</a></Link> to personalize your learning experience!
        </div>
      )}

      <h1 style={{ textAlign: 'center', color: '#333' }}>BrainBytes AI Tutor</h1>

      {/* Subject Filter */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 'bold' }}>Filter by Subject:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
        >
          {subjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>

        {/* Quick subject buttons from user's preferred subjects */}
        {activeUser?.preferredSubjects?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#888', alignSelf: 'center' }}>Quick:</span>
            {activeUser.preferredSubjects.map(sub => (
              <button key={sub} onClick={() => setSelectedSubject(sub)} style={{
                padding: '4px 10px',
                backgroundColor: selectedSubject === sub ? '#2196f3' : '#e3f2fd',
                color: selectedSubject === sub ? 'white' : '#2196f3',
                border: '1px solid #2196f3',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '12px'
              }}>{sub}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        border: '1px solid #ddd', borderRadius: '12px',
        height: '500px', overflowY: 'auto', padding: '16px',
        marginBottom: '20px', backgroundColor: '#f9f9f9',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading conversation history...</p>
          </div>
        ) : (
          <div>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3>Welcome{activeUser ? ', ' + activeUser.name : ''} to BrainBytes AI Tutor!</h3>
                <p>Ask me any question about math, science, history, English, or Filipino.</p>
                <p style={{ fontSize: '13px', color: '#666' }}>Try: "What is algebra?", "Explain photosynthesis", or "Give me an example of a noun"</p>
              </div>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {messages.map((message) => {
                  const isUser = message.isUser !== undefined ? message.isUser : !message.response;
                  if (message.text && message.response) {
                    return (
                      <div key={message._id}>
                        <li style={{
                          padding: '12px 16px', margin: '8px 0',
                          backgroundColor: '#e3f2fd', color: '#333',
                          borderRadius: '12px', maxWidth: '80%',
                          marginLeft: 'auto', marginRight: '0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                          <div>{message.text}</div>
                          <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
                            {activeUser ? activeUser.name : 'You'} • {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </li>
                        <li style={{
                          padding: '12px 16px', margin: '8px 0',
                          backgroundColor: '#e8f5e9', color: '#333',
                          borderRadius: '12px', maxWidth: '80%',
                          marginLeft: '0', marginRight: 'auto',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                          <div>{message.response}</div>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                            Subject: {message.subject} | Type: {message.questionType} | Sentiment: {message.sentiment}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            AI Tutor • {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </li>
                      </div>
                    );
                  }
                  return (
                    <li key={message._id} style={{
                      padding: '12px 16px', margin: '8px 0',
                      backgroundColor: isUser ? '#e3f2fd' : '#e8f5e9',
                      color: '#333', borderRadius: '12px',
                      maxWidth: '80%', wordBreak: 'break-word',
                      marginLeft: isUser ? 'auto' : '0',
                      marginRight: isUser ? '0' : 'auto',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ lineHeight: '1.5' }}>{message.text}</div>
                      {!isUser && message.subject && (
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                          Subject: {message.subject} | Type: {message.questionType} | Sentiment: {message.sentiment}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#666', textAlign: isUser ? 'right' : 'left' }}>
                        {isUser ? (activeUser ? activeUser.name : 'You') : 'AI Tutor'} • {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </li>
                  );
                })}
                {isTyping && (
                  <li style={{
                    padding: '12px 16px', margin: '8px 0',
                    backgroundColor: '#e8f5e9', color: '#333',
                    borderRadius: '12px', maxWidth: '80%',
                    marginLeft: '0', marginRight: 'auto',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <div>AI tutor is typing...</div>
                  </li>
                )}
                <div ref={messageEndRef} />
              </ul>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ask a question..."
          style={{
            flex: '1', padding: '14px 16px',
            borderRadius: '12px 0 0 12px', border: '1px solid #ddd',
            fontSize: '16px', outline: 'none'
          }}
          disabled={isTyping}
        />
        <button type="submit" style={{
          padding: '14px 24px',
          backgroundColor: isTyping ? '#90caf9' : '#2196f3',
          color: 'white', border: 'none',
          borderRadius: '0 12px 12px 0', fontSize: '16px',
          cursor: isTyping ? 'not-allowed' : 'pointer'
        }}
          disabled={isTyping}
        >
          {isTyping ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
