// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ModalWithInput from '../../../../src/components/Modal/ModalWithInput';

test('renders trigger button with openText', () => {
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument();
});

test('modal is not visible initially', () => {
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('opens modal when trigger is clicked', async () => {
  const user = userEvent.setup();
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('New file')).toBeInTheDocument();
});

test('Escape closes the modal', async () => {
  const user = userEvent.setup();
  render(<ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('calls onSubmit with input value and closes', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(<ModalWithInput title="New file" openText="+" saveText="Save" onSubmit={onSubmit} />);
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), 'utils.bas');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveBeenCalledWith('utils.bas');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
