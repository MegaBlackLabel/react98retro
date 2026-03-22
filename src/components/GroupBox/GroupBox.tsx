import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

export interface GroupBoxProps extends ComponentPropsWithoutRef<'fieldset'> {
  legend?: ReactNode;
}

export const GroupBox = forwardRef<HTMLFieldSetElement, GroupBoxProps>(
  ({ legend, children, ...props }, ref) => (
    <fieldset ref={ref} {...props}>
      {legend != null ? <legend>{legend}</legend> : null}
      {children}
    </fieldset>
  ),
);

GroupBox.displayName = 'GroupBox';
