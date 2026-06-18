import React from 'react';
import LandingNav from '../components/Landing/LandingNav';

const LandingPage: React.FC = () => (
  <div style={{ background: '#0a0818', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
    <LandingNav />
    <p style={{ padding: 40, opacity: 0.4 }}>Hero — coming soon</p>
  </div>
);

export default LandingPage;
