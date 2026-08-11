import React from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { useAuth } from '@workspace/replit-auth-web';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { AppLayout } from '@/components/layout/AppLayout';

import Landing from '@/pages/Landing';
import NotFound from '@/pages/not-found';
// Placeholder imports for pages we will create soon
import Dashboard from '@/pages/Dashboard';
import SetupBusiness from '@/pages/SetupBusiness';
import MoneyIn from '@/pages/MoneyIn';
import MoneyOut from '@/pages/MoneyOut';
import Transactions from '@/pages/Transactions';
import Receipts from '@/pages/Receipts';
import Customers from '@/pages/Customers';
import Suppliers from '@/pages/Suppliers';
import Reports from '@/pages/Reports';
import Documents from '@/pages/Documents';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Setup wizard does not use the AppLayout sidebar
  if (rest.path === '/app/setup') {
    return <Component {...rest} />;
  }

  return (
    <AppLayout>
      <Component {...rest} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      
      <Route path="/app/setup">
        {(params) => <ProtectedRoute path="/app/setup" component={SetupBusiness} {...params} />}
      </Route>
      <Route path="/app/dashboard">
        {(params) => <ProtectedRoute path="/app/dashboard" component={Dashboard} {...params} />}
      </Route>
      <Route path="/app/money-in">
        {(params) => <ProtectedRoute path="/app/money-in" component={MoneyIn} {...params} />}
      </Route>
      <Route path="/app/money-out">
        {(params) => <ProtectedRoute path="/app/money-out" component={MoneyOut} {...params} />}
      </Route>
      <Route path="/app/transactions">
        {(params) => <ProtectedRoute path="/app/transactions" component={Transactions} {...params} />}
      </Route>
      <Route path="/app/receipts">
        {(params) => <ProtectedRoute path="/app/receipts" component={Receipts} {...params} />}
      </Route>
      <Route path="/app/customers">
        {(params) => <ProtectedRoute path="/app/customers" component={Customers} {...params} />}
      </Route>
      <Route path="/app/suppliers">
        {(params) => <ProtectedRoute path="/app/suppliers" component={Suppliers} {...params} />}
      </Route>
      <Route path="/app/reports">
        {(params) => <ProtectedRoute path="/app/reports" component={Reports} {...params} />}
      </Route>
      <Route path="/app/documents">
        {(params) => <ProtectedRoute path="/app/documents" component={Documents} {...params} />}
      </Route>
      <Route path="/app/settings">
        {(params) => <ProtectedRoute path="/app/settings" component={Settings} {...params} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <BusinessProvider>
            <RoutedErrorBoundary>
              <Router />
            </RoutedErrorBoundary>
          </BusinessProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
