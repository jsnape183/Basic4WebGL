import React from 'react';
import { Link } from 'react-router-dom';

const LandingNav: React.FC = () => (
  <nav style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: 52,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(10,8,24,0.85)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }}>
    <span style={{
      background: 'linear-gradient(90deg, #f093fb, #f5576c)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: 16,
      fontWeight: 800,
    }}>
      softBASIC
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <a
        href="/docs"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}
      >
        Docs
      </a>
      <Link
        to="/projects"
        style={{
          background: 'linear-gradient(90deg, #f5576c, #f093fb)',
          color: 'white',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Try it free →
      </Link>
    </div>
  </nav>
);

export default LandingNav;
