import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useGetReportSummary,
  useGetIncomeBreakdown,
  useGetReportExpenseBreakdown,
  getGetReportSummaryQueryKey,
  getGetIncomeBreakdownQueryKey,
  getGetReportExpenseBreakdownQueryKey
} from '@workspace/api-client-react';
import { formatKina } from '@/lib/format';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, Wallet, FileWarning } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Reports() {
  const { activeBusiness } = useBusiness();
  const businessId = activeBusiness?.id || 0;

  const [dateRange, setDateRange] = useState<'this_month' | 'last_month' | 'this_year'>('this_month');

  const getDates = () => {
    const today = new Date();
    if (dateRange === 'this_month') {
      return { start: format(startOfMonth(today), 'yyyy-MM-dd'), end: format(endOfMonth(today), 'yyyy-MM-dd') };
    } else if (dateRange === 'last_month') {
      const lastMonth = subMonths(today, 1);
      return { start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'), end: format(endOfMonth(lastMonth), 'yyyy-MM-dd') };
    } else {
      return { start: format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd'), end: format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd') };
    }
  };

  const { start: startDate, end: endDate } = getDates();

  const { data: summary, isLoading: sLoad } = useGetReportSummary(
    businessId, 
    { startDate, endDate },
    { query: { enabled: !!businessId, queryKey: getGetReportSummaryQueryKey(businessId, { startDate, endDate }) } }
  );

  const { data: income, isLoading: iLoad } = useGetIncomeBreakdown(
    businessId, 
    { startDate, endDate },
    { query: { enabled: !!businessId, queryKey: getGetIncomeBreakdownQueryKey(businessId, { startDate, endDate }) } }
  );

  const { data: expenses, isLoading: eLoad } = useGetReportExpenseBreakdown(
    businessId, 
    { startDate, endDate },
    { query: { enabled: !!businessId, queryKey: getGetReportExpenseBreakdownQueryKey(businessId, { startDate, endDate }) } }
  );

  const handleExportCSV = () => {
    if (!summary || !income || !expenses) return;
    
    let csv = `KinaKeep Report: ${activeBusiness?.name}\n`;
    csv += `Period: ${startDate} to ${endDate}\n\n`;
    
    csv += `Summary\n`;
    csv += `Total Income,${summary.totalMoneyIn}\n`;
    csv += `Total Expenses,${summary.totalMoneyOut}\n`;
    csv += `Net Profit/Loss,${summary.netCashFlow}\n\n`;
    
    csv += `Income By Category\nCategory,Total,Count\n`;
    income.forEach(i => { csv += `"${i.categoryName}",${i.total},${i.count}\n`; });
    
    csv += `\nExpenses By Category\nCategory,Total,Count\n`;
    expenses.forEach(e => { csv += `"${e.categoryName}",${e.total},${e.count}\n`; });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kinakeep_report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Business Reports</h1>
          <p className="text-muted-foreground">Summaries and breakdowns for tax or analysis.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[180px] bg-card border-border shadow-sm">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline" className="shadow-sm border-border">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {sLoad ? (
        <div className="py-12 text-center text-muted-foreground">Generating report...</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Total Income</span>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary">{formatKina(summary.totalMoneyIn)}</div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Total Expenses</span>
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-3xl font-bold text-destructive">{formatKina(summary.totalMoneyOut)}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Net Profit/Loss</span>
                  <Wallet className="h-5 w-5 text-foreground" />
                </div>
                <div className="text-3xl font-bold text-foreground">{formatKina(summary.netCashFlow)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
                <CardDescription>Revenue sources for the period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Txns</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {income?.map(row => (
                      <TableRow key={row.categoryName}>
                        <TableCell className="font-medium">{row.categoryName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{row.count}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">{formatKina(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    {(!income || income.length === 0) && (
                      <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No income recorded.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Where money went this period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Txns</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.map(row => (
                      <TableRow key={row.categoryName}>
                        <TableCell className="font-medium">{row.categoryName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{row.count}</TableCell>
                        <TableCell className="text-right font-semibold text-foreground">{formatKina(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    {(!expenses || expenses.length === 0) && (
                      <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No expenses recorded.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-destructive/30 bg-destructive/5">
             <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-full"><FileWarning className="h-5 w-5 text-destructive" /></div>
                  <div>
                    <p className="font-semibold text-destructive">Receipt Compliance: {summary.receiptCoverage}%</p>
                    <p className="text-sm text-destructive/80">You have {summary.receiptsMissing} expenses without receipts in this period.</p>
                  </div>
                </div>
             </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
