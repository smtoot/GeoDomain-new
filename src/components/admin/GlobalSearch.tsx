'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, User, Globe, MessageSquare, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export interface SearchResult {
  id: string;
  type: 'user' | 'domain' | 'inquiry' | 'deal' | 'message' | 'support';
  title: string;
  subtitle: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  metadata?: {
    status?: string;
    date?: string;
    value?: string;
  };
}

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  onResultClick?: (result: SearchResult) => void;
}

export function GlobalSearch({ 
  className, 
  placeholder = "Search users, domains, inquiries...",
  onResultClick 
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search API call
  const { data: searchResults, isLoading } = trpc.admin.globalSearch.useQuery(
    { query: debouncedQuery },
    { 
      enabled: debouncedQuery.length >= 2,
      refetchOnWindowFocus: false
    }
  );

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('admin-recent-searches', JSON.stringify(updated));
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    
    if (onResultClick) {
      onResultClick(result);
    } else {
      router.push(result.url);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const results = searchResults || [];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          // Perform search if no result selected
          saveRecentSearch(query);
          router.push(`/admin/search?q=${encodeURIComponent(query)}`);
          setIsOpen(false);
          setQuery('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get icon for search result type
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user': return User;
      case 'domain': return Globe;
      case 'inquiry': return MessageSquare;
      case 'deal': return DollarSign;
      case 'message': return FileText;
      case 'support': return MessageSquare;
      default: return FileText;
    }
  };

  // Get type color for badge
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'domain': return 'bg-green-100 text-green-800';
      case 'inquiry': return 'bg-yellow-100 text-yellow-800';
      case 'deal': return 'bg-purple-100 text-purple-800';
      case 'message': return 'bg-gray-100 text-gray-800';
      case 'support': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-md', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading && debouncedQuery.length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Searching...
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => {
                  const Icon = getResultIcon(result.type);
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                        isSelected && 'bg-gray-50'
                      )}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs', getTypeColor(result.type))}
                            >
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </p>
                          {result.metadata && (
                            <div className="flex items-center gap-2 mt-1">
                              {result.metadata.status && (
                                <Badge variant="outline" className="text-xs">
                                  {result.metadata.status}
                                </Badge>
                              )}
                              {result.metadata.date && (
                                <span className="text-xs text-gray-500">
                                  {result.metadata.date}
                                </span>
                              )}
                              {result.metadata.value && (
                                <span className="text-xs text-gray-500">
                                  {result.metadata.value}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-1">Try different keywords or check spelling</p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-2"
                    onClick={() => {
                      setQuery(search);
                      inputRef.current?.focus();
                    }}
                  >
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-sm text-gray-600">{search}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Start typing to search</p>
                <p className="text-sm mt-1">Search across users, domains, inquiries, and more</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Search shortcuts component
export function SearchShortcuts() {
  const shortcuts = [
    { key: 'users', label: 'Users', icon: User, url: '/admin/users' },
    { key: 'domains', label: 'Domains', icon: Globe, url: '/admin/domains' },
    { key: 'inquiries', label: 'Inquiries', icon: MessageSquare, url: '/admin/inquiries' },
    { key: 'deals', label: 'Deals', icon: DollarSign, url: '/admin/deals' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Quick access:</span>
      {shortcuts.map((shortcut) => (
        <Button
          key={shortcut.key}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => window.location.href = shortcut.url}
        >
          <shortcut.icon className="h-3 w-3 mr-1" />
          {shortcut.label}
        </Button>
      ))}
    </div>
  );
}
