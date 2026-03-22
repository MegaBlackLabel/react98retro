import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  const tabs = [
    { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
    { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
  ];

  it('renders all tab labels', () => {
    render(<Tabs tabs={tabs} />);

    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 3' })).toBeInTheDocument();
  });

  it('shows correct content for active tab', () => {
    render(<Tabs tabs={tabs} defaultActiveTab="tab2" />);

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('clicking a tab changes active tab', async () => {
    const user = userEvent.setup();

    render(<Tabs tabs={tabs} defaultActiveTab="tab1" />);

    await user.click(screen.getByRole('link', { name: 'Tab 2' }));

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('applies multirows class when multirows=true', () => {
    render(<Tabs tabs={tabs} multirows />);

    expect(screen.getByRole('tablist')).toHaveClass('multirows');
  });

  it("controlled mode calls onTabChange and doesn't change internal state", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    const { rerender } = render(
      <Tabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />,
    );

    await user.click(screen.getByRole('link', { name: 'Tab 2' }));

    expect(onTabChange).toHaveBeenCalledWith('tab2');
    expect(screen.getByText('Content 1')).toBeInTheDocument();

    rerender(<Tabs tabs={tabs} activeTab="tab2" onTabChange={onTabChange} />);

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });
});
