import { CSSTest } from '@/components/ui/css-test';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CSSTestPage() {
  return (
    <div className="min-h-screen bg-background">
      <CSSTest />
    </div>
  );
}
