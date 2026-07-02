import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddressBar } from './AddressBar';
import type { AddressBarItem } from './AddressBar';

const sampleHistory: AddressBarItem[] = [
  { path: 'C:\\Windows', label: 'Windows' },
  { path: 'C:\\Users', label: 'Users' },
  { path: 'C:\\Program Files', label: 'Program Files' },
];

describe('AddressBar', () => {
  it('renders label and select', () => {
    render(<AddressBar value="C:\\Windows" />);
    expect(screen.getByText('アドレス(D):')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders custom label', () => {
    render(<AddressBar value="C:\\Windows" label="Address:" />);
    expect(screen.getByText('Address:')).toBeInTheDocument();
  });

  it('select shows current value', () => {
    render(<AddressBar value={sampleHistory[0].path} history={sampleHistory} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe(sampleHistory[0].path);
  });

  it('changing select calls onNavigate', () => {
    const onNavigate = vi.fn();
    render(<AddressBar value="C:\\Windows" history={sampleHistory} onNavigate={onNavigate} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'C:\\Users' } });
    expect(onNavigate).toHaveBeenCalledWith('C:\\Users');
  });

  it('history items appear as options', () => {
    render(<AddressBar value="C:\\Windows" history={sampleHistory} />);
    expect(screen.getByRole('option', { name: 'Windows' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Program Files' })).toBeInTheDocument();
  });

  it('renders with empty history (just current value)', () => {
    // Use forward slashes to avoid jsdom backslash rendering quirks
    render(<AddressBar value="C:/Foo" />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(1);
    expect(options[0]).toHaveTextContent('C:/Foo');
  });

  it('does not duplicate current path in history options', () => {
    const historyWithDuplicate: AddressBarItem[] = [
      { path: 'C:\\Windows', label: 'Windows' },
      { path: 'C:\\Users', label: 'Users' },
    ];
    render(<AddressBar value="C:\\Windows" history={historyWithDuplicate} />);
    const options = screen.getAllByRole('option');
    const windowsOptions = options.filter((o) => o.textContent === 'Windows');
    expect(windowsOptions.length).toBe(1);
  });

  it('does not throw when onNavigate is not provided', () => {
    render(<AddressBar value="C:\\Windows" history={sampleHistory} />);
    const select = screen.getByRole('combobox');
    // Should not throw
    expect(() =>
      fireEvent.change(select, { target: { value: 'C:\\Users' } }),
    ).not.toThrow();
  });

  it('calls both onChange and onNavigate on select change', () => {
    const onChange = vi.fn();
    const onNavigate = vi.fn();
    render(
      <AddressBar
        value="C:\\Windows"
        history={sampleHistory}
        onChange={onChange}
        onNavigate={onNavigate}
      />,
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'C:\\Users' } });
    expect(onChange).toHaveBeenCalledWith('C:\\Users');
    expect(onNavigate).toHaveBeenCalledWith('C:\\Users');
  });
});
