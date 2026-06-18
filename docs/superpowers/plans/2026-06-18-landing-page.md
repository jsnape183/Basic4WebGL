# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a marketing landing page at `/` that explains what softBASIC is and drives visitors to try it, moving the existing projects screen to `/projects`.

**Architecture:** Pure presentational React page with no Redux state or logic. New `LandingPage` component in `src/pages/`, sub-components in `src/components/Landing/`. Routing change in `src/components/Routes/index.tsx`. Two existing pages (`EditPage`, `ProjectsPage`) have a single link each updated from `/` to `/projects`.

**Tech Stack:** React, TypeScript, React Router v7 (`react-router-dom`), Tailwind CSS, inline CSS for landing-specific gradients not in the design token set.

---

## File structure

| File | Action | Purpose |
|---|---|---|
| `src/pages/LandingPage.tsx` | Create | Top-level page — assembles sub-components |
| `src/components/Landing/LandingNav.tsx` | Create | Sticky nav with logo + links |
| `src/components/Landing/LandingHero.tsx` | Create | Split hero: copy left, demo panel right |
| `src/components/Landing/CodePanel.tsx` | Create | 4-tab code snippet panel |
| `src/components/Landing/LandingWhatYouCanMake.tsx` | Create | 4-card genre grid |
| `src/components/Landing/LandingCta.tsx` | Create | Closing CTA banner |
| `src/components/Landing/LandingFooter.tsx` | Create | Footer |
| `src/components/Routes/index.tsx` | Modify | Add `/` → LandingPage, change `/` → `/projects` for ProjectsPage |
| `src/pages/EditPage.tsx` | Modify | Update back-link from `to="/"` to `to="/projects"` |
| `src/pages/ProjectsPage.tsx` | Modify | No link changes needed (no internal `/` links) |

---

### Task 1: Routing — add `/projects` route and LandingPage stub

**Files:**
- Create: `src/pages/LandingPage.tsx`
- Modify: `src/components/Routes/index.tsx`

- [ ] **Step 1: Create LandingPage stub**

```tsx
import React from 'react';

const LandingPage: React.FC = () => (
  <div style={{ background: '#0a0818', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
    <p style={{ padding: 40, opacity: 0.4 }}>Landing page — coming soon</p>
  </div>
);

export default LandingPage;
```

- [ ] **Step 2: Update Routes**

Replace `src/components/Routes/index.tsx` entirely:

```tsx
import { Routes, Route } from "react-router-dom";
import LandingPage from "../../pages/LandingPage";
import ProjectsPage from "../../pages/ProjectsPage";
import EditPage from "../../pages/EditPage";
import DocsPage from "../../pages/DocsPage";

const GlobalRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/projects" element={<ProjectsPage />} />
    <Route path="/projects/:id/edit" element={<EditPage />} />
    <Route path="/docs" element={<DocsPage />} />
    <Route path="/docs/:section" element={<DocsPage />} />
    <Route path="/docs/:section/:slug" element={<DocsPage />} />
  </Routes>
);

export default GlobalRoutes;
```

- [ ] **Step 3: Update EditPage back-link**

In `src/pages/EditPage.tsx` line 147, change `to="/"` to `to="/projects"`:

```tsx
<Link
  to="/projects"
  className="mr-2 text-ds-text-dim hover:text-ds-text-muted transition-colors text-lg leading-none"
  aria-label="Back to projects"
  title="Back to projects"
>
  ‹
</Link>
```

Also update the fallback navigate in the `useEffect` at line 68, change `navigate('/')` to `navigate('/projects')`:

```tsx
useEffect(() => {
  if (!project?.id) {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/projects');
    }
  }
}, [project, navigate, location]);
```

- [ ] **Step 4: Build to verify no broken imports**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx src/components/Routes/index.tsx src/pages/EditPage.tsx
git commit -m "feat: add /projects route, LandingPage stub, update back-link"
```

---

### Task 2: LandingNav

**Files:**
- Create: `src/components/Landing/LandingNav.tsx`
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Create LandingNav**

```tsx
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
```

- [ ] **Step 2: Wire into LandingPage**

```tsx
import React from 'react';
import LandingNav from '../components/Landing/LandingNav';

