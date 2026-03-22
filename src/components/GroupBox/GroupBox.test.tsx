import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { GroupBox } from './GroupBox';

describe('GroupBox', () => {
  it('renders with minimal props', () => {
    render(<GroupBox>Content</GroupBox>);

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders the legend', () => {
    render(
      <GroupBox legend="Title">
        <span>Content</span>
      </GroupBox>,
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('forwards additional props', () => {
    render(<GroupBox data-testid="groupbox" />);

    expect(screen.getByTestId('groupbox')).toBeInTheDocument();
  });
});
