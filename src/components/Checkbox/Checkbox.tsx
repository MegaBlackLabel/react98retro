import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { FieldRow } from '../FieldRow';

export interface CheckboxProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id'> {
  id: string;
  label: ReactNode;
  stacked?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, stacked = false, ...props }, ref) => (
    <FieldRow stacked={stacked}>
      <input ref={ref} type="checkbox" id={id} {...props} />
      <label htmlFor={id}>{label}</label>
    </FieldRow>
  ),
);

Checkbox.displayName = 'Checkbox';
