/**
 * Connectivity service — detects whether the device has an active internet connection.
 *
 * TODO: Replace this stub with a real implementation using
 *       @react-native-community/netinfo once the package is added to the project.
 *       Install with: npx expo install @react-native-community/netinfo
 *
 * Real implementation would look like:
 *
 *   import NetInfo from '@react-native-community/netinfo';
 *
 *   export function subscribeToConnectivity(
 *     callback: (isConnected: boolean) => void,
 *   ): () => void {
 *     const unsubscribe = NetInfo.addEventListener((state) => {
 *       callback(state.isConnected ?? false);
 *     });
 *     return unsubscribe;
 *   }
 *
 *   export async function getIsConnected(): Promise<boolean> {
 *     const state = await NetInfo.fetch();
 *     return state.isConnected ?? false;
 *   }
 *
 * Requirement: 7.5 — show offline message when device has no internet connection.
 */

type ConnectivityListener = (isConnected: boolean) => void;

const listeners = new Set<ConnectivityListener>();

/**
 * Current connectivity state.
 * Stub always returns true; replace with real NetInfo state when available.
 */
let _isConnected = true;

/**
 * Returns the current connectivity state.
 * Stub always returns true.
 */
export function getIsConnected(): boolean {
  return _isConnected;
}

/**
 * Subscribes to connectivity changes.
 * Returns an unsubscribe function.
 *
 * Stub: the callback is never invoked since connectivity never changes.
 * Replace with NetInfo.addEventListener when the package is available.
 */
export function subscribeToConnectivity(
  callback: ConnectivityListener,
): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Internal helper — updates the connectivity state and notifies all listeners.
 * Used by the real NetInfo integration once available.
 *
 * @internal
 */
export function _setIsConnected(value: boolean): void {
  _isConnected = value;
  listeners.forEach((cb) => cb(value));
}
