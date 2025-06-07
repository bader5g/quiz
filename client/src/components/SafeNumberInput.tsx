import React, { forwardRef } from 'react';
import { Input } from "./ui/input";

interface SafeNumberInputProps {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * مكون إدخال رقمي آمن يتعامل بشكل صحيح مع حالات القيم غير المحددة وغير المتحكم بها
 */
const SafeNumberInput = forwardRef<HTMLInputElement, SafeNumberInputProps>(
  ({ value, onChange, ...props }, ref) => {
    // استخدام سلسلة نصية فارغة للقيم غير المحددة لمنع التحويل من uncontrolled إلى controlled
    const inputValue = value !== undefined && value !== null ? String(value) : '';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value === '' ? undefined : Number(e.target.value);
      onChange(newValue as number);
    };

    return (
      <Input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        ref={ref}
        {...props}
      />
    );
  }
);

SafeNumberInput.displayName = 'SafeNumberInput';

export default SafeNumberInput;
