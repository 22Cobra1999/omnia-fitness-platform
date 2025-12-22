# 🚀 Quick Start Guide

This guide will help you get the Omnia Fitness Platform up and running in minutes.

## Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- npm or yarn

## Step-by-Step Setup

### 1. Database Setup (5 minutes)

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE omnia_fitness;

# Exit
\q

# Run schema
psql -U postgres -d omnia_fitness -f database/schema.sql
```

### 2. Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor

# Start server
npm run dev
```

Backend will start on: http://localhost:5000

### 3. Frontend Setup (2 minutes)

Open a **new terminal** window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start on: http://localhost:3000

## Verify Everything Works

1. **Test Backend Health**:
   ```bash
   curl http://localhost:5000/health
   ```
   Expected: `{"status":"healthy",...}`

2. **Test Users API**:
   ```bash
   curl http://localhost:5000/api/users
   ```
   Expected: JSON array of users

3. **Open Frontend**:
   Visit http://localhost:3000 in your browser

## What You Get

- ✅ **Backend API** running on port 5000
- ✅ **Frontend App** running on port 3000
- ✅ **Database** with sample data
- ✅ **Users API** (coaches and clients)
- ✅ **Exercises API** (fitness exercises)

## Next Steps

1. Explore the frontend at http://localhost:3000
2. Try the login page at http://localhost:3000/login
3. Test API endpoints with curl or Postman
4. Check out SETUP.md for detailed documentation

## Troubleshooting

**Database connection fails?**
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify credentials in `backend/.env`

**Port already in use?**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.ts`

**Module not found?**
- Run `npm install` in the respective directory

## Need Help?

See SETUP.md for comprehensive documentation and troubleshooting tips.
