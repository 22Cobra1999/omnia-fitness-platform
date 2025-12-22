import React, { useState } from 'react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password, role });
    // TODO: Implement actual login logic
    alert(`Login feature coming soon!\nEmail: ${email}\nRole: ${role}`);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h2>Welcome to Omnia Fitness</h2>
          <p className="login-subtitle">Sign in to access your account</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">I am a:</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="role-select"
              >
                <option value="client">Client</option>
                <option value="coach">Coach</option>
              </select>
            </div>

            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="/register">Sign up</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
