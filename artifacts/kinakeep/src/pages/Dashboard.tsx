import React, { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { 
  useGetDashboardStats, 
  useGetCashFlowChart, 
  useGetExpenseBreakdown, 
  useGetRecentTransactions,
  getGetDashboardStatsQueryKey,
  getGetCashFlowChartQueryKey,
  getGetExpenseBreakdownQueryKey,
  getGetRecentTransactionsQueryKey
} from '@workspace/api-client-react';
import { formatKina, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine, Wallet, TrendingUp, Receipt, FileWarning, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Dashboard() {
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'this_week' | 'this_month' | 'last_month' | 'this_year'>('this_month');

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(
    activeBusiness?.id || 0,
    { period },
    { query: { enabled: !!activeBusiness?.id, queryKey: getGetDashboardStatsQueryKey(activeBusiness?.id || 0, { period }) } }
  );

  const { data: chartData, isLoading: chartLoading } = useGetCashFlowChart(
    activeBusiness?.id || 0,
    { period },
    { query: { enabled: !!activeBusiness?.id, queryKey: getGetCashFlowChartQueryKey(activeBusiness?.id || 0, { period }) } }
  );

  const { data: expenseData, isLoading: expensesLoading } = useGetExpenseBreakdown(
    activeBusiness?.id || 0,
    { period },
    { query: { enabled: !!activeBusiness?.id, queryKey: getGetExpenseBreakdownQueryKey(activeBusiness?.id || 0, { period }) } }
  );

  const { data: recentTxns, isLoading: txnsLoading } = useGetRecentTransactions(
    activeBusiness?.id || 0,
    { limit: 5 },
    { query: { enabled: !!activeBusiness?.id, queryKey: getGetRecentTransactionsQueryKey(activeBusiness?.id || 0, { limit: 5 }) } }
  );

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (!activeBusiness) return null;

  const isLoading = statsLoading || chartLoading || expensesLoading || txnsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || 'there'}
          </h1>
          <p className="text-muted-foreground">Here is what is happening with {activeBusiness.name}.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons (Mobile Prominent) */}
      <div className="grid grid-cols-2 gap-4">
        <Button asChild size="lg" className="h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md">
          <Link href="/app/money-in">
            <ArrowDownToLine className="mr-2 h-6 w-6" /> Money In
          </Link>
        </Button>
        <Button asChild size="lg" className="h-16 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md">
          <Link href="/app/money-out">
            <ArrowUpFromLine className="mr-2 h-6 w-6" /> Money Out
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <div className="p-2 bg-primary/10 rounded-lg"><Wallet className="h-5 w-5 text-primary" /></div>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground truncate">
              {isLoading ? "..." : formatKina(stats?.balance || "0")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Total accumulated cash</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Money In (Period)</p>
              <div className="p-2 bg-green-500/10 rounded-lg"><ArrowDownToLine className="h-5 w-5 text-green-600" /></div>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground truncate">
              {isLoading ? "..." : formatKina(stats?.totalMoneyIn || "0")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Total revenue this period</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Money Out (Period)</p>
              <div className="p-2 bg-destructive/10 rounded-lg"><ArrowUpFromLine className="h-5 w-5 text-destructive" /></div>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground truncate">
              {isLoading ? "..." : formatKina(stats?.totalMoneyOut || "0")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Total expenses this period</p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
              <div className="p-2 bg-secondary/20 rounded-lg"><TrendingUp className="h-5 w-5 text-secondary-foreground" /></div>
            </div>
            <h3 className="text-3xl font-display font-bold text-foreground truncate">
              {isLoading ? "..." : formatKina(stats?.netCashFlow || "0")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Profit/Loss this period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Cash Flow Overview</CardTitle>
            <CardDescription>Money coming in vs going out over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {!chartLoading && chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `K${val}`} />
                    <RechartsTooltip 
                      formatter={(value: number) => [formatKina(value), '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    />
                    <Area type="monotone" name="Money In" dataKey="moneyIn" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                    <Area type="monotone" name="Money Out" dataKey="moneyOut" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Not enough data to show chart</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses Breakdown */}
        <Card className="shadow-sm border-border flex flex-col">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="h-[220px] w-full">
              {!expensesLoading && expenseData && expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="categoryName"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => formatKina(value)} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No expenses this period</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/app/transactions">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {txnsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : recentTxns && recentTxns.length > 0 ? (
              <div className="space-y-4 mt-2">
                {recentTxns.map(txn => (
                  <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${txn.type === 'income' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                        {txn.type === 'income' ? <ArrowDownToLine className="h-5 w-5" /> : <ArrowUpFromLine className="h-5 w-5" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-foreground truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground truncate">{formatDate(txn.date)} • {txn.categoryName || 'Uncategorized'} • {txn.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`font-bold ${txn.type === 'income' ? 'text-primary' : 'text-foreground'}`}>
                        {txn.type === 'income' ? '+' : '-'}{formatKina(txn.amount)}
                      </p>
                      {txn.receiptStatus === 'missing' && txn.type === 'expense' && (
                        <span className="text-[10px] flex items-center justify-end text-destructive mt-1 font-medium"><FileWarning className="h-3 w-3 mr-1" /> No Receipt</span>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full sm:hidden mt-2" asChild>
                  <Link href="/app/transactions">View All Transactions</Link>
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center border border-dashed border-border rounded-lg mt-4 bg-muted/30">
                <p className="text-muted-foreground mb-4">No transactions recorded yet.</p>
                <div className="flex justify-center gap-3">
                  <Button asChild size="sm"><Link href="/app/money-in">Add Income</Link></Button>
                  <Button asChild size="sm" variant="secondary"><Link href="/app/money-out">Add Expense</Link></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Coverage */}
        <Card className="shadow-sm border-border bg-gradient-to-br from-card to-muted/20">
          <CardHeader>
            <CardTitle>Receipt Coverage</CardTitle>
            <CardDescription>Keep your records tax-ready</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                  <circle 
                    cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    className={stats?.receiptCoverage && stats.receiptCoverage >= 80 ? 'text-primary' : stats?.receiptCoverage && stats.receiptCoverage >= 50 ? 'text-secondary' : 'text-destructive'}
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * (stats?.receiptCoverage || 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-display font-bold">{stats?.receiptCoverage || 0}%</span>
                </div>
              </div>
              
              <div className="w-full space-y-3 mb-6 text-sm">
                <div className="flex justify-between items-center px-4 py-2 bg-background rounded-md border border-border">
                  <span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Attached</span>
                  <span className="font-bold">{stats?.receiptsAttached || 0}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-background rounded-md border border-destructive/20 text-destructive">
                  <span className="flex items-center gap-2"><FileWarning className="h-4 w-4" /> Missing</span>
                  <span className="font-bold">{stats?.receiptsMissing || 0}</span>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link href="/app/receipts">Manage Receipts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
