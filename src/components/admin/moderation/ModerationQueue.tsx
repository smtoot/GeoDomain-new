'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ModerationQueueProps {
  pendingInquiries: number;
  pendingMessages: number;
  onViewInquiries: () => void;
  onViewMessages: () => void;
}

export function ModerationQueue({ 
  pendingInquiries, 
  pendingMessages, 
  onViewInquiries, 
  onViewMessages 
}: ModerationQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Moderation Queue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending Inquiries</p>
                      <p className="text-2xl font-bold">{pendingInquiries}</p>
                    </div>
                  </div>
                  {pendingInquiries > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={onViewInquiries}
                    >
                      Review Inquiries
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending Messages</p>
                      <p className="text-2xl font-bold">{pendingMessages}</p>
                    </div>
                  </div>
                  {pendingMessages > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={onViewMessages}
                    >
                      Review Messages
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {pendingInquiries === 0 && pendingMessages === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No items pending moderation.</p>
              </div>
            )}

            {pendingInquiries > 0 || pendingMessages > 0 ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Action Required</h4>
                    <p className="text-sm text-blue-800">
                      You have {pendingInquiries + pendingMessages} items waiting for moderation review.
                      Please review them to maintain platform quality and user experience.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Pending Inquiries</h3>
              <Badge variant="secondary">{pendingInquiries} items</Badge>
            </div>
            
            {pendingInquiries > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  These inquiries are waiting for admin review before being forwarded to sellers.
                </p>
                <Button onClick={onViewInquiries} className="w-full">
                  Review All Inquiries
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">No pending inquiries</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Pending Messages</h3>
              <Badge variant="secondary">{pendingMessages} items</Badge>
            </div>
            
            {pendingMessages > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  These messages between buyers and sellers are waiting for admin review.
                </p>
                <Button onClick={onViewMessages} className="w-full">
                  Review All Messages
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">No pending messages</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
