import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';

export interface DropdownOption {
  value: string;
  label: ReactNode;
}

export interface DropdownProps extends ComponentPropsWithoutRef<'select'> {
  options?: DropdownOption[];
  children?: ReactNode;
}

export const Dropdown = forwardRef<HTMLSelectElement, DropdownProps>(
  ({ options, children, ...props }, ref) => (
    <select ref={ref} {...props}>
      {children ??
        options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  ),
);

Dropdown.displayName = 'Dropdown';
