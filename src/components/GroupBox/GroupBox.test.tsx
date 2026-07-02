import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { GroupBox } from './GroupBox';
import { Checkbox } from '../Checkbox/Checkbox';

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

  it('renders a real fieldset element', () => {
    render(<GroupBox legend="Settings" />);

    expect(screen.getByRole('group', { name: 'Settings' })).toBeInTheDocument();
  });

  it('renders a legend element', () => {
    render(<GroupBox legend="Preferences" />);

    const fieldset = screen.getByRole('group', { name: 'Preferences' });
    const legend = fieldset.querySelector('legend');
    expect(legend).toBeInTheDocument();
    expect(legend).toHaveTextContent('Preferences');
  });

  it('nested controls are label-queryable', () => {
    render(
      <GroupBox legend="Options">
        <Checkbox id="cb-gb" label="Enable feature" />
      </GroupBox>,
    );

    expect(screen.getByLabelText('Enable feature')).toBeInTheDocument();
  });
});
