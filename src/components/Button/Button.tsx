import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import clsx from 'clsx';

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'default' | 'standard';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'standard', className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(className, { default: variant === 'default' })}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
