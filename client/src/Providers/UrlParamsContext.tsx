import React, { createContext, useContext } from 'react';
import type { UrlParams } from '~/hooks';

/**
 * Context value for URL parameters
 */
export interface UrlParamsContextValue {
  urlParams: UrlParams;
  isUrlControlled: boolean;
}

/**
 * Context for sharing URL parameters across components
 */
export const UrlParamsContext = createContext<UrlParamsContextValue | undefined>(undefined);

/**
 * Provider component for URL parameters context
 */
export function UrlParamsProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: UrlParamsContextValue;
}) {
  return <UrlParamsContext.Provider value={value}>{children}</UrlParamsContext.Provider>;
}

/**
 * Hook to access URL parameters from context
 * 
 * @returns {UrlParamsContextValue} URL parameters and control status
 * @throws {Error} If used outside of UrlParamsProvider
 */
export function useUrlParamsContext(): UrlParamsContextValue {
  const context = useContext(UrlParamsContext);
  if (context === undefined) {
    throw new Error('useUrlParamsContext must be used within a UrlParamsProvider');
  }
  return context;
}
