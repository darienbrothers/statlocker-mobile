/**
 * useNetworkState Hook - Network connectivity monitoring
 * 
 * Features:
 * - Real-time network state monitoring
 * - Integration with app shell store
 * - Automatic offline status updates
 * - Connection type detection
 */
import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { useAppActions } from '@/store';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType;
}

export function useNetworkState() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: Network.NetworkStateType.UNKNOWN,
  });
  
  const { setOfflineStatus } = useAppActions();

  useEffect(() => {
    let isMounted = true;

    // Get initial network state
    const getInitialNetworkState = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (!isMounted) return;

        const newNetworkState: NetworkState = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable ?? null,
          type: state.type ?? Network.NetworkStateType.UNKNOWN,
        };

        setNetworkState(newNetworkState);
        setOfflineStatus(!newNetworkState.isConnected);
      } catch (error) {
        console.error('Failed to get initial network state:', error);
        if (!isMounted) return;
        
        // Assume offline on error
        setNetworkState({
          isConnected: false,
          isInternetReachable: false,
          type: Network.NetworkStateType.UNKNOWN,
        });
        setOfflineStatus(true);
      }
    };

    // Set up network state listener
    const setupNetworkListener = () => {
      return Network.addNetworkStateListener((state) => {
        if (!isMounted) return;

        const newNetworkState: NetworkState = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable ?? null,
          type: state.type ?? Network.NetworkStateType.UNKNOWN,
        };

        setNetworkState(newNetworkState);
        setOfflineStatus(!newNetworkState.isConnected);
      });
    };

    // Initialize
    getInitialNetworkState();
    const subscription = setupNetworkListener();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [setOfflineStatus]);

  return networkState;
}

export default useNetworkState;