import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { FieldRow } from '../FieldRow';

export interface TextBoxProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id'> {
  /** 省略可。label がある場合のみ内部的に生成される */
  id?: string;
  /** 省略すると label 要素を描画しない (aria-label 等で名前を付ける) */
  label?: ReactNode;
  stacked?: boolean;
}

export const TextBox = forwardRef<HTMLInputElement, TextBoxProps>(
  ({ id, label, stacked = false, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? (label != null ? generatedId : undefined);

    return (
      <FieldRow stacked={stacked}>
        {label != null && <label htmlFor={inputId}>{label}</label>}
        <input ref={ref} type="text" id={inputId} {...props} />
      </FieldRow>
    );
  },
);

TextBox.displayName = 'TextBox';
