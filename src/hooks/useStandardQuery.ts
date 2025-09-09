'use client';

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useQueryErrorHandler } from './useQueryErrorHandler';

interface StandardQueryOptions<T> {
  enabled?: boolean;
  retry?: number;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  onError?: (error: Error) => void;
  context?: string;
}

export function useStandardQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: StandardQueryOptions<T> = {}
) {
  const {
    enabled = true,
    retry = 2,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false,
    onError,
    context = 'Query'
  } = options;

  const { handleQueryError } = useQueryErrorHandler({
    context,
    onError
  });

  return useQuery({
    queryKey: [queryKey],
    queryFn,
    enabled,
    retry,
    staleTime,
    cacheTime,
    refetchOnWindowFocus,
    onError: handleQueryError,
  });
}

// Standardized tRPC query hook
export function useStandardTRPCQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: StandardQueryOptions<T> = {}
) {
  return useStandardQuery(queryKey, queryFn, {
    ...options,
    context: `tRPC ${queryKey}`
  });
}
