import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useListSuppliers,
  getListSuppliersQueryKey,
  useCreateSupplier
} from '@workspace/api-client-react';
import { formatKina } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Truck, Phone, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const supplierSchema = z.object({
  name: z.string().min(2, "Name required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export default function Suppliers() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id || 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: suppliers, isLoading } = useListSuppliers(
    businessId, 
    { search: search || undefined },
    { 
      query: { 
        enabled: !!businessId,
        queryKey: getListSuppliersQueryKey(businessId, { search: search || undefined })
      }
    }
  );

  const createSupplier = useCreateSupplier();

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', contactPerson: '', phone: '', email: '', address: '', notes: '' }
  });

  const onSubmit = (values: z.infer<typeof supplierSchema>) => {
    createSupplier.mutate({ businessId, data: values }, {
      onSuccess: () => {
        toast({ title: "Supplier Added" });
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey(businessId) });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground">Manage your vendors and track total purchases.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Truck className="mr-2 h-5 w-5" /> Add Supplier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Supplier</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Company/Supplier Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address / Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createSupplier.isPending}>Save Supplier</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search suppliers..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-lg bg-card shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">Loading...</div>
        ) : suppliers && suppliers.length > 0 ? (
          suppliers.map(s => (
            <Card key={s.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-muted text-muted-foreground flex items-center justify-center font-bold text-lg">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{s.name}</h3>
                      {s.phone && <p className="text-xs text-muted-foreground flex items-center mt-0.5"><Phone className="h-3 w-3 mr-1" /> {s.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Purchases</p>
                  <p className="font-bold text-foreground text-lg">{formatKina(s.totalPurchases)}</p>
                </div>

                <div className="flex justify-end items-center">
                  <Button variant="ghost" size="sm" className="text-primary -mr-2">
                    Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <Truck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No suppliers found</p>
            <p className="text-muted-foreground">Add suppliers to track your purchases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