const LandingPage: React.FC = () => (
  <div style={{ background: '#0a0818', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
    <LandingNav />
    <p style={{ padding: 40, opacity: 0.4 }}>Hero — coming soon</p>
  </div>
);

export default LandingPage;
```

- [ ] **Step 3: Build**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Landing/LandingNav.tsx src/pages/LandingPage.tsx
git commit -m "feat: add LandingNav"
```

---

### Task 3: CodePanel (tabbed code snippets)

**Files:**
- Create: `src/components/Landing/CodePanel.tsx`

This component is self-contained and can be built and verified before LandingHero wraps it.

- [ ] **Step 1: Create CodePanel**

```tsx
import React, { useState } from 'react';

type TabId = 'load' | 'move' | 'shoot' | 'full';

const TABS: { id: TabId; label: string }[] = [
  { id: 'load', label: 'load sprite' },
  { id: 'move', label: 'movement' },
  { id: 'shoot', label: 'shoot' },
  { id: 'full', label: 'complete code' },
];

const kw = (text: string) => <span style={{ color: '#f5576c' }}>{text}</span>;
const fn = (text: string) => <span style={{ color: '#f093fb' }}>{text}</span>;
const str = (text: string) => <span style={{ color: '#a8e6cf' }}>{text}</span>;
const num = (text: string) => <span style={{ color: '#ffd3b6' }}>{text}</span>;
const cm = (text: string) => <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>{text}</span>;

const TAB_CONTENT: Record<TabId, React.ReactNode> = {
  load: <>
{cm("' module-level variable — persists across frames")}{'\n'}
{kw('dim')} ship{'\n'}
{'\n'}
{kw('function')} {fn('onenter')}(){'\n'}
{'  '}stage.{fn('setBackground')}({num('10')}, {num('10')}, {num('30')}){'\n'}
{'  '}ship = {kw('new')} sprite({str('"ship.png"')}){'\n'}
{'  '}stage.{fn('add')}(ship){'\n'}
{'  '}ship.transform.{fn('setPosition')}({num('320')}, {num('300')}){'\n'}
{kw('endfunction')}
  </>,

  move: <>
{cm("' called every frame")}{'\n'}
{kw('function')} {fn('onupdate')}(delta){'\n'}
{'  '}{kw('dim')} x{'\n'}
{'  '}{kw('dim')} y{'\n'}
{'  '}x = ship.transform.{fn('x')}(){'\n'}
{'  '}y = ship.transform.{fn('y')}(){'\n'}
{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('38')}) {kw('then')}{'\n'}
{'    '}y = y - {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('40')}) {kw('then')}{'\n'}
{'    '}y = y + {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('37')}) {kw('then')}{'\n'}
{'    '}x = x - {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('39')}) {kw('then')}{'\n'}
{'    '}x = x + {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'\n'}
{'  '}ship.transform.{fn('setPosition')}(x, y){'\n'}
{kw('endfunction')}
  </>,

  shoot: <>
{cm("' called when a key is pressed (32 = space)")}{'\n'}
{kw('function')} {fn('onkeydown')}(key){'\n'}
{'  '}{kw('if')} key = {num('32')} {kw('then')}{'\n'}
{'    '}{kw('dim')} bullet = {kw('new')} sprite({str('"bullet.png"')}){'\n'}
{'    '}stage.{fn('add')}(bullet){'\n'}
{'    '}bullet.transform.{fn('setPosition')}({'\n'}
{'      '}ship.transform.{fn('x')}(),{'\n'}
{'      '}ship.transform.{fn('y')}() - {num('20')}){'\n'}
{'  '}{kw('endif')}{'\n'}
{kw('endfunction')}
  </>,

  full: <>
{cm("' ── Main.bas — everything in one file ──")}{'\n'}
{kw('dim')} ship{'\n'}
{'\n'}
{kw('function')} {fn('onenter')}(){'\n'}
{'  '}stage.{fn('setBackground')}({num('10')}, {num('10')}, {num('30')}){'\n'}
{'  '}ship = {kw('new')} sprite({str('"ship.png"')}){'\n'}
{'  '}stage.{fn('add')}(ship){'\n'}
{'  '}ship.transform.{fn('setPosition')}({num('320')}, {num('300')}){'\n'}
{kw('endfunction')}{'\n'}
{'\n'}
{kw('function')} {fn('onupdate')}(delta){'\n'}
{'  '}{kw('dim')} x{'\n'}
{'  '}{kw('dim')} y{'\n'}
{'  '}x = ship.transform.{fn('x')}(){'\n'}
{'  '}y = ship.transform.{fn('y')}(){'\n'}
{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('38')}) {kw('then')}{'\n'}
{'    '}y = y - {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('40')}) {kw('then')}{'\n'}
{'    '}y = y + {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('37')}) {kw('then')}{'\n'}
{'    '}x = x - {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'  '}{kw('if')} {fn('input.getKeyDown')}({num('39')}) {kw('then')}{'\n'}
{'    '}x = x + {num('5')}{'\n'}
{'  '}{kw('endif')}{'\n'}
{'\n'}
{'  '}ship.transform.{fn('setPosition')}(x, y){'\n'}
{kw('endfunction')}{'\n'}
{'\n'}
{kw('function')} {fn('onkeydown')}(key){'\n'}
{'  '}{kw('if')} key = {num('32')} {kw('then')}{'\n'}
{'    '}{kw('dim')} bullet = {kw('new')} sprite({str('"bullet.png"')}){'\n'}
{'    '}stage.{fn('add')}(bullet){'\n'}
{'    '}bullet.transform.{fn('setPosition')}({'\n'}
{'      '}ship.transform.{fn('x')}(),{'\n'}
{'      '}ship.transform.{fn('y')}() - {num('20')}){'\n'}
{'  '}{kw('endif')}{'\n'}
{kw('endfunction')}
  </>,
};

const codeBodyStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontFamily: "'Menlo', 'Consolas', monospace",
  fontSize: 12,
  lineHeight: 1.75,
  color: 'rgba(255,255,255,0.55)',
  whiteSpace: 'pre',
  height: 180,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(240,147,251,0.3) transparent',
};

const CodePanel: React.FC = () => {
  const [active, setActive] = useState<TabId>('load');

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '7px 13px',
              fontSize: 11,
              fontFamily: "'Menlo', 'Consolas', monospace",
              color: active === tab.id ? '#f093fb' : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              whiteSpace: 'nowrap' as const,
              marginBottom: -1,
              background: 'none',
              border: 'none',
              borderBottom: active === tab.id ? '2px solid #f093fb' : '2px solid transparent',
              outline: 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={codeBodyStyle}>
        {TAB_CONTENT[active]}
      </div>
    </div>
  );
};

export default CodePanel;
```

- [ ] **Step 2: Build**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Landing/CodePanel.tsx
git commit -m "feat: add CodePanel tabbed code snippets"
```

---

### Task 4: LandingHero

**Files:**
- Create: `src/components/Landing/LandingHero.tsx`
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Create LandingHero**

```tsx
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
```

- [ ] **Step 2: Wire into LandingPage**

```tsx
import React from 'react';
import LandingNav from '../components/Landing/LandingNav';
import LandingHero from '../components/Landing/LandingHero';

const LandingPage: React.FC = () => (
  <div style={{ background: '#0a0818', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
    <LandingNav />
    <LandingHero />
    <p style={{ padding: 40, opacity: 0.4 }}>Sections — coming soon</p>
  </div>
);

export default LandingPage;
```

- [ ] **Step 3: Build**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Landing/LandingHero.tsx src/pages/LandingPage.tsx
git commit -m "feat: add LandingHero with split layout and code panel"
```

---

### Task 5: LandingWhatYouCanMake + LandingCta + LandingFooter

These three sections are short and can be built in one task.

**Files:**
- Create: `src/components/Landing/LandingWhatYouCanMake.tsx`
- Create: `src/components/Landing/LandingCta.tsx`
- Create: `src/components/Landing/LandingFooter.tsx`
- Modify: `src/pages/LandingPage.tsx`

- [ ] **Step 1: Create LandingWhatYouCanMake**

```tsx
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
```

- [ ] **Step 2: Create LandingCta**

```tsx
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
```

- [ ] **Step 3: Create LandingFooter**

```tsx
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
      <a href="/docs" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Tutorial</a>
    </div>
  </footer>
);

export default LandingFooter;
```

- [ ] **Step 4: Assemble final LandingPage**

```tsx
import React from 'react';
import LandingNav from '../components/Landing/LandingNav';
import LandingHero from '../components/Landing/LandingHero';
import LandingWhatYouCanMake from '../components/Landing/LandingWhatYouCanMake';
import LandingCta from '../components/Landing/LandingCta';
import LandingFooter from '../components/Landing/LandingFooter';

const LandingPage: React.FC = () => (
  <div style={{ background: '#0a0818', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
    <LandingNav />
    <LandingHero />
    <LandingWhatYouCanMake />
    <LandingCta />
    <LandingFooter />
  </div>
);

export default LandingPage;
```

- [ ] **Step 5: Build**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/Landing/LandingWhatYouCanMake.tsx src/components/Landing/LandingCta.tsx src/components/Landing/LandingFooter.tsx src/pages/LandingPage.tsx
git commit -m "feat: complete landing page — all sections assembled"
```
