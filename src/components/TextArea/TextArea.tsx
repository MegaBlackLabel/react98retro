import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { FieldRow } from '../FieldRow';

export interface TextAreaProps
  extends Omit<ComponentPropsWithoutRef<'textarea'>, 'id'> {
  /** 省略可。label がある場合のみ内部的に生成される */
  id?: string;
  /** 省略すると label 要素を描画しない (aria-label 等で名前を付ける) */
  label?: ReactNode;
  stacked?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ id, label, stacked = true, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? (label != null ? generatedId : undefined);

    return (
      <FieldRow stacked={stacked}>
        {label != null && <label htmlFor={inputId}>{label}</label>}
        <textarea ref={ref} id={inputId} {...props} />
      </FieldRow>
    );
  },
);

TextArea.displayName = 'TextArea';
