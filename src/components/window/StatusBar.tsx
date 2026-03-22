import { forwardRef } from 'react';
import clsx from 'clsx';

export interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const StatusBar = forwardRef<HTMLDivElement, StatusBarProps>(function StatusBar(
  { children, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={clsx('status-bar', className)} {...rest}>
      {children}
    </div>
  );
});

export interface StatusBarFieldProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const StatusBarField = forwardRef<HTMLParagraphElement, StatusBarFieldProps>(
  function StatusBarField({ children, className, ...rest }, ref) {
    return (
      <p ref={ref} className={clsx('status-bar-field', className)} {...rest}>
        {children}
      </p>
    );
  },
);
