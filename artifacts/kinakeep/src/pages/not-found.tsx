import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
      <div className="w-16 h-16 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-4xl mb-6">
        K
      </div>
      <h1 className="text-6xl font-display font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-muted-foreground mb-8">Page not found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        We couldn't find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <Button onClick={() => setLocation('/')} size="lg" className="rounded-full px-8">
        <Home className="mr-2 h-5 w-5" /> Back to Home
      </Button>
    </div>
  );
}
