# 🏋️ Omnia Fitness Platform - Setup Guide

## 📋 Overview

This is a complete fitness platform that includes a coach-client system, exercise management, and mobile app integration. The project is structured with:

- **Backend**: Express.js with TypeScript
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Environment**: Node.js

## 🏗️ Project Structure

```
omnia-fitness-platform/
├── backend/               # Express.js backend server
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── routes/       # API routes (users, exercises)
│   │   └── server.ts     # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example      # Environment variables template
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable components (Header, Footer)
│   │   ├── pages/        # Page components (Home, Login)
│   │   ├── styles/       # CSS stylesheets
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts    # Vite configuration
└── database/             # Database schema
    └── schema.sql        # PostgreSQL schema with sample data
```

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher): [Download Node.js](https://nodejs.org/)
- **PostgreSQL** (v13 or higher): [Download PostgreSQL](https://www.postgresql.org/download/)
- **npm** or **yarn**: Comes with Node.js

### 1. Clone the Repository

```bash
git clone <repository-url>
cd omnia-fitness-platform
```

### 2. Set Up PostgreSQL Database

#### Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE omnia_fitness;

# Exit psql
\q
```

#### Run Schema

```bash
# Run the schema file to create tables and insert sample data
psql -U postgres -d omnia_fitness -f database/schema.sql
```

This will create:
- `users` table (for coaches and clients)
- `exercises` table (for exercise management)
- Sample data for testing

### 3. Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your database credentials
# Update the following variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=omnia_fitness
# DB_USER=postgres
# DB_PASSWORD=your_password_here
```

Edit the `.env` file with your actual database credentials.

### 4. Set Up Frontend

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

## 🏃‍♂️ Running the Application

You'll need to run both the backend and frontend simultaneously in separate terminal windows.

### Terminal 1: Start Backend Server

```bash
# From the backend directory
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

You should see:
```
🚀 Omnia Fitness Platform Backend
================================
Server running on port 5000
Environment: development
Database: omnia_fitness
================================
```

### Terminal 2: Start Frontend Application

```bash
# From the frontend directory
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
```

### Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🔑 API Endpoints

### Users API

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "coach"
  }
  ```

### Exercises API

- `GET /api/exercises` - Get all exercises
- `GET /api/exercises/:id` - Get exercise by ID
- `POST /api/exercises` - Create new exercise
  ```json
  {
    "name": "Push-ups",
    "description": "Upper body exercise",
    "category": "Strength",
    "difficulty_level": "beginner"
  }
  ```

### Health Check

- `GET /health` - Check server and database status

## 🧪 Testing the API

You can test the API using curl, Postman, or any HTTP client:

### Example: Get all users
```bash
curl http://localhost:5000/api/users
```

### Example: Create a new user
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

### Example: Get all exercises
```bash
curl http://localhost:5000/api/exercises
```

## 📊 Database Schema

### Users Table

| Column     | Type         | Description                    |
|------------|--------------|--------------------------------|
| id         | SERIAL       | Primary key                    |
| name       | VARCHAR(255) | User's full name               |
| email      | VARCHAR(255) | Unique email address           |
| password   | VARCHAR(255) | Hashed password                |
| role       | VARCHAR(20)  | 'coach' or 'client'            |
| created_at | TIMESTAMP    | Creation timestamp             |
| updated_at | TIMESTAMP    | Last update timestamp          |

### Exercises Table

| Column           | Type         | Description                           |
|------------------|--------------|---------------------------------------|
| id               | SERIAL       | Primary key                           |
| name             | VARCHAR(255) | Exercise name                         |
| description      | TEXT         | Detailed description                  |
| category         | VARCHAR(100) | Exercise category (Strength, Cardio)  |
| difficulty_level | VARCHAR(20)  | 'beginner', 'intermediate', 'advanced'|
| created_at       | TIMESTAMP    | Creation timestamp                    |
| updated_at       | TIMESTAMP    | Last update timestamp                 |

## 🛠️ Development Scripts

### Backend

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run lint     # Run ESLint
```

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omnia_fitness
DB_USER=postgres
DB_PASSWORD=your_password_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration

The frontend is configured to proxy API requests to the backend. This is set up in `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

## 📱 Features

### Frontend Features

- ✅ **Responsive Design**: Mobile-first approach
- ✅ **React Router**: Client-side routing
- ✅ **Component-based Architecture**: Reusable components
- ✅ **Modern UI**: Clean and professional design
- ✅ **Login Page**: Authentication interface
- ✅ **Home Page**: Landing page with features

### Backend Features

- ✅ **RESTful API**: Clean API structure
- ✅ **TypeScript**: Type-safe code
- ✅ **PostgreSQL Integration**: Robust database connection
- ✅ **Error Handling**: Comprehensive error management
- ✅ **CORS Support**: Cross-origin resource sharing
- ✅ **Environment Variables**: Secure configuration
- ✅ **Health Checks**: Monitor server status

### Database Features

- ✅ **Relational Schema**: Well-structured tables
- ✅ **Indexes**: Optimized queries
- ✅ **Triggers**: Automatic timestamp updates
- ✅ **Sample Data**: Pre-populated for testing
- ✅ **Constraints**: Data validation at database level

## 🚨 Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Check PostgreSQL is running:
   ```bash
   # On macOS/Linux
   sudo service postgresql status
   
   # On Windows
   # Check Services app
   ```

2. Verify database credentials in `.env`
3. Ensure database exists:
   ```bash
   psql -U postgres -l
   ```

### Port Already in Use

If port 5000 or 3000 is already in use:

1. Change the port in backend `.env` or frontend `vite.config.ts`
2. Or stop the process using the port:
   ```bash
   # Find process
   lsof -i :5000
   
   # Kill process
   kill -9 <PID>
   ```

### Module Not Found Errors

If you see module errors:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

### Suggested Enhancements

1. **Authentication**: Implement JWT-based authentication
2. **Password Hashing**: Use bcrypt for password security
3. **Validation**: Add input validation with libraries like Joi
4. **Testing**: Add unit and integration tests
5. **Documentation**: API documentation with Swagger
6. **Mobile App**: React Native mobile application
7. **Real-time**: WebSocket support for live updates
8. **File Upload**: Image/video upload for exercises
9. **Analytics**: Dashboard for coaches
10. **Notifications**: Email/SMS notifications

### Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section
2. Review the configuration files
3. Check server logs for error messages
4. Create an issue in the repository

---

**Happy Coding! 🚀**
