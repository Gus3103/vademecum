/**
 * Responsive layout utilities.
 *
 * Provides a `useResponsive` hook and helper functions for building
 * adaptive layouts across phone, tablet and desktop screen sizes.
 *
 * Breakpoints:
 *   - Phone:   < 768px
 *   - Tablet:  768px – 1023px
 *   - Desktop: ≥ 1024px
 *
 * Requirements: 7.1, 7.2, 7.3
 */

import { useWindowDimensions, Dimensions } from 'react-native';

// ─── Breakpoints ────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;

// ─── Static helpers (safe to call outside components) ───────────────────────

/**
 * Returns the percentage of the current screen height.
 * @param percent - A value between 0 and 100.
 */
export function hp(percent: number): number {
  const { height } = Dimensions.get('window');
  return (percent / 100) * height;
}

/**
 * Returns the percentage of the current screen width.
 * @param percent - A value between 0 and 100.
 */
export function wp(percent: number): number {
  const { width } = Dimensions.get('window');
  return (percent / 100) * width;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface ResponsiveValues {
  /** Current screen width in logical pixels. */
  screenWidth: number;
  /** Current screen height in logical pixels. */
  screenHeight: number;
  /** True when the screen width is ≥ 768px and < 1024px. */
  isTablet: boolean;
  /** True when the screen width is ≥ 1024px. */
  isDesktop: boolean;
  /**
   * Returns the percentage of the current screen height.
   * Reactive — updates when the window is resized.
   */
  hp: (percent: number) => number;
  /**
   * Returns the percentage of the current screen width.
   * Reactive — updates when the window is resized.
   */
  wp: (percent: number) => number;
}

/**
 * Hook that returns responsive layout values derived from the current window
 * dimensions. Re-renders automatically when the window is resized (e.g. on
 * web or when the device orientation changes).
 */
export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;

  return {
    screenWidth: width,
    screenHeight: height,
    isTablet,
    isDesktop,
    hp: (percent: number) => (percent / 100) * height,
    wp: (percent: number) => (percent / 100) * width,
  };
}
