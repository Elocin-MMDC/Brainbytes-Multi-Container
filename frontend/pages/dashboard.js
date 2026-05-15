import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ recentMessages: [], totalMessages: 0, subjectCounts: [] });
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);

  // Load active user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('brainbytes_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      setActiveUser(user);
    }
  }, []);

  const fetchDashboard = async (user) => {
    try {
      const url = user?._id
        ? `http://localhost:3000/api/dashboard/recent?userId=${user._id}`
        : 'http://localhost:3000/api/dashboard/recent';
      const res = await axios.get(url);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('brainbytes_active_user');
    if (saved) {
      const user = JSON.parse(saved);
      setActiveUser(user);
      fetchDashboard(user);
    } else {
      fetchDashboard(null);
    }
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Nunito, sans-serif' }}>
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #2196f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#666', textDecoration: 'none' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#666', textDecoration: 'none' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 'bold' }}>Dashboard</a></Link>
      </nav>

      <h1 style={{ color: '#333' }}>Learning Activity Dashboard</h1>

      {/* Active User Info */}
      {activeUser && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #a5d6a7'
        }}>
          <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>👤 {activeUser.name}</span>
          <span style={{ fontSize: '13px', color: '#555', marginLeft: '10px' }}>— Showing your personal learning activity</span>
        </div>
      )}

      {!activeUser && (
        <div style={{
          padding: '10px 15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffcc80',
          fontSize: '13px',
          color: '#e65100'
        }}>
          💡 No active profile — showing all activity. <Link href="/profile"><a style={{ color: '#2196f3' }}>Set up your profile</a></Link> to see your personal dashboard!
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1, minWidth: '200px', padding: '20px',
              backgroundColor: '#2196f3', color: 'white',
              borderRadius: '12px', textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Conversations</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{data.totalMessages}</div>
            </div>
            {data.subjectCounts.map(sc => (
              <div key={sc._id} style={{
                flex: 1, minWidth: '150px', padding: '20px',
                backgroundColor: '#fff', border: '2px solid #2196f3',
                borderRadius: '12px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>{sc._id}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>{sc.count}</div>
              </div>
            ))}
          </div>

          <h2>Recent Learning Activity</h2>
          {data.recentMessages.length === 0 ? (
            <p style={{ color: '#999' }}>No activity yet. Start chatting to see your learning history!</p>
          ) : (
            <div>
              {data.recentMessages.map(msg => (
                <div key={msg._id} style={{
                  padding: '15px', marginBottom: '10px',
                  border: '1px solid #ddd', borderRadius: '12px',
                  backgroundColor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 10px', backgroundColor: '#2196f3',
                      color: 'white', borderRadius: '12px', fontSize: '12px'
                    }}>{msg.subject || 'General'}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Q:</strong> {msg.text}
                  </div>
                  <div style={{ color: '#444' }}>
                    <strong>A:</strong> {msg.response}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '8px', color: '#888' }}>
                    Type: {msg.questionType || 'general'} | Sentiment: {msg.sentiment || 'neutral'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}