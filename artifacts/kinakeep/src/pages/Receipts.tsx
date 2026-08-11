import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useListTransactions,
  getListTransactionsQueryKey,
  useUpdateTransaction,
  useRequestUploadUrl
} from '@workspace/api-client-react';
import { formatKina, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, FileWarning, ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Receipts() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id || 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState<'missing' | 'attached'>('missing');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const { data, isLoading } = useListTransactions(
    businessId, 
    { 
      type: 'expense', 
      receiptStatus: tab,
      limit: 100
    },
    { 
      query: { 
        enabled: !!businessId,
        queryKey: getListTransactionsQueryKey(businessId, { 
          type: 'expense', 
          receiptStatus: tab,
          limit: 100 
        })
      }
    }
  );

  const requestUpload = useRequestUploadUrl();
  const updateTxn = useUpdateTransaction();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, txnId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingId(txnId);
    try {
      const { uploadURL, objectPath } = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type }
      });
      
      await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });
      
      await updateTxn.mutateAsync({
        businessId,
        transactionId: txnId,
        data: { receiptPath: objectPath }
      });
      
      toast({ title: "Receipt Attached", description: "The receipt was successfully uploaded." });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey(businessId) });
    } catch (err) {
      toast({ title: "Upload Failed", description: "There was an error attaching the receipt.", variant: "destructive" });
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Receipts Manager</h1>
        <p className="text-muted-foreground">Track and attach receipts to your expenses.</p>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setTab('missing')}
          className={`pb-3 px-2 font-semibold transition-colors ${tab === 'missing' ? 'text-destructive border-b-2 border-destructive' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2"><FileWarning className="h-4 w-4" /> Missing Receipts</div>
        </button>
        <button 
          onClick={() => setTab('attached')}
          className={`pb-3 px-2 font-semibold transition-colors ${tab === 'attached' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <div className="flex items-center gap-2"><Receipt className="h-4 w-4" /> Attached Receipts</div>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading...</div>
        ) : data && data.transactions.length > 0 ? (
          data.transactions.map((txn) => (
            <Card key={txn.id} className="border-border shadow-sm flex flex-col relative overflow-hidden">
              {uploadingId === txn.id && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                  <span className="text-sm font-semibold">Uploading...</span>
                </div>
              )}
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-muted rounded">
                    {tab === 'missing' ? <FileWarning className="h-5 w-5 text-destructive" /> : <Receipt className="h-5 w-5 text-primary" />}
                  </div>
                  <span className="font-bold text-lg">{formatKina(txn.amount)}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{txn.description}</h3>
                  <p className="text-sm text-muted-foreground mb-1">{formatDate(txn.date)} • {txn.categoryName}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-end">
                  {tab === 'missing' ? (
                    <div className="w-full relative">
                      <input
                        type="file"
                        id={`upload-${txn.id}`}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={(e) => handleFileUpload(e, txn.id)}
                        disabled={uploadingId === txn.id}
                      />
                      <Button variant="outline" size="sm" className="w-full text-primary border-primary pointer-events-none">
                        <UploadCloud className="h-4 w-4 mr-2" /> Attach Receipt
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedReceipt(txn.receiptPath || null)}
                      disabled={!txn.receiptPath}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" /> View Receipt
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-muted-foreground">No {tab} receipts found.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Receipt View</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-muted flex items-center justify-center p-4">
            {selectedReceipt && (
              <img 
                src={`/api/storage${selectedReceipt}`} 
                alt="Receipt" 
                className="max-w-full max-h-full object-contain shadow-lg rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="text-center p-8"><p class="mb-4">Unable to preview. It might be a PDF or the file is missing.</p><a href="/api/storage' + selectedReceipt + '" target="_blank" class="text-primary underline">Open in new tab</a></div>';
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
