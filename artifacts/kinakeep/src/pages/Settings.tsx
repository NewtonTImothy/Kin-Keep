import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useGetBusiness, 
  useUpdateBusiness,
  getGetBusinessQueryKey
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Store, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, "Business name required"),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().or(z.literal('')),
  location: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

export default function Settings() {
  const { activeBusiness, refreshBusinesses } = useBusiness();
  const businessId = activeBusiness?.id || 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: business, isLoading } = useGetBusiness(
    businessId, 
    { query: { enabled: !!businessId, queryKey: getGetBusinessQueryKey(businessId) } }
  );

  const updateBusiness = useUpdateBusiness();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '', ownerName: '', phone: '', email: '', location: '', address: '', description: ''
    }
  });

  // Init form when data loads
  React.useEffect(() => {
    if (business) {
      form.reset({
        name: business.name || '',
        ownerName: business.ownerName || '',
        phone: business.phone || '',
        email: business.email || '',
        location: business.location || '',
        address: business.address || '',
        description: business.description || '',
      });
    }
  }, [business, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateBusiness.mutate({ businessId, data: values }, {
      onSuccess: () => {
        toast({ title: "Settings Saved", description: "Business profile updated successfully." });
        queryClient.invalidateQueries({ queryKey: getGetBusinessQueryKey(businessId) });
        refreshBusinesses();
      }
    });
  };

  if (isLoading || !business) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Business Profile</CardTitle>
          <CardDescription>This information appears on reports and receipts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Business Name *</FormLabel><FormControl><Input className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="ownerName" render={({ field }) => (
                  <FormItem><FormLabel>Owner Name</FormLabel><FormControl><Input className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem><FormLabel>General Location (e.g. City)</FormLabel><FormControl><Input className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input className="h-12" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Business Description</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="pt-4 flex justify-end">
                <Button type="submit" size="lg" disabled={updateBusiness.isPending}>
                  {updateBusiness.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
