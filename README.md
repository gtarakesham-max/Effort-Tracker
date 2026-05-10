# Real Effort Tracker

A premium web application for logging and managing daily effort/timesheets with role-based access control.

## Features
- **Authentication**: Secure login with Username or User ID.
- **Role-based Access**: 
  - Admin (AD): Full access to all data and user management.
  - Manager (MG): View data for their `ACCESS_TEAM`.
  - Team Lead (TL): View data for their `TEAM`.
  - User (US): View/Edit own entries.
- **Timesheet Logging**: Easy-to-use form for logging hours (Working/PTO).
- **Dashboard**: Visualized stats and recent entries.
- **Database**: Integrated with TiDB (MySQL compatible).

## Tech Stack
- **Frontend**: React, Vite, Lucide Icons, Axios, Framer Motion.
- **Backend**: Node.js, Express, MySQL2, JWT, Bcrypt.
- **Database**: TiDB Cloud.

## Getting Started

### 1. Database Setup
The database is already initialized using the provided TiDB connection. 
To re-initialize if needed:
```bash
cd server
node initDb.js
```

### 2. Run Backend
```bash
cd server
npm start
```
*Server runs on port 5000*

### 3. Run Frontend
```bash
cd client
npm run dev
```
*Client runs on port 5173*

## Demo Credentials
- **Admin**: `admin` / `admin123`
