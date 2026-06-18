import React from 'react';

const GENRES = [
  { icon: '🚀', name: "Shoot 'em ups", desc: 'Bullets, enemies, explosions — the classic arcade formula' },
  { icon: '🏃', name: 'Platformers', desc: 'Jumping, gravity, and tile maps — build your own levels' },
  { icon: '🧩', name: 'Puzzle games', desc: 'Grid logic, match rules, timers — brain-teasers in code' },
  { icon: '🎯', name: 'Arcade classics', desc: 'Scores, lives, speed — the building blocks of any arcade game' },
];

const LandingWhatYouCanMake: React.FC = () => (
  <section style={{ padding: '72px 40px', background: '#0a0818' }}>
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 10 }}>
        What you can make
      </div>
      <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 32, marginTop: 0 }}>
        Real games, in minutes
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {GENRES.map(g => (
          <div key={g.name} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '22px 16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{g.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5 }}>{g.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 1.45 }}>{g.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LandingWhatYouCanMake;
