import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ recentMessages: [], totalMessages: 0, subjectCounts: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/dashboard/recent');
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#666', textDecoration: 'none' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#666', textDecoration: 'none' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>Dashboard</a></Link>
      </nav>

      <h1 style={{ color: '#0070f3' }}>Learning Activity Dashboard</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: '200px',
              padding: '20px',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Conversations</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{data.totalMessages}</div>
            </div>
            {data.subjectCounts.map(sc => (
              <div key={sc._id} style={{
                flex: 1,
                minWidth: '150px',
                padding: '20px',
                backgroundColor: '#fff',
                border: '2px solid #0070f3',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666' }}>{sc._id}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0070f3' }}>{sc.count}</div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <h2>Recent Learning Activity</h2>
          {data.recentMessages.length === 0 ? (
            <p style={{ color: '#999' }}>No activity yet. Start chatting to see your learning history!</p>
          ) : (
            <div>
              {data.recentMessages.map(msg => (
                <div key={msg._id} style={{
                  padding: '15px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      padding: '3px 10px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px'
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
