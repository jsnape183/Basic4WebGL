import React from 'react';
import { Link } from 'react-router-dom';

const LandingCta: React.FC = () => (
  <section style={{
    padding: '72px 40px',
    background: 'linear-gradient(135deg, #1a0533, #302b63)',
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  }}>
    <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, marginTop: 0 }}>
      No signup. No download. Just open and code.
    </h2>
    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.42)', marginBottom: 30 }}>
      Your projects save automatically in the browser. Pick up where you left off, any time.
    </p>
    <Link
      to="/projects"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(90deg, #f5576c, #f093fb)',
        color: 'white', padding: '14px 32px', borderRadius: 28,
        fontSize: 16, fontWeight: 700, textDecoration: 'none',
        boxShadow: '0 8px 32px rgba(245,87,108,0.4)',
      }}
    >
      Start your first game →
    </Link>
    <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>
      Free to use · Works in any modern browser
    </div>
  </section>
);

export default LandingCta;
