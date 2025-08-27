"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Globe, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Domain {
  id: string;
  name: string;
  price?: number | any;
  category?: string;
  state?: string;
}

interface SearchSuggestionsProps {
  suggestions: { id: string; name: string; }[];
  onSuggestionClick: (suggestion: { id: string; name: string; }) => void;
  onClose: () => void;
  className?: string;
}

export function SearchSuggestions({
  suggestions,
  onSuggestionClick,
  onClose,
  className,
}: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  return (
    <Card className={cn("shadow-lg border-0", className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Search Suggestions
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
                      {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <span>Click to search for this domain</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-xs text-gray-400 ml-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>Popular</span>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-3 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Updated recently</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
