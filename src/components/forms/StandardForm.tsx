'use client';

import { ReactNode } from 'react';
import { useForm, UseFormProps, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { cn } from '@/lib/utils';

interface StandardFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: UseFormProps<T>['defaultValues'];
  onSubmit: (data: T) => Promise<void> | void;
  children: (form: {
    register: ReturnType<typeof useForm<T>>['register'];
    handleSubmit: ReturnType<typeof useForm<T>>['handleSubmit'];
    formState: ReturnType<typeof useForm<T>>['formState'];
    setValue: ReturnType<typeof useForm<T>>['setValue'];
    watch: ReturnType<typeof useForm<T>>['watch'];
    reset: ReturnType<typeof useForm<T>>['reset'];
  }) => ReactNode;
  submitText?: string;
  isLoading?: boolean;
  className?: string;
  showSubmitButton?: boolean;
}

export function StandardForm<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  submitText = 'Submit',
  isLoading = false,
  className,
  showSubmitButton = true
}: StandardFormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { register, handleSubmit, formState, setValue, watch, reset } = form;

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={cn('space-y-6', className)}
    >
      {children({ register, handleSubmit, formState, setValue, watch, reset })}
      
      {showSubmitButton && (
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            submitText
          )}
        </Button>
      )}
    </form>
  );
}
