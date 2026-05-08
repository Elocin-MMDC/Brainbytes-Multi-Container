import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const messageEndRef = useRef(null);

  const subjects = ['All', 'Math', 'Science', 'History', 'English', 'Filipino', 'General'];

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
      
      // Optimistically add user message
      const tempUserMsg = {
        _id: Date.now().toString(),
        text: userMsg,
        isUser: true,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);
      
      // Call /api/ai/chat endpoint
      const response = await axios.post('http://localhost:3000/api/ai/chat', { 
        message: userMsg,
        subject: selectedSubject
      });
      
      // Add AI response
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
      {/* Navigation */}
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #2196f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 'bold' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#666', textDecoration: 'none' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#666', textDecoration: 'none' }}>Dashboard</a></Link>
      </nav>

      <h1 style={{ textAlign: 'center', color: '#333' }}>BrainBytes AI Tutor</h1>
      
      {/* Subject Filter */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
      </div>

      <div 
        style={{ 
          border: '1px solid #ddd', 
          borderRadius: '12px', 
          height: '500px', 
          overflowY: 'auto',
          padding: '16px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading conversation history...</p>
          </div>
        ) : (
          <div>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h3>Welcome to BrainBytes AI Tutor!</h3>
                <p>Ask me any question about math, science, history, English, or Filipino.</p>
                <p style={{ fontSize: '13px', color: '#666' }}>Try: "What is algebra?", "Explain photosynthesis", or "Give me an example of a noun"</p>
              </div>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {messages.map((message) => {
                  const isUser = message.isUser !== undefined ? message.isUser : !message.response;
                  // For database messages: show user question first, then AI response
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
                            You • {new Date(message.createdAt).toLocaleTimeString()}
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
                  // For optimistic temp messages
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
                        {isUser ? 'You' : 'AI Tutor'} • {new Date(message.createdAt).toLocaleTimeString()}
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
        <button 
          type="submit" 
          style={{
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