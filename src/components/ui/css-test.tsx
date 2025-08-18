'use client';

import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

export function CSSTest() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">CSS Test Component</h1>
      
      {/* Color Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Color System Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded">Primary</div>
          <div className="bg-secondary text-secondary-foreground p-4 rounded">Secondary</div>
          <div className="bg-destructive text-destructive-foreground p-4 rounded">Destructive</div>
          <div className="bg-muted text-muted-foreground p-4 rounded">Muted</div>
        </div>
      </div>

      {/* Button Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Button Test</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      {/* Card Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Card Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is a test card to verify the card component styling is working correctly.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This card should have proper styling with background, border, and shadow.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Badge Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Badge Test</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>

      {/* Typography Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Typography Test</h2>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <h2 className="text-3xl font-semibold">Heading 2</h2>
          <h3 className="text-2xl font-medium">Heading 3</h3>
          <h4 className="text-xl">Heading 4</h4>
          <p className="text-base">This is a paragraph with base text size.</p>
          <p className="text-sm text-muted-foreground">This is smaller muted text.</p>
        </div>
      </div>

      {/* Spacing Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Spacing Test</h2>
        <div className="space-y-2">
          <div className="bg-blue-100 p-2">Padding 2</div>
          <div className="bg-blue-200 p-4">Padding 4</div>
          <div className="bg-blue-300 p-6">Padding 6</div>
          <div className="bg-blue-400 p-8">Padding 8</div>
        </div>
      </div>

      {/* Animation Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Animation Test</h2>
        <div className="space-y-2">
          <div className="animate-fade-in bg-green-100 p-4 rounded">Fade In Animation</div>
          <div className="animate-slide-up bg-yellow-100 p-4 rounded">Slide Up Animation</div>
          <div className="animate-slide-down bg-red-100 p-4 rounded">Slide Down Animation</div>
        </div>
      </div>
    </div>
  );
}
