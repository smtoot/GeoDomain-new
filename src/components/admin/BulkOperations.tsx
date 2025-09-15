'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Download, 
  Upload,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export interface BulkOperation {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (selectedIds: string[]) => Promise<void>;
  variant?: 'default' | 'destructive' | 'outline';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface BulkOperationsProps {
  selectedItems: string[];
  totalItems: number;
  operations: BulkOperation[];
  onSelectionChange: (selectedIds: string[]) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function BulkOperations({
  selectedItems,
  totalItems,
  operations,
  onSelectionChange,
  onSelectAll,
  onClearSelection,
  className
}: BulkOperationsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('');

  const handleOperation = async (operation: BulkOperation) => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to perform this operation');
      return;
    }

    if (operation.requiresConfirmation) {
      const confirmed = window.confirm(
        operation.confirmationMessage || 
        `Are you sure you want to ${operation.label.toLowerCase()} ${selectedItems.length} item(s)?`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    try {
      await operation.action(selectedItems);
      toast.success(`${operation.label} completed for ${selectedItems.length} item(s)`);
      onClearSelection();
    } catch (error) {
      toast.error(`Failed to ${operation.label.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === totalItems) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={cn(
      'flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg',
      className
    )}>
      {/* Selection Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected;
            }}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium text-gray-700">
            {selectedItems.length > 0 ? (
              <>
                {selectedItems.length} of {totalItems} selected
              </>
            ) : (
              `Select all ${totalItems} items`
            )}
          </span>
        </div>

        {selectedItems.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {selectedItems.length} selected
          </Badge>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 mr-2">Bulk actions:</span>
          
          {operations.map((operation) => (
            <Button
              key={operation.id}
              variant={operation.variant || 'outline'}
              size="sm"
              onClick={() => handleOperation(operation)}
              disabled={isProcessing}
              className="flex items-center gap-1"
            >
              <operation.icon className="h-3 w-3" />
              {operation.label}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

// Predefined bulk operations for common admin tasks
export const COMMON_BULK_OPERATIONS = {
  // User Management
  users: {
    approve: {
      id: 'approve-users',
      label: 'Approve',
      icon: CheckCircle,
      action: async (userIds: string[]) => {
        // Implementation would call tRPC mutation
        console.log('Approving users:', userIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'default' as const
    },
    reject: {
      id: 'reject-users',
      label: 'Reject',
      icon: XCircle,
      action: async (userIds: string[]) => {
        console.log('Rejecting users:', userIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'destructive' as const,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to reject these users?'
    },
    delete: {
      id: 'delete-users',
      label: 'Delete',
      icon: Trash2,
      action: async (userIds: string[]) => {
        console.log('Deleting users:', userIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'destructive' as const,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to permanently delete these users? This action cannot be undone.'
    }
  },

  // Domain Management
  domains: {
    approve: {
      id: 'approve-domains',
      label: 'Approve',
      icon: CheckCircle,
      action: async (domainIds: string[]) => {
        console.log('Approving domains:', domainIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'default' as const
    },
    reject: {
      id: 'reject-domains',
      label: 'Reject',
      icon: XCircle,
      action: async (domainIds: string[]) => {
        console.log('Rejecting domains:', domainIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'destructive' as const,
      requiresConfirmation: true
    },
    feature: {
      id: 'feature-domains',
      label: 'Feature',
      icon: CheckCircle,
      action: async (domainIds: string[]) => {
        console.log('Featuring domains:', domainIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'outline' as const
    }
  },

  // Message/Inquiry Management
  messages: {
    markRead: {
      id: 'mark-read',
      label: 'Mark Read',
      icon: CheckCircle,
      action: async (messageIds: string[]) => {
        console.log('Marking messages as read:', messageIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'default' as const
    },
    markUnread: {
      id: 'mark-unread',
      label: 'Mark Unread',
      icon: XCircle,
      action: async (messageIds: string[]) => {
        console.log('Marking messages as unread:', messageIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'outline' as const
    },
    delete: {
      id: 'delete-messages',
      label: 'Delete',
      icon: Trash2,
      action: async (messageIds: string[]) => {
        console.log('Deleting messages:', messageIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'destructive' as const,
      requiresConfirmation: true
    }
  },

  // Deal Management
  deals: {
    approve: {
      id: 'approve-deals',
      label: 'Approve',
      icon: CheckCircle,
      action: async (dealIds: string[]) => {
        console.log('Approving deals:', dealIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'default' as const
    },
    reject: {
      id: 'reject-deals',
      label: 'Reject',
      icon: XCircle,
      action: async (dealIds: string[]) => {
        console.log('Rejecting deals:', dealIds);
        await new Promise(resolve => setTimeout(resolve, 1000));
      },
      variant: 'destructive' as const,
      requiresConfirmation: true
    }
  }
};

// Hook for managing bulk operations state
export function useBulkOperations<T extends { id: string }>(
  items: T[],
  operations: BulkOperation[]
) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectionChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(items.map(item => item.id));
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const isSelected = (itemId: string) => selectedItems.includes(itemId);

  return {
    selectedItems,
    handleSelectionChange,
    handleSelectAll,
    handleClearSelection,
    isSelected,
    setSelectedItems
  };
}
