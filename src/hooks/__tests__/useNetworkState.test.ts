/**
 * useNetworkState Hook Tests
 */
import { renderHook, act } from '@testing-library/react-native';
import * as Network from 'expo-network';
import { useNetworkState } from '../useNetworkState';
import { useAppActions } from '@/store';

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
  addNetworkStateListener: jest.fn(),
  NetworkStateType: {
    UNKNOWN: 'UNKNOWN',
    NONE: 'NONE',
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
  },
}));

// Mock store
jest.mock('@/store', () => ({
  useAppActions: jest.fn(),
}));

const mockGetNetworkStateAsync = Network.getNetworkStateAsync as jest.Mock;
const mockAddNetworkStateListener = Network.addNetworkStateListener as jest.Mock;
const mockUseAppActions = useAppActions as jest.Mock;

describe('useNetworkState Hook', () => {
  const mockSetOfflineStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppActions.mockReturnValue({
      setOfflineStatus: mockSetOfflineStatus,
    });
    mockAddNetworkStateListener.mockReturnValue({
      remove: jest.fn(),
    });
  });

  it('initializes with default network state', () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    });

    const { result } = renderHook(() => useNetworkState());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.type).toBe(Network.NetworkStateType.UNKNOWN);
  });

  it('updates network state when connection changes', async () => {
    const mockNetworkState = {
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    };

    mockGetNetworkStateAsync.mockResolvedValue(mockNetworkState);

    const { result } = renderHook(() => useNetworkState());

    // Wait for initial network state to be set
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockGetNetworkStateAsync).toHaveBeenCalled();
    expect(mockSetOfflineStatus).toHaveBeenCalledWith(false);
  });

  it('handles network state listener updates', async () => {
    let networkListener: (state: any) => void = () => {};

    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    });

    mockAddNetworkStateListener.mockImplementation((callback) => {
      networkListener = callback;
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useNetworkState());

    // Simulate network state change
    act(() => {
      networkListener({
        isConnected: false,
        isInternetReachable: false,
        type: Network.NetworkStateType.NONE,
      });
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.type).toBe(Network.NetworkStateType.NONE);
    expect(mockSetOfflineStatus).toHaveBeenCalledWith(true);
  });

  it('handles network state errors gracefully', async () => {
    mockGetNetworkStateAsync.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useNetworkState());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isConnected).toBe(false);
    expect(mockSetOfflineStatus).toHaveBeenCalledWith(true);
  });

  it('cleans up network listener on unmount', () => {
    const mockRemove = jest.fn();
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    });

    mockAddNetworkStateListener.mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = renderHook(() => useNetworkState());

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it('handles null network state values', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: null,
      isInternetReachable: null,
      type: Network.NetworkStateType.UNKNOWN,
    });

    const { result } = renderHook(() => useNetworkState());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isInternetReachable).toBeNull();
    expect(mockSetOfflineStatus).toHaveBeenCalledWith(true);
  });
});