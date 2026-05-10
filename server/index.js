const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
};

let pool;
async function connectDb() {
    pool = mysql.createPool(dbConfig);
}
connectDb();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
    const { usernameOrId, password } = req.body;
    try {
        const [users] = await pool.query(
            'SELECT * FROM et_users WHERE username = ? OR user_id = ?',
            [usernameOrId, usernameOrId]
        );

        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role, team: user.team, access_team: user.access_team },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                user_id: user.user_id,
                username: user.username,
                role: user.role,
                team: user.team,
                access_team: user.access_team
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email, userId } = req.body;
    try {
        // 1. Check if user exists with matching email AND user_id
        const [users] = await pool.query('SELECT username FROM et_users WHERE email = ? AND user_id = ?', [email, userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User ID and Email do not match our records' });

        // 2. Rate Limiting: Max 5 requests per minute
        const [recentRequests] = await pool.query(
            'SELECT COUNT(*) as count FROM et_otp_requests WHERE email = ? AND created_at > NOW() - INTERVAL 1 MINUTE',
            [email]
        );
        if (recentRequests[0].count >= 5) {
            return res.status(429).json({ message: 'Too many requests. Please try again after a minute.' });
        }

        // 3. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins expiry

        // 4. Save OTP to DB
        await pool.query(
            'INSERT INTO et_otp_requests (email, otp_code, expires_at) VALUES (?, ?, ?)',
            [email, otp, expiresAt]
        );

        // 5. Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Effort Tracker - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">Password Reset</h2>
                    <p>Hello,</p>
                    <p>You requested a password reset for your Effort Tracker account. Use the code below to proceed:</p>
                    <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #6366f1; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 5px;">
                        ${otp}
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you did not request this, you can safely ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent to your email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM et_otp_requests WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM et_otp_requests WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );
        if (rows.length === 0) {
            return res.status(400).json({ message: 'OTP expired during process. Please try again.' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE et_users SET password_hash = ? WHERE email = ?', [hashedPassword, email]);
        await pool.query('DELETE FROM et_otp_requests WHERE email = ?', [email]);
        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM et_users WHERE user_id = ?', [userId]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid User ID' });

        const user = users[0];
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) return res.status(401).json({ message: 'Incorrect Current Password' });

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE et_users SET password_hash = ? WHERE user_id = ?', [hashedNewPassword, userId]);
        
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// --- Timesheet Routes ---

app.get('/api/timesheets', authenticateToken, async (req, res) => {
    const { user_id } = req.user;
    try {
        const [rows] = await pool.query('SELECT * FROM et_timesheets WHERE TS_USER_ID = ? ORDER BY TS_DATE DESC, TS_CREATED_AT DESC', [user_id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/timesheets', authenticateToken, async (req, res) => {
    const { TS_DATE, TS_WORKING_STATUS, TS_ROLE, TS_JIRA_TICKET, TS_ACTIVITY, TS_EFFORT_HOURS, TS_TEAM, TS_COMMENTS } = req.body;
    const { user_id, username } = req.user;

    // Future date validation
    const selectedDate = new Date(TS_DATE);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
        return res.status(400).json({ message: 'Cannot log hours for a future date' });
    }
    
    if (TS_WORKING_STATUS === 'Working' && (!TS_JIRA_TICKET || TS_JIRA_TICKET.trim() === '')) {
        return res.status(400).json({ message: 'Jira Ticket is mandatory for Working status' });
    }

    const TS_STATUS = TS_JIRA_TICKET ? 'In progress' : '';

    try {
        await pool.query(
            'INSERT INTO et_timesheets (TS_USER_ID, TS_DATE, TS_WORKING_STATUS, TS_ROLE, TS_NAME, TS_JIRA_TICKET, TS_ACTIVITY, TS_EFFORT_HOURS, TS_TEAM, TS_COMMENTS, TS_STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, TS_DATE, TS_WORKING_STATUS, TS_ROLE, username, TS_JIRA_TICKET, TS_ACTIVITY, TS_EFFORT_HOURS, TS_TEAM, TS_COMMENTS, TS_STATUS]
        );
        res.status(201).json({ message: 'Timesheet logged successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/timesheets/:id', authenticateToken, async (req, res) => {
    const { TS_DATE, TS_WORKING_STATUS, TS_ROLE, TS_JIRA_TICKET, TS_ACTIVITY, TS_EFFORT_HOURS, TS_TEAM, TS_COMMENTS } = req.body;
    const { user_id } = req.user;
    const { id } = req.params;

    // Future date validation
    const selectedDate = new Date(TS_DATE);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
        return res.status(400).json({ message: 'Cannot log hours for a future date' });
    }

    if (TS_WORKING_STATUS === 'Working' && (!TS_JIRA_TICKET || TS_JIRA_TICKET.trim() === '')) {
        return res.status(400).json({ message: 'Jira Ticket is mandatory for Working status' });
    }

    const TS_STATUS = TS_JIRA_TICKET ? 'In progress' : '';

    try {
        // Verify ownership
        const [rows] = await pool.query('SELECT TS_USER_ID FROM et_timesheets WHERE TS_TIMESHEET_ID = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Entry not found' });
        if (rows[0].TS_USER_ID !== user_id) return res.status(403).json({ message: 'Forbidden' });

        await pool.query(
            'UPDATE et_timesheets SET TS_DATE = ?, TS_WORKING_STATUS = ?, TS_ROLE = ?, TS_JIRA_TICKET = ?, TS_ACTIVITY = ?, TS_EFFORT_HOURS = ?, TS_TEAM = ?, TS_COMMENTS = ?, TS_STATUS = ? WHERE TS_TIMESHEET_ID = ?',
            [TS_DATE, TS_WORKING_STATUS, TS_ROLE, TS_JIRA_TICKET, TS_ACTIVITY, TS_EFFORT_HOURS, TS_TEAM, TS_COMMENTS, TS_STATUS, id]
        );
        res.json({ message: 'Timesheet updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/timesheets/:id', authenticateToken, async (req, res) => {
    const { user_id } = req.user;
    const { id } = req.params;

    try {
        // Verify ownership
        const [rows] = await pool.query('SELECT TS_USER_ID FROM et_timesheets WHERE TS_TIMESHEET_ID = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Entry not found' });
        if (rows[0].TS_USER_ID !== user_id) return res.status(403).json({ message: 'Forbidden' });

        await pool.query('DELETE FROM et_timesheets WHERE TS_TIMESHEET_ID = ?', [id]);
        res.json({ message: 'Timesheet deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// --- User Management (Admin Only) ---

app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'AD') return res.status(403).json({ message: 'Admin only' });
    try {
        const [rows] = await pool.query('SELECT user_id, username, email, role, team, access_team FROM et_users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'AD') return res.status(403).json({ message: 'Admin only' });
    const { user_id, username, email, password, role, team, access_team } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO et_users (user_id, username, email, password_hash, role, team, access_team) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, username, email, hashedPassword, role, team, access_team]
        );
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'AD') return res.status(403).json({ message: 'Admin only' });
    const { username, email, password, role, team, access_team } = req.body;
    const { id } = req.params;

    try {
        let query = 'UPDATE et_users SET username = ?, email = ?, role = ?, team = ?, access_team = ?';
        let params = [username, email, role, team, access_team];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password_hash = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE user_id = ?';
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'AD') return res.status(403).json({ message: 'Admin only' });
    const { id } = req.params;

    try {
        // First delete their timesheets to avoid FK constraints
        await pool.query('DELETE FROM et_timesheets WHERE TS_USER_ID = ?', [id]);
        await pool.query('DELETE FROM et_users WHERE user_id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/activities', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM et_activities');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/team-stats', authenticateToken, async (req, res) => {
    const { access_team } = req.user;
    if (!access_team) return res.json([]);

    try {
        // access_team could be a comma-separated list
        const teams = access_team.split(',').map(t => t.trim());
        
        let query = 'SELECT TS_JIRA_TICKET, GROUP_CONCAT(DISTINCT TS_TEAM) as teams, SUM(TS_EFFORT_HOURS) as total_effort, COUNT(*) as entries_count, MAX(TS_STATUS) as status FROM et_timesheets WHERE TS_JIRA_TICKET != "" AND TS_JIRA_TICKET IS NOT NULL';
        let params = [];

        if (access_team !== 'ALL') {
            query += ' AND TS_TEAM IN (?)';
            params.push(teams);
        }

        query += ' GROUP BY TS_JIRA_TICKET';
        
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/team-ticket-details/:ticket', authenticateToken, async (req, res) => {
    const { access_team } = req.user;
    const { ticket } = req.params;
    if (!access_team) return res.status(403).json({ message: 'Forbidden' });

    try {
        const teams = access_team.split(',').map(t => t.trim());
        let query = 'SELECT TS_NAME, TS_DATE, TS_ACTIVITY, TS_EFFORT_HOURS, TS_COMMENTS FROM et_timesheets WHERE TS_JIRA_TICKET = ?';
        let params = [ticket];

        if (access_team !== 'ALL') {
            query += ' AND TS_TEAM IN (?)';
            params.push(teams);
        }

        query += ' ORDER BY TS_DATE DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
