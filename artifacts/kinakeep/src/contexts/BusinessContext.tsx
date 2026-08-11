import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useListBusinesses, Business, getListBusinessesQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@workspace/replit-auth-web';
import { useLocation } from 'wouter';

interface BusinessContextType {
  activeBusiness: Business | null;
  setActiveBusiness: (b: Business | null) => void;
  businesses: Business[];
  isLoading: boolean;
  refreshBusinesses: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: businesses = [], isLoading, refetch } = useListBusinesses({
    query: {
      enabled: isAuthenticated,
      queryKey: getListBusinessesQueryKey()
    }
  });
  
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setActiveBusinessState(null);
      return;
    }

    if (businesses.length > 0 && !activeBusiness) {
      const savedId = localStorage.getItem('kinakeep_active_business');
      if (savedId) {
        const found = businesses.find(b => b.id.toString() === savedId);
        if (found) {
          setActiveBusinessState(found);
          return;
        }
      }
      setActiveBusinessState(businesses[0]);
    } else if (businesses.length === 0 && !isLoading && isAuthenticated) {
      // If user is authenticated but has no businesses, they should set one up
      const currentPath = window.location.pathname;
      if (currentPath !== '/app/setup' && currentPath.startsWith('/app')) {
        setLocation('/app/setup');
      }
    }
  }, [businesses, activeBusiness, isAuthenticated, isLoading, setLocation]);

  const setActiveBusiness = (b: Business | null) => {
    setActiveBusinessState(b);
    if (b) {
      localStorage.setItem('kinakeep_active_business', b.id.toString());
    } else {
      localStorage.removeItem('kinakeep_active_business');
    }
  };

  return (
    <BusinessContext.Provider value={{ activeBusiness, setActiveBusiness, businesses, isLoading, refreshBusinesses: refetch }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
