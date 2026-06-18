import React from 'react';
import { Link } from 'react-router-dom';
import CodePanel from './CodePanel';

const LandingHero: React.FC = () => (
  <section style={{
    minHeight: 'calc(100vh - 52px)',
    display: 'flex',
    alignItems: 'center',
    padding: '60px 40px',
    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a0533 100%)',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Radial glow */}
    <div style={{
      position: 'absolute',
      top: '-30%', right: '-10%',
      width: '60%', height: '80%',
      background: 'radial-gradient(ellipse, rgba(240,147,251,0.12) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />

    <div style={{
      maxWidth: 980,
      margin: '0 auto',
      display: 'flex',
      gap: 48,
      alignItems: 'center',
      width: '100%',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Left: copy */}
      <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #f093fb, #f5576c)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          softBASIC
        </div>
        <h1 style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1.5, margin: 0 }}>
          Make 2D games.<br />No experience<br />needed.
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', maxWidth: 380, margin: 0 }}>
          A friendly coding language that turns a few lines into a real, playable game — right in your browser. No setup, no downloads, nothing to install.
        </p>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(90deg, #f5576c, #f093fb)',
            color: 'white', padding: '13px 26px', borderRadius: 28,
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(245,87,108,0.35)',
            width: 'fit-content',
          }}
        >
          Start building →
        </Link>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          New to coding?{' '}
          <a href="/docs" style={{ color: 'rgba(240,147,251,0.7)', textDecoration: 'none' }}>
            Start with the beginner tutorial →
          </a>
        </div>
      </div>

      {/* Right: demo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          background: '#000',
          border: '1px solid rgba(240,147,251,0.2)',
          borderRadius: 8,
          height: 220,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(240,147,251,0.4)', fontSize: 12,
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: 8, left: 10,
            fontSize: 9, color: 'rgba(255,255,255,0.25)',
            letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'monospace',
          }}>
            ▶ live preview
          </span>
          [ game running ]
        </div>
        <CodePanel />
      </div>
    </div>
  </section>
);

export default LandingHero;
