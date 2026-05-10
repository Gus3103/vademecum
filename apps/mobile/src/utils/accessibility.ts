/**
 * Accessibility helper utilities.
 *
 * Provides factory functions that return the standard React Native
 * accessibility props for common interactive element types, ensuring
 * consistent WCAG 2.1 AA compliance across the app.
 *
 * Requirements: 7.4
 */

import type { AccessibilityRole } from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface A11yButtonProps {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
  accessibilityHint?: string;
}

interface A11yTextProps {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
}

interface A11yHeaderProps {
  accessibilityRole: AccessibilityRole;
  accessibilityLabel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns accessibility props for an interactive button element.
 *
 * @param label - Concise description of the button's action (read by screen readers).
 * @param hint  - Optional additional context about what happens when activated.
 *
 * @example
 * <TouchableOpacity {...a11yButton('Buscar medicamento', 'Abre los resultados de búsqueda')} />
 */
export function a11yButton(label: string, hint?: string): A11yButtonProps {
  const props: A11yButtonProps = {
    accessibilityRole: 'button',
    accessibilityLabel: label,
  };
  if (hint !== undefined) {
    props.accessibilityHint = hint;
  }
  return props;
}

/**
 * Returns accessibility props for a static text element.
 *
 * @param label - Text content or description to expose to assistive technologies.
 *
 * @example
 * <Text {...a11yText('Nombre comercial: Advil')} />
 */
export function a11yText(label: string): A11yTextProps {
  return {
    accessibilityRole: 'text',
    accessibilityLabel: label,
  };
}

/**
 * Returns accessibility props for a heading / section header element.
 *
 * @param label - The heading text to expose to assistive technologies.
 *
 * @example
 * <Text {...a11yHeader('Resultados de búsqueda')} />
 */
export function a11yHeader(label: string): A11yHeaderProps {
  return {
    accessibilityRole: 'header',
    accessibilityLabel: label,
  };
}
