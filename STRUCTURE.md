# 📁 Project Structure

This document provides an overview of the Omnia Fitness Platform structure.

## Directory Layout

```
omnia-fitness-platform/
│
├── backend/                    # Express.js Backend Server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts    # PostgreSQL connection configuration
│   │   ├── routes/
│   │   │   ├── users.ts       # User API endpoints
│   │   │   └── exercises.ts   # Exercise API endpoints
│   │   └── server.ts          # Main Express server
│   ├── dist/                  # Compiled JavaScript (generated)
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── .env.example           # Environment variables template
│   ├── .gitignore             # Git ignore rules
│   └── README.md              # Backend documentation
│
├── frontend/                  # React Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx     # Navigation header
│   │   │   ├── Header.css
│   │   │   ├── Footer.tsx     # Page footer
│   │   │   └── Footer.css
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Landing page
│   │   │   ├── Home.css
│   │   │   ├── Login.tsx      # Login page
│   │   │   └── Login.css
│   │   ├── styles/
│   │   │   └── index.css      # Global styles
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── public/                # Static assets
│   ├── dist/                  # Build output (generated)
│   ├── index.html             # HTML template
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite bundler configuration
│   ├── postcss.config.mjs     # PostCSS configuration
│   ├── .gitignore             # Git ignore rules
│   └── README.md              # Frontend documentation
│
├── database/                  # Database Schema
│   └── schema.sql             # PostgreSQL schema with sample data
│
├── SETUP.md                   # Comprehensive setup guide
├── QUICKSTART.md              # Quick start guide
└── STRUCTURE.md               # This file
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database Client**: pg (node-postgres)
- **Environment**: dotenv
- **CORS**: cors middleware

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS (custom)
- **Dev Server**: Vite Dev Server

### Database
- **DBMS**: PostgreSQL
- **Language**: SQL/PLpgSQL
- **Features**:
  - Relational tables
  - Indexes for performance
  - Triggers for automation
  - Constraints for data integrity

## Key Files

### Backend Configuration
- `backend/src/server.ts` - Express server setup with middleware and routes
- `backend/src/config/database.ts` - PostgreSQL connection pool
- `backend/.env` - Environment variables (not in git)

### Frontend Configuration
- `frontend/src/App.tsx` - React app with routing
- `frontend/vite.config.ts` - Vite configuration with proxy
- `frontend/index.html` - HTML entry point

### Database
- `database/schema.sql` - Complete database schema with:
  - Users table (coaches and clients)
  - Exercises table
  - Indexes and triggers
  - Sample data

## Port Configuration

| Service  | Default Port | Configurable |
|----------|-------------|--------------|
| Backend  | 5000        | Yes (.env)   |
| Frontend | 3000        | Yes (vite.config.ts) |
| Database | 5432        | Yes (.env)   |

## API Structure

### Backend Routes

```
/                       - API information
/health                 - Health check endpoint
/api/users             - User management
  GET /                - List all users
  GET /:id             - Get user by ID
  POST /               - Create new user
/api/exercises         - Exercise management
  GET /                - List all exercises
  GET /:id             - Get exercise by ID
  POST /               - Create new exercise
```

### Frontend Routes

```
/                      - Home page (landing)
/login                 - Login page
```

## Data Flow

```
Frontend (React)
    ↓ HTTP Request
Vite Proxy (dev mode)
    ↓ Forward to :5000
Backend (Express)
    ↓ SQL Query
Database (PostgreSQL)
    ↓ Result
Backend (Express)
    ↓ JSON Response
Frontend (React)
```

## Development Workflow

1. Start PostgreSQL database
2. Run database schema (`database/schema.sql`)
3. Start backend server (`npm run dev` in backend/)
4. Start frontend server (`npm run dev` in frontend/)
5. Access application at http://localhost:3000

## Build Process

### Backend
```bash
npm run build    # TypeScript → JavaScript (dist/)
npm start        # Run compiled code
```

### Frontend
```bash
npm run build    # React → Optimized bundle (dist/)
npm run preview  # Preview production build
```

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omnia_fitness
DB_USER=postgres
DB_PASSWORD=your_password
CORS_ORIGIN=http://localhost:3000
```

### Frontend
No environment variables required for basic setup.
Vite proxy handles API routing in development.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('coach', 'client')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Exercises Table
```sql
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Next Steps

- Add authentication (JWT)
- Implement password hashing (bcrypt)
- Add input validation
- Create additional API endpoints
- Add mobile app support
- Implement real-time features
- Add file upload capabilities
- Create admin dashboard

## Documentation

- **SETUP.md** - Detailed setup instructions
- **QUICKSTART.md** - Quick start guide
- **backend/README.md** - Backend API documentation
- **frontend/README.md** - Frontend documentation

## Support

For issues or questions, refer to the SETUP.md troubleshooting section.
