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
