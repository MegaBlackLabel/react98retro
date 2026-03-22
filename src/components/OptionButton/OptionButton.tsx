import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { FieldRow } from '../FieldRow';

export interface OptionButtonProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id' | 'name'> {
  id: string;
  name: string;
  label: ReactNode;
  stacked?: boolean;
}

export const OptionButton = forwardRef<HTMLInputElement, OptionButtonProps>(
  ({ id, name, label, stacked = false, ...props }, ref) => (
    <FieldRow stacked={stacked}>
      <input ref={ref} type="radio" id={id} name={name} {...props} />
      <label htmlFor={id}>{label}</label>
    </FieldRow>
  ),
);

OptionButton.displayName = 'OptionButton';
