import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Shield, Users, ArrowLeft, Edit2, Trash2, Sun, Moon } from 'lucide-react';
import API_BASE_URL from '../config';

const AdminPanel = ({ user, theme, toggleTheme }) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    username: '',
    email: '',
    password: '',
    role: 'US',
    team: '',
    access_team: ''
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddOrEditUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/users/${formData.user_id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowAddUser(false);
      setIsEditing(false);
      fetchUsers();
      setFormData({ user_id: '', username: '', email: '', password: '', role: 'US', team: '', access_team: '' });
    } catch (err) {
      alert(`Error ${isEditing ? 'updating' : 'adding'} user: ` + (err.response?.data?.message || err.message));
    }
  };

  const startEdit = (u) => {
    setFormData({
      user_id: u.user_id,
      username: u.username,
      email: u.email,
      password: '', // Don't show password
      role: u.role,
      team: u.team || '',
      access_team: u.access_team || ''
    });
    setIsEditing(true);
    setShowAddUser(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm(`Are you sure you want to delete user ${userId}? All their timesheets will also be deleted.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => window.location.href = '/dashboard'} className="btn" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage users and permissions</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="theme-toggle" onClick={toggleTheme}>
            <div className="theme-toggle-icons">
              <Moon size={14} />
              <Sun size={14} />
            </div>
            <div className="theme-toggle-slider">
              {theme === 'dark' ? <Moon size={12} color="white" /> : <Sun size={12} color="white" />}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAddUser(true); setIsEditing(false); setFormData({ user_id: '', username: '', email: '', password: '', role: 'US', team: '', access_team: '' }); }}>
            <UserPlus size={20} /> Add User
          </button>
        </div>
      </header>

      {showAddUser && (
        <div className="glass-card animate-in" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>{isEditing ? 'Edit User' : 'Add New User'}</h2>
          <form onSubmit={handleAddOrEditUser} className="grid">
            <div className="grid-cols-2 grid">
              <div>
                <label>User ID</label>
                <input value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} required disabled={isEditing} />
              </div>
              <div>
                <label>Username</label>
                <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
              </div>
            </div>
            <div className="grid-cols-2 grid">
              <div>
                <label>Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              <div>
                <label>Password {isEditing && '(Leave blank to keep current)'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!isEditing} />
              </div>
            </div>
            <div className="grid-cols-2 grid">
              <div>
                <label>Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="US">User (US)</option>
                  <option value="TL">Team Lead (TL)</option>
                  <option value="MG">Manager (MG)</option>
                  <option value="AD">Admin (AD)</option>
                </select>
              </div>
              <div>
                <label>Team</label>
                <input value={formData.team} onChange={(e) => setFormData({ ...formData, team: e.target.value })} placeholder="e.g. Apollo" />
              </div>
            </div>
            <div>
              <label>Access Team (For Managers/TLs)</label>
              <input value={formData.access_team} onChange={(e) => setFormData({ ...formData, access_team: e.target.value })} placeholder="Team they can view" />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">{isEditing ? 'Update User' : 'Create User'}</button>
              <button type="button" onClick={() => { setShowAddUser(false); setIsEditing(false); }} className="btn">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>System Users</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Access Team</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600 }}>{u.user_id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.team || '-'}</td>
                  <td>{u.access_team || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => startEdit(u)} className="btn" style={{ padding: '0.4rem', color: 'var(--primary)' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.user_id)} className="btn" style={{ padding: '0.4rem', color: 'var(--danger)' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
