import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { FieldRow } from '../FieldRow';

export interface TextAreaProps
  extends Omit<ComponentPropsWithoutRef<'textarea'>, 'id'> {
  id: string;
  label: ReactNode;
  stacked?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ id, label, stacked = true, ...props }, ref) => (
    <FieldRow stacked={stacked}>
      <label htmlFor={id}>{label}</label>
      <textarea ref={ref} id={id} {...props} />
    </FieldRow>
  ),
);

TextArea.displayName = 'TextArea';
