'use client';

import { ReactNode } from 'react';
import { FieldError, UseFormRegister, Path } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface FormFieldProps<T extends Record<string, any>> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  children: (props: {
    id: string;
    name: Path<T>;
    register: UseFormRegister<T>;
    error?: FieldError;
    className: string;
  }) => ReactNode;
  className?: string;
  description?: string;
}

export function FormField<T extends Record<string, any>>({
  label,
  name,
  register,
  error,
  required = false,
  children,
  className,
  description
}: FormFieldProps<T>) {
  const fieldId = `field-${String(name)}`;
  const hasError = !!error;

  return (
    <div className={cn('space-y-2', className)}>
      <label 
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {children({
        id: fieldId,
        name,
        register,
        error,
        className: cn(
          'w-full',
          hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
        )
      })}
      
      {error && (
        <p className="text-red-500 text-xs">
          {error.message}
        </p>
      )}
    </div>
  );
}
