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

  const subjectOptions = ['Math', 'Science', 'History', 'English', 'Filipino'];

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
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
        await axios.put('http://localhost:3000/api/users/' + editingId, {
          name, email, preferredSubjects
        });
        setMessage('Profile updated successfully!');
      } else {
        await axios.post('http://localhost:3000/api/users', {
          name, email, preferredSubjects
        });
        setMessage('Profile created successfully!');
      }
      setName('');
      setEmail('');
      setPreferredSubjects([]);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (user) => {
    setName(user.name);
    setEmail(user.email);
    setPreferredSubjects(user.preferredSubjects || []);
    setEditingId(user._id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    try {
      await axios.delete('http://localhost:3000/api/users/' + id);
      setMessage('Profile deleted');
      fetchUsers();
    } catch (err) {
      setMessage('Error deleting: ' + err.message);
    }
  };

  const handleCancel = () => {
    setName('');
    setEmail('');
    setPreferredSubjects([]);
    setEditingId(null);
    setMessage('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid #0070f3', paddingBottom: '10px' }}>
        <Link href="/"><a style={{ color: '#666', textDecoration: 'none' }}>Chat</a></Link>
        <Link href="/profile"><a style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>Profile</a></Link>
        <Link href="/dashboard"><a style={{ color: '#666', textDecoration: 'none' }}>Dashboard</a></Link>
      </nav>

      <h1 style={{ color: '#0070f3' }}>User Profile</h1>

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          borderRadius: '5px',
          marginBottom: '15px',
          color: message.includes('Error') ? '#c00' : '#060'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>{editingId ? 'Edit Profile' : 'Create New Profile'}</h3>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Preferred Subjects:</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {subjectOptions.map(sub => (
              <label key={sub} style={{
                padding: '6px 12px',
                backgroundColor: preferredSubjects.includes(sub) ? '#0070f3' : '#fff',
                color: preferredSubjects.includes(sub) ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '20px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={preferredSubjects.includes(sub)}
                  onChange={() => toggleSubject(sub)}
                  style={{ display: 'none' }}
                />
                {sub}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" style={{
          padding: '10px 24px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          marginRight: '10px'
        }}>
          {editingId ? 'Update' : 'Create'}
        </button>
        {editingId && (
          <button type="button" onClick={handleCancel} style={{
            padding: '10px 24px',
            backgroundColor: '#999',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Cancel
          </button>
        )}
      </form>

      <h3>Existing Profiles ({users.length})</h3>
      {users.length === 0 ? (
        <p style={{ color: '#999' }}>No profiles yet. Create your first one!</p>
      ) : (
        <div>
          {users.map(user => (
            <div key={user._id} style={{
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '10px',
              backgroundColor: '#fff'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.name}</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{user.email}</div>
              <div style={{ marginTop: '8px' }}>
                <strong>Preferred:</strong> {user.preferredSubjects?.join(', ') || 'None'}
              </div>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleEdit(user)} style={{
                  padding: '6px 14px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}>Edit</button>
                <button onClick={() => handleDelete(user._id)} style={{
                  padding: '6px 14px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
