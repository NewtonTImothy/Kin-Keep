import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';

export default function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Document Cabinet</h1>
        <p className="text-muted-foreground">Store important business documents safely.</p>
      </div>

      <Card className="border-border shadow-sm border-dashed bg-muted/20">
        <CardContent className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-sm">
            The document cabinet feature is currently under development. Soon you'll be able to store licenses, certificates, and contracts here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
