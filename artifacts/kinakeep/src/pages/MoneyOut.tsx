import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react';

import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/hooks/use-toast';
import { 
  useCreateTransaction, 
  useListCategories, 
  useListSuppliers,
  useRequestUploadUrl 
} from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(2, "Description is required"),
  date: z.date(),
  categoryId: z.string().min(1, "Category is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  supplierId: z.string().optional().nullable(),
  receiptReference: z.string().optional(),
  notes: z.string().optional(),
});

export default function MoneyOut() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id || 0;

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [] } = useListCategories(businessId, { type: 'expense' }, { query: { enabled: !!businessId } });
  const { data: suppliers = [] } = useListSuppliers(businessId, {}, { query: { enabled: !!businessId } });
  
  const createTxn = useCreateTransaction();
  const requestUpload = useRequestUploadUrl();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      description: '',
      date: new Date(),
      categoryId: '',
      paymentMethod: 'Cash',
      supplierId: '',
      receiptReference: '',
      notes: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let receiptPath = undefined;
      
      if (receiptFile) {
        setIsUploading(true);
        try {
          const { uploadURL, objectPath } = await requestUpload.mutateAsync({
            data: { name: receiptFile.name, size: receiptFile.size, contentType: receiptFile.type }
          });
          
          await fetch(uploadURL, {
            method: 'PUT',
            body: receiptFile,
            headers: { 'Content-Type': receiptFile.type }
          });
          
          receiptPath = objectPath;
        } catch (uploadError) {
          toast({ title: "Upload Failed", description: "Could not upload the receipt.", variant: "destructive" });
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      await createTxn.mutateAsync({
        data: {
          type: 'expense',
          amount: values.amount,
          description: values.description,
          date: format(values.date, 'yyyy-MM-dd'),
          categoryId: parseInt(values.categoryId, 10),
          paymentMethod: values.paymentMethod,
          supplierId: values.supplierId && values.supplierId !== 'none' ? parseInt(values.supplierId, 10) : undefined,
          receiptReference: values.receiptReference,
          receiptPath: receiptPath,
          notes: values.notes,
        }
      });

      toast({ title: "Success", description: "Expense recorded successfully." });
      setLocation('/app/dashboard');
    } catch (e) {
      toast({ title: "Error", description: "Failed to save transaction.", variant: "destructive" });
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Money Out</h1>
        <p className="text-muted-foreground">Record a new expense, purchase, or bill.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (Kina) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">K</span>
                          <Input type="number" step="0.01" min="0" placeholder="0.00" className="pl-8 text-lg font-bold h-12" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full h-12 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="What did you buy?" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {['Cash', 'Bank', 'EFTPOS/Card', 'Mobile Money', 'Other'].map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">General / None</SelectItem>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt Upload */}
              <div className="space-y-3 pt-2">
                <FormLabel>Receipt Photo (Highly Recommended)</FormLabel>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    id="receipt-upload"
                    className="hidden"
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    {receiptFile ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium text-primary">{receiptFile.name}</span>
                        <span className="text-xs text-muted-foreground">Tap to change</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Take Photo or Upload Receipt</span>
                        <span className="text-xs text-muted-foreground">JPG, PNG, PDF up to 10MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setLocation('/app/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" variant="destructive" className="min-w-[120px]" disabled={createTxn.isPending || isUploading}>
                  {createTxn.isPending || isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Expense'}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
