'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckSquare, 
  Square, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  MessageSquare,
  FileText
} from 'lucide-react';
import { adminNotifications } from '@/components/notifications/ToastNotification';

interface BulkActionsProps {
  type: 'inquiries' | 'messages';
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onBulkAction: (action: string, data: any) => Promise<void>;
  totalItems: number;
  isLoading?: boolean;
}

export function BulkActions({ 
  type, 
  selectedItems, 
  onSelectionChange, 
  onBulkAction, 
  totalItems,
  isLoading = false 
}: BulkActionsProps) {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestedChanges, setRequestedChanges] = useState(['']);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < totalItems;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      // This would need to be implemented to get all item IDs
      // For now, we'll just clear selection
      onSelectionChange([]);
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.length === 0) {
      adminNotifications.moderationFailed('Please select items to perform bulk action');
      return;
    }

    setIsProcessing(true);
    try {
      let actionData: any = { adminNotes };

      if (selectedAction === 'REJECT') {
        if (!rejectionReason.trim()) {
          adminNotifications.moderationFailed('Rejection reason is required');
          return;
        }
        actionData.rejectionReason = rejectionReason;
      } else if (selectedAction === 'REQUEST_CHANGES') {
        const changes = requestedChanges.filter(change => change.trim());
        if (changes.length === 0) {
          adminNotifications.moderationFailed('At least one requested change is required');
          return;
        }
        actionData.requestedChanges = changes;
      }

      await onBulkAction(selectedAction, actionData);
      
      // Reset form
      setAdminNotes('');
      setRejectionReason('');
      setRequestedChanges(['']);
      setSelectedAction('');
      setIsActionModalOpen(false);
      onSelectionChange([]);
      
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionConfig = (action: string) => {
    const configs = {
      APPROVE: {
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Approve',
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'Approve all selected items'
      },
      REJECT: {
        icon: <XCircle className="h-4 w-4" />,
        label: 'Reject',
        color: 'bg-red-100 text-red-800 border-red-200',
        description: 'Reject all selected items'
      },
      REQUEST_CHANGES: {
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Request Changes',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        description: 'Request changes for all selected items'
      }
    };
    return configs[action as keyof typeof configs];
  };

  const availableActions = type === 'inquiries' 
    ? ['APPROVE', 'REJECT', 'REQUEST_CHANGES']
    : ['APPROVE', 'REJECT'];

  if (selectedItems.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={totalItems === 0}
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4 mr-2" />
          ) : (
            <Square className="h-4 w-4 mr-2" />
          )}
          Select All ({totalItems})
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedItems.length} {type} selected
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                Clear Selection
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => {
                const config = getActionConfig(action);
                return (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAction(action);
                      setIsActionModalOpen(true);
                    }}
                    disabled={isProcessing}
                    className={config.color}
                  >
                    {config.icon}
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getActionConfig(selectedAction).icon}
                Bulk {getActionConfig(selectedAction).label}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {getActionConfig(selectedAction).description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add notes about this bulk action..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {selectedAction === 'REJECT' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Explain why these items are being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}

              {selectedAction === 'REQUEST_CHANGES' && (
                <div>
                  <Label>Requested Changes *</Label>
                  {requestedChanges.map((change, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Textarea
                        placeholder={`Change ${index + 1}...`}
                        value={change}
                        onChange={(e) => {
                          const newChanges = [...requestedChanges];
                          newChanges[index] = e.target.value;
                          setRequestedChanges(newChanges);
                        }}
                        rows={2}
                      />
                      {requestedChanges.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newChanges = requestedChanges.filter((_, i) => i !== index);
                            setRequestedChanges(newChanges);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestedChanges([...requestedChanges, ''])}
                    className="mt-2"
                  >
                    Add Another Change
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAction}
                  disabled={isProcessing}
                  className={getActionConfig(selectedAction).color}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {getActionConfig(selectedAction).icon}
                      {getActionConfig(selectedAction).label} {selectedItems.length} Items
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
