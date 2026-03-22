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
});
