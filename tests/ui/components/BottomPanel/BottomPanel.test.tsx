// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogItemType } from '../../../../src/Types/LogItem';
import BottomPanel from '../../../../src/components/BottomPanel';

const logs = [
  { type: LogItemType.Notice, text: 'compiled ok' },
  { type: LogItemType.Error, text: 'main.bas:4 undefined var' },
  { type: LogItemType.Output, text: 'score = 10' },
];

test('renders Console tab active by default', () => {
  render(<BottomPanel logs={logs} />);
  expect(screen.getByRole('tab', { name: /console/i })).toHaveAttribute('aria-selected', 'true');
});

test('shows all logs in console tab', () => {
  render(<BottomPanel logs={logs} />);
  expect(screen.getByText('compiled ok')).toBeInTheDocument();
  expect(screen.getByText('score = 10')).toBeInTheDocument();
});

test('Problems tab badge shows error count', () => {
  render(<BottomPanel logs={logs} />);
  // 1 error log — badge should show 1
  const problemsTab = screen.getByRole('tab', { name: /problems/i });
  expect(problemsTab.textContent).toContain('1');
});

test('switching to Problems tab shows only errors', async () => {
  const user = userEvent.setup();
  render(<BottomPanel logs={logs} />);
  await user.click(screen.getByRole('tab', { name: /problems/i }));
  expect(screen.getByText('main.bas:4 undefined var')).toBeInTheDocument();
  expect(screen.queryByText('compiled ok')).not.toBeInTheDocument();
  expect(screen.queryByText('score = 10')).not.toBeInTheDocument();
});

test('collapse button toggles panel body visibility', async () => {
  const user = userEvent.setup();
  render(<BottomPanel logs={logs} />);
  const toggle = screen.getByRole('button', { name: /collapse|expand/i });
  await user.click(toggle);
  expect(screen.queryByText('compiled ok')).not.toBeInTheDocument();
});
