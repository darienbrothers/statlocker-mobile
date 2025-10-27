/**
 * NetworkProvider Component - Sets up network monitoring for the app
 * 
 * Features:
 * - Initializes network state monitoring
 * - Renders offline banner when needed
 * - Provides network context to children
 */
import React, { type ReactNode } from 'react';
import { useNetworkState } from '@/hooks/useNetworkState';
import { OfflineBanner } from './OfflineBanner';

interface NetworkProviderProps {
  children: ReactNode;
  showOfflineBanner?: boolean;
}

export function NetworkProvider({ 
  children, 
  showOfflineBanner = true 
}: NetworkProviderProps) {
  // Initialize network monitoring
  useNetworkState();

  return (
    <>
      {children}
      {showOfflineBanner && <OfflineBanner />}
    </>
  );
}

export default NetworkProvider;