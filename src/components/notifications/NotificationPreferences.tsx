'use client';

import { useState } from 'react';
import { useNotificationStore, type NotificationPreferences } from '@/lib/monitoring/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Monitor,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotificationStore();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleCategoryChange = (category: keyof NotificationPreferences['categories'], value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const handleTestNotification = () => {
    // This would trigger a test notification
    console.log('Test notification triggered');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
          <p className="text-gray-600">Manage how and when you receive notifications</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Delivery Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="email-notifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={localPreferences.email}
              onCheckedChange={(checked) => handlePreferenceChange('email', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-green-600" />
              <div>
                <Label htmlFor="push-notifications" className="text-sm font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive push notifications on your device
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={localPreferences.push}
              onCheckedChange={(checked) => handlePreferenceChange('push', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-purple-600" />
              <div>
                <Label htmlFor="in-app-notifications" className="text-sm font-medium">
                  In-App Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Show notifications within the application
                </p>
              </div>
            </div>
            <Switch
              id="in-app-notifications"
              checked={localPreferences.inApp}
              onCheckedChange={(checked) => handlePreferenceChange('inApp', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Categories
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose which types of notifications you want to receive
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="system-notifications" className="text-sm font-medium">
                  System Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Important system updates and maintenance
                </p>
              </div>
              <Switch
                id="system-notifications"
                checked={localPreferences.categories.system}
                onCheckedChange={(checked) => handleCategoryChange('system', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="inquiry-notifications" className="text-sm font-medium">
                  Domain Inquiries
                </Label>
                <p className="text-sm text-gray-500">
                  New inquiries for your domains
                </p>
              </div>
              <Switch
                id="inquiry-notifications"
                checked={localPreferences.categories.inquiry}
                onCheckedChange={(checked) => handleCategoryChange('inquiry', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="message-notifications" className="text-sm font-medium">
                  Messages
                </Label>
                <p className="text-sm text-gray-500">
                  New messages from buyers or sellers
                </p>
              </div>
              <Switch
                id="message-notifications"
                checked={localPreferences.categories.message}
                onCheckedChange={(checked) => handleCategoryChange('message', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="deal-notifications" className="text-sm font-medium">
                  Deal Updates
                </Label>
                <p className="text-sm text-gray-500">
                  Changes to deal status and progress
                </p>
              </div>
              <Switch
                id="deal-notifications"
                checked={localPreferences.categories.deal}
                onCheckedChange={(checked) => handleCategoryChange('deal', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="payment-notifications" className="text-sm font-medium">
                  Payment Updates
                </Label>
                <p className="text-sm text-gray-500">
                  Payment confirmations and verifications
                </p>
              </div>
              <Switch
                id="payment-notifications"
                checked={localPreferences.categories.payment}
                onCheckedChange={(checked) => handleCategoryChange('payment', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="domain-notifications" className="text-sm font-medium">
                  Domain Updates
                </Label>
                <p className="text-sm text-gray-500">
                  Domain verification and status changes
                </p>
              </div>
              <Switch
                id="domain-notifications"
                checked={localPreferences.categories.domain}
                onCheckedChange={(checked) => handleCategoryChange('domain', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <p className="text-sm text-gray-600">
            How often would you like to receive email notifications?
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label htmlFor="notification-frequency" className="text-sm font-medium">
              Frequency:
            </Label>
            <Select
              value={localPreferences.frequency}
              onValueChange={(value) => handlePreferenceChange('frequency', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Note: In-app notifications are always immediate regardless of this setting.
          </p>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
          <p className="text-sm text-gray-600">
            Test your notification settings to ensure they&apos;re working correctly
          </p>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleTestNotification}
            className="w-full"
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Test Notification
          </Button>
          <p className="text-sm text-gray-500 mt-2 text-center">
            This will send a test notification using your current settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
