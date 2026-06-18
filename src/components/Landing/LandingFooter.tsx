import React from 'react';

const LandingFooter: React.FC = () => (
  <footer style={{
    padding: '20px 40px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    fontSize: 13, color: 'rgba(255,255,255,0.22)',
  }}>
    <div>© 2026 softBASIC</div>
    <div style={{ display: 'flex', gap: 20 }}>
      <a href="/docs" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Docs</a>
      <a href="/docs/language-guide" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Tutorial</a>
    </div>
  </footer>
);

export default LandingFooter;
