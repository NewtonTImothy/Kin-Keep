import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateBusiness } from '@workspace/api-client-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Building2, Briefcase } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const setupSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  type: z.string().min(1, "Please select a business type"),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

export default function SetupBusiness() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshBusinesses, setActiveBusiness } = useBusiness();
  const createBusiness = useCreateBusiness();

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      type: '',
      ownerName: '',
      phone: '',
      location: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof setupSchema>) => {
    try {
      createBusiness.mutate(
        { data: values },
        {
          onSuccess: (newBusiness) => {
            refreshBusinesses();
            setActiveBusiness(newBusiness);
            toast({
              title: "Business created",
              description: "Welcome to KinaKeep!",
            });
            setLocation('/app/dashboard');
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to create business. Please try again.",
              variant: "destructive"
            });
          }
        }
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl mx-auto mb-4">
            K
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome to KinaKeep</h1>
          <p className="text-muted-foreground text-lg">Let's set up your business profile to get started.</p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>You can change these later in Settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John's Trade Store" className="h-12 text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Trade Store">
                            <div className="flex items-center gap-2"><Store className="h-4 w-4" /> Trade Store / Kiosk</div>
                          </SelectItem>
                          <SelectItem value="Market Vendor">
                            <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Market Vendor</div>
                          </SelectItem>
                          <SelectItem value="Contractor">
                            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Contractor / Services</div>
                          </SelectItem>
                          <SelectItem value="Other">
                            <div className="flex items-center gap-2">Other SME</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7000 0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location / Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Gordons Market, Port Moresby" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What does your business do?" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-bold mt-4" 
                  disabled={createBusiness.isPending}
                >
                  {createBusiness.isPending ? "Setting up..." : "Create Business Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
