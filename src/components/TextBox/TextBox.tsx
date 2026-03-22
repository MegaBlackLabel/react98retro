import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { FieldRow } from '../FieldRow';

export interface TextBoxProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id'> {
  id: string;
  label: ReactNode;
  stacked?: boolean;
}

export const TextBox = forwardRef<HTMLInputElement, TextBoxProps>(
  ({ id, label, stacked = false, ...props }, ref) => (
    <FieldRow stacked={stacked}>
      <label htmlFor={id}>{label}</label>
      <input ref={ref} type="text" id={id} {...props} />
    </FieldRow>
  ),
);

TextBox.displayName = 'TextBox';
