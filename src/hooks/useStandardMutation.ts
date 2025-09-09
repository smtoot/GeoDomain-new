'use client';

import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useQueryErrorHandler } from './useQueryErrorHandler';
import { showSuccessToast } from '@/components/error/ErrorToast';

interface StandardMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  successMessage?: string;
  context?: string;
  invalidateQueries?: string[];
}

export function useStandardMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: StandardMutationOptions<TData, TVariables> = {}
) {
  const {
    onSuccess,
    onError,
    successMessage,
    context = 'Mutation',
    invalidateQueries = []
  } = options;

  const { handleMutationError } = useQueryErrorHandler({
    context,
    onError
  });

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (successMessage) {
        showSuccessToast(successMessage);
      }
      onSuccess?.(data, variables);
    },
    onError: handleMutationError,
  });
}

// Standardized tRPC mutation hook
export function useStandardTRPCMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: StandardMutationOptions<TData, TVariables> = {}
) {
  return useStandardMutation(mutationFn, {
    ...options,
    context: `tRPC ${options.context || 'Mutation'}`
  });
}
