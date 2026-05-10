import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const LogHoursModal = ({ onClose, onSuccess, user, initialData }) => {
  const [formData, setFormData] = useState({
    TS_DATE: initialData ? new Date(initialData.TS_DATE).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
    TS_WORKING_STATUS: initialData ? initialData.TS_WORKING_STATUS : 'Working',
    TS_ROLE: initialData ? initialData.TS_ROLE : 'DEV',
    TS_JIRA_TICKET: initialData ? initialData.TS_JIRA_TICKET : '',
    TS_ACTIVITY: initialData ? initialData.TS_ACTIVITY : 'coding',
    TS_EFFORT_HOURS: initialData ? initialData.TS_EFFORT_HOURS : '8',
    TS_TEAM: initialData ? initialData.TS_TEAM : (user.team || ''),
    TS_COMMENTS: initialData ? initialData.TS_COMMENTS : ''
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/activities');
        setActivities(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchActivities();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Future date validation
    const selectedDate = new Date(formData.TS_DATE);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      alert('Cannot log hours for a future date.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (initialData) {
        await axios.put(`http://localhost:5000/api/timesheets/${initialData.TS_TIMESHEET_ID}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/timesheets', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSuccess();
    } catch (err) {
      alert(`Error ${initialData ? 'updating' : 'logging'} hours: ` + (err.response?.data?.message || err.message));
    }
  };

  const isOffDay = formData.TS_WORKING_STATUS === 'PTO' || formData.TS_WORKING_STATUS === 'Holiday';

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass-card animate-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{initialData ? 'Edit Effort' : 'Log Daily Effort'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid">
          <div className="grid-cols-2 grid">
            <div>
              <label>Working Status</label>
              <select 
                value={formData.TS_WORKING_STATUS} 
                onChange={(e) => setFormData({
                  ...formData, 
                  TS_WORKING_STATUS: e.target.value, 
                  TS_EFFORT_HOURS: (e.target.value === 'PTO' || e.target.value === 'Holiday') ? '0' : '8',
                  TS_ACTIVITY: (e.target.value === 'PTO' || e.target.value === 'Holiday') ? '-' : (e.target.value === 'General' ? 'General' : 'coding')
                })}
              >
                <option value="Working">Working</option>
                <option value="General">General</option>
                <option value="PTO">PTO</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
            <div>
              <label>Date</label>
              <input 
                type="date" 
                value={formData.TS_DATE} 
                onChange={(e) => setFormData({...formData, TS_DATE: e.target.value})} 
                max={new Date().toLocaleDateString('en-CA')}
                required 
              />
            </div>
          </div>

          {!isOffDay ? (
            <>
              <div className="grid-cols-2 grid">
                <div>
                  <label>Role</label>
                  <select value={formData.TS_ROLE} onChange={(e) => setFormData({...formData, TS_ROLE: e.target.value})}>
                    <option value="DEV">DEV</option>
                    <option value="QA">QA</option>
                  </select>
                </div>
                <div>
                  <label>Jira Ticket {formData.TS_WORKING_STATUS === 'Working' && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                  <input 
                    type="text" 
                    placeholder="PROJ-123" 
                    required={formData.TS_WORKING_STATUS === 'Working'}
                    value={formData.TS_JIRA_TICKET} 
                    onChange={(e) => setFormData({...formData, TS_JIRA_TICKET: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label>Activity</label>
                <select value={formData.TS_ACTIVITY} onChange={(e) => setFormData({...formData, TS_ACTIVITY: e.target.value})}>
                  {activities.map(a => (
                    <option key={a.activity_id} value={a.activity_name}>{a.activity_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Effort Hours</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.TS_EFFORT_HOURS} 
                  onChange={(e) => setFormData({...formData, TS_EFFORT_HOURS: e.target.value})} 
                  required 
                  placeholder="e.g. 2.50"
                />
              </div>

              <div>
                <label>Team</label>
                <input 
                  type="text" 
                  value={formData.TS_TEAM} 
                  onChange={(e) => setFormData({...formData, TS_TEAM: e.target.value})} 
                  placeholder="e.g. AM"
                />
              </div>
            </>
          ) : (
            <div>
              <label>Reason for {formData.TS_WORKING_STATUS} (Comments Required)</label>
              <textarea 
                value={formData.TS_COMMENTS} 
                onChange={(e) => setFormData({...formData, TS_COMMENTS: e.target.value})} 
                placeholder={`Reason for ${formData.TS_WORKING_STATUS.toLowerCase()}...`} 
                required 
              />
            </div>
          )}

          {!isOffDay && (
            <div>
              <label>Comments (Optional)</label>
              <textarea 
                value={formData.TS_COMMENTS} 
                onChange={(e) => setFormData({...formData, TS_COMMENTS: e.target.value})} 
                placeholder="Any additional notes..." 
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, border: '1px solid var(--border)' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {initialData ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogHoursModal;
