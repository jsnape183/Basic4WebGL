// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';

function Hello() {
  return <span>hello</span>;
}

test('RTL renders a component', () => {
  render(<Hello />);
  expect(screen.getByText('hello')).toBeInTheDocument();
});
