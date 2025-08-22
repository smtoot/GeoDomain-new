'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  User,
  Globe,
  FileText,
  CreditCard,
  TrendingUp,
  Mail,
  Phone,
  Building,
  ArrowLeft,
  Download,
  Share2,
  Edit
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';

interface DealDetailProps {
  deal: {
    id: string;
    inquiry: {
      buyerName: string;
      buyerEmail: string;
      buyerPhone: string | null;
      buyerCompany: string | null;
      budgetRange: string;
      intendedUse: string;
      timeline: string | null;
      message: string;
              domain: {
          id: string;
          name: string;
          price: any; // Decimal type from Prisma
          logoUrl: string | null | undefined;
          owner: {
            id: string;
            name: string | null;
            email: string;
            phone: string | null;
          };
        };
    };
    buyer: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
    };
    seller: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
    };
    agreedPrice: any; // Decimal type from Prisma
    currency: string;
    paymentMethod: string;
    paymentInstructions: string;
    timeline: string;
    terms: string;
    status: string;
    adminNotes: string | null;
    agreedDate: Date | null;
    paymentConfirmedDate: Date | null;
    transferInitiatedDate: Date | null;
    completedDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  userRole: 'BUYER' | 'SELLER' | 'ADMIN';
  onBack: () => void;
  onUpdateStatus?: (status: string) => Promise<void>;
  onDownloadDocument?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
}

export default function DealDetail({
  deal,
  userRole,
  onBack,
  onUpdateStatus,
  onDownloadDocument,
  onShare,
  onEdit
}: DealDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AGREED': return 'default';
      case 'PAYMENT_PENDING': return 'secondary';
      case 'PAYMENT_CONFIRMED': return 'default';
      case 'TRANSFER_INITIATED': return 'default';
      case 'COMPLETED': return 'default';
      case 'DISPUTED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AGREED': return <CheckCircle className="h-4 w-4" />;
      case 'PAYMENT_PENDING': return <Clock className="h-4 w-4" />;
      case 'PAYMENT_CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'TRANSFER_INITIATED': return <TrendingUp className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'ESCROW_COM': return { name: 'Escrow.com', icon: <CreditCard className="h-4 w-4" /> };
      case 'PAYPAL': return { name: 'PayPal', icon: <CreditCard className="h-4 w-4" /> };
      case 'WIRE_TRANSFER': return { name: 'Wire Transfer', icon: <CreditCard className="h-4 w-4" /> };
      case 'CRYPTO': return { name: 'Cryptocurrency', icon: <CreditCard className="h-4 w-4" /> };
      case 'OTHER': return { name: 'Other Method', icon: <CreditCard className="h-4 w-4" /> };
      default: return { name: method, icon: <CreditCard className="h-4 w-4" /> };
    }
  };

  const getNextAction = () => {
    switch (deal.status) {
      case 'AGREED':
        return userRole === 'BUYER' ? 'Complete Payment' : 'Wait for Payment';
      case 'PAYMENT_PENDING':
        return userRole === 'BUYER' ? 'Upload Payment Proof' : 'Wait for Payment Confirmation';
      case 'PAYMENT_CONFIRMED':
        return userRole === 'SELLER' ? 'Initiate Transfer' : 'Wait for Transfer';
      case 'TRANSFER_INITIATED':
        return 'Transfer in Progress';
      case 'COMPLETED':
        return 'Deal Completed';
      case 'DISPUTED':
        return 'Dispute Resolution';
      default:
        return 'Review Deal';
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onUpdateStatus) return;
    
    setIsUpdating(true);
    try {
      await onUpdateStatus(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const paymentInfo = getPaymentMethodInfo(deal.paymentMethod);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deal Details</h1>
            <p className="text-gray-600">Deal ID: {deal.id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onDownloadDocument && (
            <Button variant="outline" size="sm" onClick={onDownloadDocument}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deal Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Domain Information</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {deal.inquiry.domain.logoUrl ? (
                      <img
                        src={deal.inquiry.domain.logoUrl}
                        alt={`${deal.inquiry.domain.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-lg">{deal.inquiry.domain.name}</div>
                      <div className="text-sm text-gray-600">Original Price: {formatPrice(Number(deal.inquiry.domain.price))}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Deal Status</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={getStatusBadgeVariant(deal.status)} className="flex items-center gap-1">
                      {getStatusIcon(deal.status)}
                      {deal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">{getNextAction()}</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatPrice(Number(deal.agreedPrice), deal.currency)}</div>
                  <div className="text-sm text-blue-700">Agreed Price</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {paymentInfo.icon}
                    <span className="font-semibold text-green-600">{paymentInfo.name}</span>
                  </div>
                  <div className="text-sm text-green-700">Payment Method</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-purple-600">{deal.timeline}</div>
                  <div className="text-sm text-purple-700">Timeline</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{deal.paymentInstructions}</div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deal Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">{deal.terms}</div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          {deal.adminNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">{deal.adminNotes}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <div className="font-medium text-sm">Deal Created</div>
                    <div className="text-xs text-gray-600">{formatDate(deal.createdAt)}</div>
                  </div>
                </div>
                
                {deal.agreedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Deal Agreed</div>
                      <div className="text-xs text-gray-600">{formatDate(deal.agreedDate)}</div>
                    </div>
                  </div>
                )}
                
                {deal.paymentConfirmedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Payment Confirmed</div>
                      <div className="text-xs text-gray-600">{formatDate(deal.paymentConfirmedDate)}</div>
                    </div>
                  </div>
                )}
                
                {deal.transferInitiatedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Transfer Initiated</div>
                      <div className="text-xs text-gray-600">{formatDate(deal.transferInitiatedDate)}</div>
                    </div>
                  </div>
                )}
                
                {deal.completedDate && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Deal Completed</div>
                      <div className="text-xs text-gray-600">{formatDate(deal.completedDate)}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Buyer</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{deal.buyer.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{deal.buyer.email}</span>
                  </div>
                  {deal.buyer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{deal.buyer.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Seller</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{deal.seller.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{deal.seller.email}</span>
                  </div>
                  {deal.seller.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{deal.seller.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {onUpdateStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deal.status === 'AGREED' && (
                  <Button
                    onClick={() => handleStatusUpdate('PAYMENT_PENDING')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Mark Payment Pending
                  </Button>
                )}
                
                {deal.status === 'PAYMENT_PENDING' && (
                  <Button
                    onClick={() => handleStatusUpdate('PAYMENT_CONFIRMED')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Confirm Payment
                  </Button>
                )}
                
                {deal.status === 'PAYMENT_CONFIRMED' && (
                  <Button
                    onClick={() => handleStatusUpdate('TRANSFER_INITIATED')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Initiate Transfer
                  </Button>
                )}
                
                {deal.status === 'TRANSFER_INITIATED' && (
                  <Button
                    onClick={() => handleStatusUpdate('COMPLETED')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Mark Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
