import { render, screen, fireEvent } from '@testing-library/react';
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

  it('disabled tab has aria-disabled and does not change content when clicked', async () => {
    const user = userEvent.setup();
    const disabledTabs = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1', disabled: true },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    ];

    render(<Tabs tabs={disabledTabs} defaultActiveTab="tab2" />);

    const disabledTab = screen.getByRole('tab', { name: 'Tab 1' });
    expect(disabledTab).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByRole('link', { name: 'Tab 1' }));

    // Content should still be Content 2 (tab2), not Content 1
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('disabled tab does not call onTabChange when clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    const disabledTabs = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1', disabled: true },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
    ];

    render(<Tabs tabs={disabledTabs} onTabChange={onTabChange} />);

    await user.click(screen.getByRole('link', { name: 'Tab 1' }));

    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('selects first enabled tab when the first tab is disabled', () => {
    const disabledTabs = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1', disabled: true },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2' },
      { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
    ];

    render(<Tabs tabs={disabledTabs} />);

    // First enabled tab (tab2) should be selected
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('aria-selected', 'false');
  });

  it('ArrowRight changes to next enabled tab', () => {
    render(<Tabs tabs={tabs} defaultActiveTab="tab1" />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('ArrowLeft changes to previous enabled tab', () => {
    render(<Tabs tabs={tabs} defaultActiveTab="tab3" />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('Home key jumps to first enabled tab', () => {
    render(<Tabs tabs={tabs} defaultActiveTab="tab3" />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });

    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('End key jumps to last enabled tab', () => {
    render(<Tabs tabs={tabs} defaultActiveTab="tab1" />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'End' });

    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });

  it('keyboard navigation skips disabled tabs', () => {
    const mixedTabs = [
      { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
      { id: 'tab2', label: 'Tab 2', content: 'Content 2', disabled: true },
      { id: 'tab3', label: 'Tab 3', content: 'Content 3' },
    ];

    render(<Tabs tabs={mixedTabs} defaultActiveTab="tab1" />);

    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    // Should skip disabled tab2, go to tab3
    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });
});
