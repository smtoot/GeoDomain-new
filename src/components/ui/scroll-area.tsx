'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string | number;
  orientation?: 'vertical' | 'horizontal';
}

export function ScrollArea({
  children,
  className,
  maxHeight = '400px',
  orientation = 'vertical',
  ...props
}: ScrollAreaProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className={cn(
        'relative overflow-auto',
        orientation === 'vertical' && 'max-h-full',
        orientation === 'horizontal' && 'max-w-full',
        className
      )}
      style={{
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
