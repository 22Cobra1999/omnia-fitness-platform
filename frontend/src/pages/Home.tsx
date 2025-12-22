import React from 'react';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Omnia Fitness Platform</h1>
          <p className="hero-subtitle">
            Connect coaches with clients for personalized fitness and nutrition programs
          </p>
          <div className="hero-buttons">
            <a href="/login" className="btn btn-primary">Get Started</a>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="features-container">
          <h2>Platform Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏋️</div>
              <h3>Exercise Management</h3>
              <p>Comprehensive database of exercises with detailed descriptions and difficulty levels</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Coach-Client System</h3>
              <p>Seamless connection between fitness coaches and their clients</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Integration</h3>
              <p>Access your fitness programs anywhere with our mobile-friendly platform</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Progress Tracking</h3>
              <p>Monitor your fitness journey with detailed analytics and reports</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Transform Your Fitness Journey?</h2>
          <p>Join thousands of coaches and clients already using Omnia Fitness</p>
          <a href="/login" className="btn btn-large">Join Now</a>
        </div>
      </section>
    </div>
  );
};

export default Home;
