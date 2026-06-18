import React from 'react';
import { Link } from 'react-router-dom';

const linkStyle = { color: 'rgba(255,255,255,0.3)', textDecoration: 'none' };

const LandingFooter: React.FC = () => (
  <footer style={{
    padding: '20px 40px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 13, color: 'rgba(255,255,255,0.22)',
  }}>
    <div>© 2026 softBASIC</div>
    <div style={{ display: 'flex', gap: 20 }}>
      <Link to="/docs" style={linkStyle}>Docs</Link>
      <Link to="/docs/language-guide" style={linkStyle}>Tutorial</Link>
    </div>
  </footer>
);

export default LandingFooter;
