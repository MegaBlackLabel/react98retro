import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './AddressBar.module.css';

export type AddressBarItem = {
  path: string;
  icon?: string;
  label?: string;
};

export type AddressBarProps = {
  value: string;
  onChange?: (value: string) => void;
  onNavigate?: (path: string) => void;
  history?: AddressBarItem[];
  label?: string;
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'>;

export function AddressBar({
  value,
  onChange,
  onNavigate,
  history = [],
  label = 'アドレス(D):',
  className,
  ...rest
}: AddressBarProps) {
  const [selectValue, setSelectValue] = useState(value);

  // Sync controlled value
  useEffect(() => {
    setSelectValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectValue(newValue);
    onChange?.(newValue);
    onNavigate?.(newValue);
  };

  // Build options: always include current value, then history items
  const options: AddressBarItem[] = [
    { path: value, label: value },
    ...history.filter((h) => h.path !== value),
  ];

  return (
    <div className={clsx(styles.addressBar, className)} {...rest}>
      <div className={styles.grip} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        value={selectValue}
        onChange={handleChange}
        aria-label={label}
      >
        {options.map((item, i) => (
          <option key={i} value={item.path}>
            {item.label ?? item.path}
          </option>
        ))}
      </select>
    </div>
  );
}

AddressBar.displayName = 'AddressBar';
