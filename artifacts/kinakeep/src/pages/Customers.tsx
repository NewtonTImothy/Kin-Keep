import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useListCustomers,
  getListCustomersQueryKey,
  useCreateCustomer,
  useMarkCustomerCreditPaid
} from '@workspace/api-client-react';
import { formatKina } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Phone, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export default function Customers() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id || 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: customers, isLoading } = useListCustomers(
    businessId, 
    { search: search || undefined },
    { 
      query: { 
        enabled: !!businessId,
        queryKey: getListCustomersQueryKey(businessId, { search: search || undefined })
      }
    }
  );

  const createCustomer = useCreateCustomer();
  const markPaid = useMarkCustomerCreditPaid();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', notes: '' }
  });

  const onSubmit = (values: z.infer<typeof customerSchema>) => {
    createCustomer.mutate({ businessId, data: values }, {
      onSuccess: () => {
        toast({ title: "Customer Added" });
        setIsAddOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey(businessId) });
      }
    });
  };

  const handleMarkPaid = (customerId: number, amountStr: string) => {
    if (!window.confirm(`Mark ${formatKina(amountStr)} as paid?`)) return;
    
    markPaid.mutate({
      businessId, customerId, data: { amount: amountStr, date: new Date().toISOString().split('T')[0] }
    }, {
      onSuccess: () => {
        toast({ title: "Balance Paid", description: "Transaction recorded automatically." });
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey(businessId) });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your clients and track un-paid credits (Dinau).</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><UserPlus className="mr-2 h-5 w-5" /> Add Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Customer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Address / Village</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createCustomer.isPending}>Save Customer</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search customers..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-lg bg-card shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">Loading...</div>
        ) : customers && customers.length > 0 ? (
          customers.map(c => {
            const hasDebt = parseFloat(c.outstandingBalance) > 0;
            return (
              <Card key={c.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg leading-tight">{c.name}</h3>
                        {c.phone && <p className="text-xs text-muted-foreground flex items-center mt-0.5"><Phone className="h-3 w-3 mr-1" /> {c.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 mb-4 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                      <p className="font-semibold text-foreground">{formatKina(c.totalCredit)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Outstanding (Dinau)</p>
                      <p className={`font-bold ${hasDebt ? 'text-destructive' : 'text-primary'}`}>
                        {formatKina(c.outstandingBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {hasDebt ? (
                      <Button size="sm" onClick={() => handleMarkPaid(c.id, c.outstandingBalance)} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 border-0">
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Paid
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">All paid up</span>
                    )}
                    <Button variant="ghost" size="sm" className="text-primary -mr-2">
                      Details <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl bg-muted/20">
            <UserPlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No customers found</p>
            <p className="text-muted-foreground">Add your first customer to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}
