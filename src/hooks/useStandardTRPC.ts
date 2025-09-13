'use client';

import { trpc } from '@/lib/trpc';
import { useQueryErrorHandler } from './useQueryErrorHandler';

interface StandardTRPCOptions {
  enabled?: boolean;
  retry?: number;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  onError?: (error: Error) => void;
  context?: string;
}

// Standardized tRPC query hook with consistent error handling
export function useStandardTRPCQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: StandardTRPCOptions = {}
) {
  const {
    enabled = true,
    retry = 2,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false,
    onError,
    context = `tRPC ${queryKey}`
  } = options;

  const { handleQueryError } = useQueryErrorHandler({
    context,
    onError
  });

  return trpc.useQuery(queryKey, queryFn, {
    enabled,
    retry,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    onError: handleQueryError,
  });
}

// Standardized tRPC mutation hook
export function useStandardTRPCMutation<TData, TVariables>(
  mutationKey: string,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    successMessage?: string;
    context?: string;
  } = {}
) {
  const {
    onSuccess,
    onError,
    successMessage,
    context = `tRPC ${mutationKey}`
  } = options;

  const { handleMutationError } = useQueryErrorHandler({
    context,
    onError
  });

  return trpc.useMutation(mutationKey, mutationFn, {
    onSuccess: (data, variables) => {
      if (successMessage) {
        // You can add toast notification here
        }
      onSuccess?.(data, variables);
    },
    onError: handleMutationError,
  });
}

// Helper function to extract data from tRPC responses consistently
export function extractTRPCData<T>(response: any): T | null {
  if (!response) return null;
  
  // Handle different response structures
  if (response.data) {
    return response.data;
  }
  
  if (response.json) {
    return response.json;
  }
  
  return response;
}
