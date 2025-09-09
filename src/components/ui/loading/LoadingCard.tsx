'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function LoadingCard({ 
  title = 'Loading...', 
  description = 'Please wait while we load your content.',
  className,
  size = 'md'
}: LoadingCardProps) {
  return (
    <div className={`min-h-[400px] flex items-center justify-center p-4 ${className}`}>
      <Card className={`w-full ${sizeClasses[size]}`}>
        <CardHeader className="text-center">
          <LoadingSpinner size="lg" />
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
