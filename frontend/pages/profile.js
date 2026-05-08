import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [preferredSubjects, setPreferredSubjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [activeUser, setActiveUser] = useState(null);

  const subjectOptions = ['Math', 'Science', 'History', 'English', 'Filipino'];

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Load active user from localStorage on mount
  useEffect(() => {
    fetchUsers();
    const saved = localStorage.getItem('brainbytes_active_user');
    if (saved) setActiveUser(JSON.parse(saved));
  }, []);

  const toggleSubject = (sub) => {
    if (preferredSubjects.includes(sub)) {
      setPreferredSubjects(preferredSubjects.filter(s => s !== sub));
    } else {
      setPreferredSubjects([...preferredSubjects, sub]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axios.put('http://localhost:3000/api/users/' + editingId, {
          name, email, preferredSubjects
        });
        // Update active user if editing the active one
        if (activeUser && activeUser._id === editingId) {
          localStorage.setItem('brainbytes_active_user', JSON.stringify(res.data));
          setActiveUser(res.data);
        }
        setMessage('Profile updated successfully!');
      } else {
        await axios.post('http://localhost:3000/api/users', { name, email, preferredSubjects });
        setMessage('Profile created successfully!');
      }
      setName(''); setEmail(''); setPreferredSubjects([]); setEditingId(null);
      fetchUsers();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (user) => {
    setName(user.name); setEmail(user.email);
    setPreferredSubjects(user.preferredSubjects || []);
    setEditingId(user._id); setMessage('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await axios.delete('http://localhost:3000/api/users/' + id);
      if (activeUser && activeUser._id === id) {
        localStorage.removeItem('brainbytes_active_user');
        setActiveUser(null);
      }
      setMessage('Profile deleted');
      fetchUsers();
    } catch (err) {
      setMessage('Error deleting: ' + err.message);
    }
  };

  // Set active user - this connects to chat page
  const handleSetActive = (user) => {
    localStorage.setItem('brainbytes_active_user', JSON.stringify(user));
    setActiveUser(user);
    setMessage('Active user set to ' + user.name + '! Your preferred subjects will be applied in the chat.');
  };

  const handleLogout = () => {
    localStorage.removeItem('brainbytes_active_user');
    setActiveUser(null);
    setMessage('Logged out successfully.');
  };

  const handleCancel = () => {
    setName(''); setEmail(''); setPreferredSubjects([]); setEditingId(null); setMessage('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Nunito, sans-serif' }}>
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #2196f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#666', textDecoration: 'none' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#2196f3', textDecoration: 'none', fontWeight: 'bold' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#666', textDecoration: 'none' }}>Dashboard</a></Link>
      </nav>

      <h1 style={{ color: '#333' }}>User Profile</h1>

      {/* Active User Banner */}
      {activeUser && (
        <div style={{
          padding: '15px 20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '2px solid #2196f3'
        }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1565c0' }}>
              👤 Active User: {activeUser.name}
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
              Preferred subjects: {activeUser.preferredSubjects?.join(', ') || 'None set'}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
              These subjects will be available as filters in the Chat page
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '8px 16px', backgroundColor: '#ef5350',
            color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'
          }}>Logout</button>
        </div>
      )}

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          borderRadius: '5px', marginBottom: '15px',
          color: message.includes('Error') ? '#c00' : '#060'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#f9f9f9', padding: '20px',
        borderRadius: '12px', marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>{editingId ? 'Edit Profile' : 'Create New Profile'}</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Preferred Subjects:</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {subjectOptions.map(sub => (
              <label key={sub} style={{
                padding: '6px 12px',
                backgroundColor: preferredSubjects.includes(sub) ? '#2196f3' : '#fff',
                color: preferredSubjects.includes(sub) ? 'white' : '#333',
                border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer'
              }}>
                <input type="checkbox" checked={preferredSubjects.includes(sub)}
                  onChange={() => toggleSubject(sub)} style={{ display: 'none' }} />
                {sub}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" style={{
          padding: '10px 24px', backgroundColor: '#2196f3', color: 'white',
          border: 'none', borderRadius: '5px', cursor: 'pointer',
          fontWeight: 'bold', marginRight: '10px'
        }}>
          {editingId ? 'Update' : 'Create'}
        </button>
        {editingId && (
          <button type="button" onClick={handleCancel} style={{
            padding: '10px 24px', backgroundColor: '#999', color: 'white',
            border: 'none', borderRadius: '5px', cursor: 'pointer'
          }}>Cancel</button>
        )}
      </form>

      <h3>Existing Profiles ({users.length})</h3>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
        💡 Click <strong>"Use this profile"</strong> to set your active user. Your preferred subjects will appear as quick filters in the Chat page!
      </p>

      {users.length === 0 ? (
        <p style={{ color: '#999' }}>No profiles yet. Create your first one!</p>
      ) : (
        <div>
          {users.map(user => (
            <div key={user._id} style={{
              padding: '15px', border: activeUser?._id === user._id ? '2px solid #2196f3' : '1px solid #ddd',
              borderRadius: '8px', marginBottom: '10px',
              backgroundColor: activeUser?._id === user._id ? '#e3f2fd' : '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                    {activeUser?._id === user._id && '✅ '}{user.name}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>{user.email}</div>
                  <div style={{ marginTop: '8px' }}>
                    <strong>Preferred Subjects:</strong> {user.preferredSubjects?.join(', ') || 'None'}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeUser?._id !== user._id ? (
                  <button onClick={() => handleSetActive(user)} style={{
                    padding: '6px 14px', backgroundColor: '#4caf50', color: 'white',
                    border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'
                  }}>Use this profile</button>
                ) : (
                  <span style={{ padding: '6px 14px', backgroundColor: '#e8f5e9', color: '#2e7d32',
                    borderRadius: '5px', fontSize: '13px', fontWeight: 'bold' }}>Currently Active</span>
                )}
                <button onClick={() => handleEdit(user)} style={{
                  padding: '6px 14px', backgroundColor: '#2196f3', color: 'white',
                  border: 'none', borderRadius: '5px', cursor: 'pointer'
                }}>Edit</button>
                <button onClick={() => handleDelete(user._id)} style={{
                  padding: '6px 14px', backgroundColor: '#dc3545', color: 'white',
                  border: 'none', borderRadius: '5px', cursor: 'pointer'
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
