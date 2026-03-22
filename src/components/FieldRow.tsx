import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import clsx from 'clsx';

export interface FieldRowProps extends ComponentPropsWithoutRef<'div'> {
  stacked?: boolean;
}

export const FieldRow = forwardRef<HTMLDivElement, FieldRowProps>(
  ({ stacked = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(stacked ? 'field-row-stacked' : 'field-row', className)}
      {...props}
    >
      {children}
    </div>
  ),
);

FieldRow.displayName = 'FieldRow';
