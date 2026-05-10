import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, LogOut, Clock, Calendar, BarChart3, Users, Briefcase, Edit2, Trash2, Sun, Moon, Timer, ArrowLeft, ExternalLink, Key, ShieldCheck, User, Ticket } from 'lucide-react';
import LogHoursModal from '../components/LogHoursModal';

const Dashboard = ({ user, setUser, theme, toggleTheme }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, team-stats
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [teamStats, setTeamStats] = useState([]);
  const [ticketDetails, setTicketDetails] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState(user.role === 'AD' ? 'All' : user.team);
  const [statusFilter, setStatusFilter] = useState('In progress');

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [cpData, setCpData] = useState({ userId: user.user_id, currentPassword: '', newPassword: '' });
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState('');

  // Default date range: Start of current month to today
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  const defaultEnd = now.toLocaleDateString('en-CA');

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/timesheets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimesheets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamStats = async () => {
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/team-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeamStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchTicketDetails = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/team-ticket-details/${ticket}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTicketDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  useEffect(() => {
    if (activeTab === 'team-stats' && !selectedTicket) {
      fetchTeamStats();
    }
  }, [activeTab, selectedTicket]);

  const filteredTimesheets = timesheets.filter(ts => {
    const tsDate = new Date(ts.TS_DATE).toLocaleDateString('en-CA');
    return tsDate >= startDate && tsDate <= endDate;
  });

  const totalHours = filteredTimesheets.reduce((acc, curr) => acc + parseFloat(curr.TS_EFFORT_HOURS || 0), 0);
  const ptoDays = filteredTimesheets.filter(t => t.TS_WORKING_STATUS === 'PTO').length;

  const handleLogout = () => {
    setUser(null);
  };

  const startEdit = (ts) => {
    setEditingEntry(ts);
    setShowModal(true);
  };

  const handleDeleteTimesheet = async (tsId) => {
    setDeleteConfirmId(tsId);
  };

  const confirmDelete = async () => {
    const tsId = deleteConfirmId;
    if (!tsId) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/timesheets/${tsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTimesheets();
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Error deleting entry: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/change-password', cpData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCpSuccess('Password updated successfully!');
      setTimeout(() => setShowChangePassword(false), 2000);
    } catch (err) {
      setCpError(err.response?.data?.message || 'Error updating password');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, var(--primary), #818cf8)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Timer color="white" size={24} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)' }}>
            Effort<span style={{ color: 'var(--primary)' }}>Tracker</span>
          </h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <button 
            className={`btn ${activeTab === 'dashboard' ? 'btn-active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSelectedTicket(null); }}
            style={{ justifyContent: 'flex-start', color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)', background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.1)' : 'transparent' }}
          >
            <BarChart3 size={20} /> My Dashboard
          </button>
          
          {user.access_team && (
            <button 
              className={`btn ${activeTab === 'team' ? 'btn-primary' : ''}`} 
              onClick={() => { setActiveTab('team'); setSelectedTicket(null); }}
              style={{ justifyContent: 'flex-start', color: activeTab === 'team' ? 'white' : 'var(--text-muted)', background: activeTab === 'team' ? 'var(--primary)' : 'transparent' }}
            >
              <Ticket size={20} /> Ticket Stats
            </button>
          )}

          {user.role === 'AD' && (
            <button className="btn" style={{ justifyContent: 'flex-start', color: 'var(--text-muted)' }} onClick={() => window.location.href = '/admin'}>
              <Briefcase size={20} /> Admin Panel
            </button>
          )}
        </nav>

        <button 
          className="btn" 
          onClick={() => { setShowChangePassword(true); setCpError(''); setCpSuccess(''); }}
          style={{ justifyContent: 'flex-start', color: 'var(--text-muted)', marginBottom: '0.5rem', background: 'rgba(99, 102, 241, 0.05)' }}
        >
          <Key size={20} /> Change Password
        </button>

        <div className="glass-card" style={{ padding: '1rem', marginTop: '0' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.username}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role} - {user.team}</p>
          <button
            onClick={handleLogout}
            className="btn"
            style={{ width: '100%', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', justifyContent: 'center' }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>
              {activeTab === 'dashboard' ? `Hello ${user.username}` : `Tickets Statistics`}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'dashboard' ? 'Track your daily progress and efforts' : `Aggregated data for teams: ${user.access_team}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            {activeTab === 'dashboard' && (
              <>
                <div>
                  <label style={{ marginBottom: '0.25rem' }}>From</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '0.5rem', width: '150px' }} />
                </div>
                <div>
                  <label style={{ marginBottom: '0.25rem' }}>To</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '0.5rem', width: '150px' }} />
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label style={{ marginBottom: '0.25rem' }}>Theme</label>
              <div className="theme-toggle" onClick={toggleTheme}>
                <div className="theme-toggle-slider">
                  {theme === 'dark' ? <Moon size={16} color="white" /> : <Sun size={16} color="white" />}
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={20} /> Log Hours
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* My Stats */}
            <div className="stat-grid">
              <div className="glass-card stat-card">
                <h3>Total Effort</h3>
                <p>{totalHours.toFixed(2)} hrs</p>
              </div>
              <div className="glass-card stat-card">
                <h3>Logged Entries</h3>
                <p>{filteredTimesheets.length}</p>
              </div>
              <div className="glass-card stat-card">
                <h3>PTO Count</h3>
                <p>{ptoDays} days</p>
              </div>
            </div>

            {/* My Timesheet */}
            <div className="glass-card" style={{ padding: '0' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Timesheet</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Activity</th>
                      <th>Jira</th>
                      <th>Effort</th>
                      <th>Team</th>
                      <th>Comments</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimesheets
                      .sort((a, b) => {
                        const dateA = new Date(a.TS_DATE);
                        const dateB = new Date(b.TS_DATE);
                        if (dateB - dateA !== 0) return dateB - dateA;
                        return new Date(b.TS_CREATED_AT) - new Date(a.TS_CREATED_AT);
                      })
                      .map((ts) => {
                        // Calculate daily total for this row's date
                        const dStr = new Date(ts.TS_DATE).toLocaleDateString('en-CA');
                        const dayTotal = timesheets
                          .filter(t => new Date(t.TS_DATE).toLocaleDateString('en-CA') === dStr && (t.TS_WORKING_STATUS === 'Working' || t.TS_WORKING_STATUS === 'General'))
                          .reduce((acc, curr) => acc + parseFloat(curr.TS_EFFORT_HOURS || 0), 0);

                        let rowBg = 'transparent';
                        let rowColor = 'inherit';
                        
                        if (ts.TS_WORKING_STATUS === 'PTO' || ts.TS_WORKING_STATUS === 'Holiday') {
                          rowBg = 'rgba(16, 185, 129, 0.1)';
                          rowColor = 'var(--success)';
                        } else if (dayTotal === 9) {
                          rowBg = 'rgba(16, 185, 129, 0.1)';
                          rowColor = 'var(--success)';
                        } else if (dayTotal > 9) {
                          rowBg = 'rgba(239, 68, 68, 0.1)';
                          rowColor = 'var(--danger)';
                        }

                        return (
                          <tr key={ts.TS_TIMESHEET_ID} style={{ background: rowBg, color: rowColor }}>
                            <td>{new Date(ts.TS_DATE).toLocaleDateString()}</td>
                            <td><span className={`badge badge-${ts.TS_WORKING_STATUS.toLowerCase()}`}>{ts.TS_WORKING_STATUS}</span></td>
                            <td>{ts.TS_ACTIVITY}</td>
                            <td style={{ fontWeight: 600, color: rowColor === 'inherit' ? 'var(--primary)' : 'inherit' }}>{ts.TS_JIRA_TICKET || '-'}</td>
                            <td>{parseFloat(ts.TS_EFFORT_HOURS).toFixed(2)} hrs</td>
                            <td>{ts.TS_TEAM}</td>
                            <td style={{ color: rowColor === 'inherit' ? 'var(--text-muted)' : 'inherit' }} title={ts.TS_COMMENTS}>
                              {ts.TS_COMMENTS && ts.TS_COMMENTS.length > 20 ? ts.TS_COMMENTS.substring(0, 20) + '...' : ts.TS_COMMENTS || '-'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => startEdit(ts)} className="btn" style={{ padding: '0.4rem', color: rowColor === 'inherit' ? 'var(--primary)' : 'inherit' }}><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteTimesheet(ts.TS_TIMESHEET_ID)} className="btn" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in">
            {selectedTicket ? (
              <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={() => setSelectedTicket(null)} className="btn" style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.05)' }}>
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Ticket Stats: {selectedTicket}</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Consumption breakdown across accessible teams</p>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Resource</th>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Effort (Hours)</th>
                        <th>Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketDetails.map((td, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{td.TS_NAME}</td>
                          <td>{new Date(td.TS_DATE).toLocaleDateString()}</td>
                          <td>{td.TS_ACTIVITY}</td>
                          <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{parseFloat(td.TS_EFFORT_HOURS).toFixed(2)} hrs</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }} title={td.TS_COMMENTS}>
                            {td.TS_COMMENTS && td.TS_COMMENTS.length > 20 
                              ? td.TS_COMMENTS.substring(0, 20) + '...' 
                              : td.TS_COMMENTS || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', textAlign: 'right' }}>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>
                      Total Effort Hours Consumed: <span style={{ color: 'var(--primary)', fontSize: '1.5rem', marginLeft: '0.5rem' }}>
                        {ticketDetails.reduce((acc, curr) => acc + parseFloat(curr.TS_EFFORT_HOURS || 0), 0).toFixed(2)} hrs
                      </span>
                    </p>
                  </div>
                </div>
            ) : (
              <div className="glass-card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Active Tickets Consumption</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {user.role === 'AD' && (
                      <select 
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--glass)', color: 'var(--text)' }}
                      >
                        <option value="All">All Teams</option>
                        {[...new Set(teamStats.flatMap(s => s.teams ? s.teams.split(',') : []))].map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    )}
                    <div style={{ position: 'relative', width: '200px' }}>
                      <input 
                        type="text" 
                        placeholder="Search Ticket..." 
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => setStatusFilter('All')}
                    className={`btn ${statusFilter === 'All' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', background: statusFilter === 'All' ? 'var(--primary)' : 'transparent', color: statusFilter === 'All' ? 'white' : 'var(--text-muted)' }}
                  >
                    All Tickets
                  </button>
                  <button 
                    onClick={() => setStatusFilter('In progress')}
                    className={`btn ${statusFilter === 'In progress' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', background: statusFilter === 'In progress' ? 'var(--primary)' : 'transparent', color: statusFilter === 'In progress' ? 'white' : 'var(--text-muted)' }}
                  >
                    In Progress
                  </button>
                  <button 
                    onClick={() => setStatusFilter('Completed')}
                    className={`btn ${statusFilter === 'Completed' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', background: statusFilter === 'Completed' ? 'var(--primary)' : 'transparent', color: statusFilter === 'Completed' ? 'white' : 'var(--text-muted)' }}
                  >
                    Completed
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Jira Ticket</th>
                        <th>Team(s)</th>
                        <th>Total Effort (Hours)</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamStats
                        .filter(stat => {
                          const matchesTicket = stat.TS_JIRA_TICKET.toLowerCase().includes(ticketSearch.toLowerCase());
                          const matchesTeam = teamFilter === 'All' || (stat.teams && stat.teams.split(',').includes(teamFilter));
                          const matchesStatus = statusFilter === 'All' || stat.status === statusFilter;
                          return matchesTicket && matchesTeam && matchesStatus;
                        })
                        .sort((a, b) => b.total_effort - a.total_effort)
                        .map((stat, idx) => (
                        <tr key={idx} className="clickable-row" onClick={() => fetchTicketDetails(stat.TS_JIRA_TICKET)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{stat.TS_JIRA_TICKET}</td>
                          <td>
                            {stat.teams ? stat.teams.split(',').map((t, i) => (
                              <span key={i} className="badge" style={{ marginRight: '0.25rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>{t}</span>
                            )) : '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{parseFloat(stat.total_effort).toFixed(2)}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>hrs</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={{ 
                              background: stat.status === 'In progress' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: stat.status === 'In progress' ? 'var(--primary)' : 'var(--success)'
                            }}>
                              {stat.status || 'In progress'}
                            </span>
                          </td>
                          <td>{stat.entries_count} entries</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn" style={{ color: 'var(--primary)', gap: '0.4rem' }}>
                              View Stats <ExternalLink size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {teamStats.length === 0 && !loadingStats && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No team tickets found for your access level.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <LogHoursModal
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSuccess={() => { setShowModal(false); setEditingEntry(null); fetchTimesheets(); if(activeTab === 'team') fetchTeamStats(); }}
          user={user}
          initialData={editingEntry}
        />
      )}

      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <Trash2 size={48} color="var(--danger)" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Are you sure?</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmDelete} className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="modal-overlay">
          <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Change Password</h2>
              <button onClick={() => setShowChangePassword(false)} className="btn" style={{ padding: '0.5rem' }}><ArrowLeft size={18} /></button>
            </div>
            <form onSubmit={handleChangePassword} className="grid">
              <div>
                <label>User ID</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={cpData.userId} 
                    readOnly 
                    style={{ paddingLeft: '3rem', background: 'rgba(0,0,0,0.05)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
              <div>
                <label>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="Enter current password"
                    value={cpData.currentPassword}
                    onChange={(e) => setCpData({ ...cpData, currentPassword: e.target.value })}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>
              <div>
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    required 
                    placeholder="Enter new password"
                    value={cpData.newPassword}
                    onChange={(e) => setCpData({ ...cpData, newPassword: e.target.value })}
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
              </div>
              {cpError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{cpError}</p>}
              {cpSuccess && <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{cpSuccess}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
