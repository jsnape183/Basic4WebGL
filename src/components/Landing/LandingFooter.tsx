import React from 'react';
import { Link } from 'react-router-dom';

const linkStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  textDecoration: 'none',
};

const LandingFooter: React.FC = () => (
  <footer style={{
    padding: '32px 40px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontWeight: 700, fontSize: 14, background: 'linear-gradient(90deg, #f093fb, #f5576c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        softBASIC
      </span>
      <span>Make 2D games. No experience needed.</span>
      <span style={{ marginTop: 4 }}>© {new Date().getFullYear()} softBASIC. All rights reserved.</span>
    </div>
    <div style={{ display: 'flex', gap: 28 }}>
      <a href="/docs" target="_blank" rel="noopener noreferrer" style={linkStyle}>Docs</a>
      <Link to="/docs/language-guide" style={linkStyle}>Tutorial</Link>
      <Link to="/projects" style={linkStyle}>Projects</Link>
    </div>
  </footer>
);

export default LandingFooter;
