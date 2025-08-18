import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, DollarSign, User, Building } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface InquiryCardProps {
  inquiry: {
    id: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone?: string;
    buyerCompany?: string;
    budgetRange: string;
    intendedUse: string;
    timeline?: string;
    message: string;
    status: string;
    createdAt: Date;
    domain: {
      id: string;
      name: string;
      price: number;
      logoUrl?: string;
    };
    messages: Array<{
      id: string;
      content: string;
      status: string;
      sentDate: Date;
    }>;
  };
  onView: (inquiryId: string) => void;
  onMessage?: (inquiryId: string) => void;
  variant?: 'buyer' | 'seller' | 'admin';
}

export function InquiryCard({ inquiry, onView, onMessage, variant = 'buyer' }: InquiryCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'secondary';
      case 'APPROVED':
      case 'FORWARDED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CHANGES_REQUESTED':
        return 'outline';
      case 'COMPLETED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Under Review';
      case 'APPROVED':
        return 'Approved';
      case 'FORWARDED':
        return 'Forwarded to Seller';
      case 'REJECTED':
        return 'Rejected';
      case 'CHANGES_REQUESTED':
        return 'Changes Requested';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const getMessageCount = () => {
    return inquiry.messages.length;
  };

  const getLatestMessage = () => {
    if (inquiry.messages.length === 0) return null;
    return inquiry.messages[0]; // Assuming messages are sorted by date desc
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {inquiry.domain.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Submitted on {formatDate(inquiry.createdAt)}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                {getStatusText(inquiry.status)}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Buyer:</span>
                <span className="font-medium">{inquiry.buyerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Budget:</span>
                <span className="font-medium">{inquiry.budgetRange}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Timeline:</span>
                <span className="font-medium">{inquiry.timeline || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium">{getMessageCount()}</span>
              </div>
            </div>

            {inquiry.buyerCompany && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Company:</span>
                  <span className="font-medium">{inquiry.buyerCompany}</span>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Intended Use:</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{inquiry.intendedUse}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
              <p className="text-sm text-gray-600 line-clamp-3">{inquiry.message}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Contact: {inquiry.buyerEmail}</span>
              {inquiry.buyerPhone && <span>• {inquiry.buyerPhone}</span>}
            </div>

            {/* Latest Message Preview */}
            {getLatestMessage() && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Latest Message</span>
                  <span className="text-xs text-gray-500">
                    {formatDate(getLatestMessage()!.sentDate)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {getLatestMessage()!.content}
                </p>
                <Badge 
                  variant={getLatestMessage()!.status === 'APPROVED' ? 'default' : 'secondary'}
                  className="text-xs mt-2"
                >
                  {getLatestMessage()!.status === 'PENDING' ? 'Under Review' : getLatestMessage()!.status}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:w-48">
            <Button
              onClick={() => onView(inquiry.id)}
              className="w-full"
            >
              View Details
            </Button>
            
            {variant === 'buyer' && inquiry.status === 'FORWARDED' && onMessage && (
              <Button
                variant="outline"
                onClick={() => onMessage(inquiry.id)}
                className="w-full"
              >
                Continue Conversation
              </Button>
            )}

            {variant === 'seller' && inquiry.status === 'FORWARDED' && onMessage && (
              <Button
                variant="outline"
                onClick={() => onMessage(inquiry.id)}
                className="w-full"
              >
                Respond
              </Button>
            )}

            {variant === 'admin' && (
              <Button
                variant="outline"
                onClick={() => onView(inquiry.id)}
                className="w-full"
              >
                Review
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
