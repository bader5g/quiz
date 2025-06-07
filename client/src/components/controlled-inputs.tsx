import React, { forwardRef } from 'react';
import { Input } from "./ui/input";
import { ControllerRenderProps } from 'react-hook-form';

// مكون إدخال عددي متحكم به لمنع تحذيرات uncontrolled/controlled
export const ControlledNumberInput = forwardRef<
  HTMLInputElement,
  {
    field: ControllerRenderProps<any, any>;
    min?: number;
    max?: number;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
  }
>(({ field, min, max, disabled, placeholder, className }, ref) => {
  // التأكد من أن القيمة دائماً محددة لمنع التحويل من uncontrolled إلى controlled
  const value = field.value === undefined || field.value === null ? '' : field.value;
  
  return (
    <Input
      type="number"
      value={value}
      onChange={field.onChange}
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
});

// مكون إدخال نصي متحكم به
export const ControlledTextInput = forwardRef<
  HTMLInputElement,
  {
    field: ControllerRenderProps<any, any>;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
  }
>(({ field, disabled, placeholder, className }, ref) => {
  // التأكد من أن القيمة دائماً محددة لمنع التحويل من uncontrolled إلى controlled
  const value = field.value === undefined || field.value === null ? '' : field.value;
  
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
});
