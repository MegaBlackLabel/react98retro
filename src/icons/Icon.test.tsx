import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Icon } from './Icon';
import { ICONS } from './icons';

describe('Icon', () => {
  it('renders an img with default size 16', () => {
    const { container } = render(<Icon name="hardDrive" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '16');
    expect(img).toHaveAttribute('height', '16');
  });

  it('renders with size 32', () => {
    const { container } = render(<Icon name="hardDrive" size={32} />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '32');
    expect(img).toHaveAttribute('height', '32');
  });

  it('has empty default alt', () => {
    const { container } = render(<Icon name="hardDrive" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
  });

  it('renders with custom alt', () => {
    const { container } = render(<Icon name="hardDrive" alt="Hard Drive" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Hard Drive');
  });

  it('has draggable=false', () => {
    const { container } = render(<Icon name="hardDrive" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('draggable', 'false');
  });

  it('applies custom className', () => {
    const { container } = render(<Icon name="hardDrive" className="my-icon" />);
    const img = container.querySelector('img');
    expect(img).toHaveClass('my-icon');
  });

  it('applies custom style', () => {
    const { container } = render(<Icon name="hardDrive" style={{ opacity: 0.5 }} />);
    const img = container.querySelector('img');
    expect(img).toHaveStyle({ opacity: '0.5' });
  });

  it('sets src to the correct CDN URL', () => {
    const { container } = render(<Icon name="hardDrive" />);
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', ICONS.hardDrive);
  });
});
