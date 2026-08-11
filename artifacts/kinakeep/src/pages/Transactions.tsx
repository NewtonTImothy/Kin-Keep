import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useListTransactions,
  getListTransactionsQueryKey,
  useDeleteTransaction
} from '@workspace/api-client-react';
import { formatKina, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownToLine, ArrowUpFromLine, Search, FileWarning, Filter, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

export default function Transactions() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id || 0;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [type, setType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListTransactions(
    businessId, 
    { 
      type: type !== 'all' ? (type as any) : undefined, 
      search: search || undefined,
      page,
      limit: 20
    },
    { 
      query: { 
        enabled: !!businessId,
        queryKey: getListTransactionsQueryKey(businessId, { 
          type: type !== 'all' ? (type as any) : undefined, 
          search: search || undefined, 
          page, 
          limit: 20 
        })
      }
    }
  );

  const deleteTxn = useDeleteTransaction();

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction? This cannot be undone.")) return;
    
    deleteTxn.mutate(
      { businessId, transactionId: id },
      {
        onSuccess: () => {
          toast({ title: "Transaction deleted" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey(businessId) });
        },
        onError: () => {
          toast({ title: "Failed to delete", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">View and manage all your business records.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
            <Link href="/app/money-in"><ArrowDownToLine className="mr-2 h-4 w-4" /> Add Income</Link>
          </Button>
          <Button asChild variant="outline" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-0">
            <Link href="/app/money-out"><ArrowUpFromLine className="mr-2 h-4 w-4" /> Add Expense</Link>
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by description or reference..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] bg-background">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Money In</SelectItem>
                <SelectItem value="expense">Money Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading transactions...</TableCell>
                </TableRow>
              ) : data && data.transactions.length > 0 ? (
                data.transactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium whitespace-nowrap">{formatDate(txn.date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{txn.description}</div>
                      <div className="text-xs text-muted-foreground md:hidden flex items-center gap-1 mt-1">
                        {txn.categoryName}
                        {txn.receiptStatus === 'missing' && txn.type === 'expense' && (
                          <span className="text-destructive flex items-center"><FileWarning className="h-3 w-3 ml-1 mr-0.5" /> No receipt</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground hidden md:flex mt-1">
                        Ref: {txn.referenceNumber}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{txn.categoryName}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{txn.paymentMethod}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-bold",
                        txn.type === 'income' ? 'text-primary' : 'text-foreground'
                      )}>
                        {txn.type === 'income' ? '+' : '-'}{formatKina(txn.amount)}
                      </span>
                      {txn.receiptStatus === 'missing' && txn.type === 'expense' && (
                        <div className="hidden md:flex justify-end mt-1 text-xs text-destructive items-center">
                          <FileWarning className="h-3 w-3 mr-1" /> Missing Receipt
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(txn.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No transactions found for the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.total > data.limit && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-background">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * data.limit + 1} to {Math.min(page * data.limit, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * data.limit >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
