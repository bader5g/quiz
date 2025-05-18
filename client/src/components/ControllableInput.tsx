import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { ControllerRenderProps } from 'react-hook-form';

interface ControllableNumberInputProps {
  field: ControllerRenderProps<any, any>;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ControllableNumberInput = forwardRef<HTMLInputElement, ControllableNumberInputProps>(
  ({ field, min, max, placeholder, className, disabled }, ref) => {
    // تحويل القيمة إلى سلسلة نصية فارغة بدلاً من undefined أو null
    const value = field.value != null ? field.value : '';
    
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const value = e.target.value === '' ? undefined : Number(e.target.value);
          field.onChange(value);
        }}
        onBlur={field.onBlur}
        name={field.name}
        ref={ref || field.ref}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);

interface ControllableTextInputProps {
  field: ControllerRenderProps<any, any>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ControllableTextInput = forwardRef<HTMLInputElement, ControllableTextInputProps>(
  ({ field, placeholder, className, disabled }, ref) => {
    // تحويل القيمة إلى سلسلة نصية فارغة بدلاً من undefined أو null
    const value = field.value != null ? field.value : '';
    
    return (
      <Input
        type="text"
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        name={field.name}
        ref={ref || field.ref}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);