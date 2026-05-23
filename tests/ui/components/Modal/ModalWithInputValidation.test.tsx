// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ModalWithInput from '../../../../src/components/Modal/ModalWithInput';

// Validate prop: returns non-null error string when invalid, null when valid.
const rejectNumbers = (value: string): string | null =>
  /\d/.test(value) ? 'No numbers allowed' : null;

test('does not show error message when modal first opens', async () => {
  const user = userEvent.setup();
  render(
    <ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} validate={rejectNumbers} />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  expect(screen.queryByText('No numbers allowed')).not.toBeInTheDocument();
});

test('shows inline error when input is invalid', async () => {
  const user = userEvent.setup();
  render(
    <ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} validate={rejectNumbers} />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), 'file123');
  expect(screen.getByText('No numbers allowed')).toBeInTheDocument();
});

test('error disappears when input becomes valid', async () => {
  const user = userEvent.setup();
  render(
    <ModalWithInput title="New file" openText="+" onSubmit={vi.fn()} validate={rejectNumbers} />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), '123');
  expect(screen.getByText('No numbers allowed')).toBeInTheDocument();
  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'valid');
  expect(screen.queryByText('No numbers allowed')).not.toBeInTheDocument();
});

test('does not call onSubmit when input is invalid', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <ModalWithInput
      title="New file"
      openText="+"
      saveText="Save"
      onSubmit={onSubmit}
      validate={rejectNumbers}
    />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), 'file123');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).not.toHaveBeenCalled();
});

test('does not submit on Enter key when input is invalid', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <ModalWithInput
      title="New file"
      openText="+"
      onSubmit={onSubmit}
      validate={rejectNumbers}
    />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), '123{Enter}');
  expect(onSubmit).not.toHaveBeenCalled();
});

test('calls onSubmit when input is valid and validate prop is provided', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <ModalWithInput
      title="New file"
      openText="+"
      saveText="Save"
      onSubmit={onSubmit}
      validate={rejectNumbers}
    />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), 'Main');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveBeenCalledWith('Main');
});

test('works normally (no validation) when validate prop is omitted', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();
  render(
    <ModalWithInput title="New file" openText="+" saveText="Save" onSubmit={onSubmit} />
  );
  await user.click(screen.getByRole('button', { name: '+' }));
  await user.type(screen.getByRole('textbox'), 'anything123');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmit).toHaveBeenCalledWith('anything123');
});
