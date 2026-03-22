import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import clsx from 'clsx';

export interface SliderProps extends ComponentPropsWithoutRef<'input'> {
  boxIndicator?: boolean;
  vertical?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ boxIndicator = false, vertical = false, className, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        type="range"
        className={clsx(className, { 'has-box-indicator': boxIndicator })}
        {...props}
      />
    );

    if (!vertical) {
      return input;
    }

    return <div className="is-vertical">{input}</div>;
  },
);

Slider.displayName = 'Slider';
