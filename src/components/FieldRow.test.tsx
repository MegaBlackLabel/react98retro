import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FieldRow } from './FieldRow';

describe('FieldRow', () => {
  it('renders with default field-row class', () => {
    const { container } = render(<FieldRow>Content</FieldRow>);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('field-row');
  });

  it('renders with stacked class when stacked=true', () => {
    const { container } = render(<FieldRow stacked>Content</FieldRow>);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('field-row-stacked');
    expect(div).not.toHaveClass('field-row');
  });

  it('merges custom className', () => {
    const { container } = render(<FieldRow className="custom">Content</FieldRow>);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass('field-row');
    expect(div).toHaveClass('custom');
  });

  it('forwards ref', () => {
    let refElement: HTMLDivElement | null = null;
    render(<FieldRow ref={(el) => { refElement = el; }}>Content</FieldRow>);
    expect(refElement).toBeInstanceOf(HTMLDivElement);
  });

  it('passes through data attributes', () => {
    const { container } = render(<FieldRow data-testid="row">Content</FieldRow>);
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveAttribute('data-testid', 'row');
  });

  it('renders children', () => {
    const { container } = render(<FieldRow><span>Child</span></FieldRow>);
    expect(container.querySelector('span')).toHaveTextContent('Child');
  });
});
