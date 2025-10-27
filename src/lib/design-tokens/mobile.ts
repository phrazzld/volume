/**
 * Mobile-first design tokens for touch-optimized interfaces
 *
 * Provides standardized values for touch targets, spacing, typography, and interactions
 * following iOS Human Interface Guidelines, Material Design, and WCAG accessibility standards.
 *
 * **Why 44px minimum touch targets?**
 * - iOS Human Interface Guidelines: 44x44pt minimum tappable area
 * - Material Design: 48x48dp minimum touch target
 * - WCAG 2.5.5 (Level AAA): 44x44px minimum for pointer inputs
 *
 * **References:**
 * - iOS HIG: https://developer.apple.com/design/human-interface-guidelines/layout
 * - Material Design: https://m3.material.io/foundations/accessible-design/accessibility-basics
 * - WCAG 2.5.5: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
 *
 * @module design-tokens/mobile
 */

/**
 * Touch target heights for mobile-optimized interactive elements
 *
 * Use these constants to ensure all tappable elements meet accessibility standards.
 *
 * **When to use:**
 * - `min`: Secondary buttons, list items, form inputs (44px - minimum standard)
 * - `comfortable`: Primary buttons, important CTAs (48px - recommended default)
 * - `large`: Hero CTAs, critical actions (56px - maximum emphasis)
 *
 * @example
 * ```tsx
 * // Button component
 * <Button className={MOBILE.TOUCH_TARGETS.min}>Secondary Action</Button>
 * <Button className={MOBILE.TOUCH_TARGETS.comfortable}>Primary Action</Button>
 * ```
 */
const TOUCH_TARGETS = {
  /** 44px - iOS/Android minimum, WCAG Level AAA compliant */
  min: "h-11" as const,
  /** 48px - Recommended default for primary actions */
  comfortable: "h-12" as const,
  /** 56px - Large CTAs and hero actions */
  large: "h-14" as const,
} as const;

/**
 * Spacing tokens for mobile layouts
 *
 * Provides consistent gap spacing between elements on mobile screens.
 *
 * **When to use:**
 * - `tight`: Compact mobile layouts, related items in groups (8px)
 * - `normal`: Standard spacing between form fields, list items (16px)
 * - `relaxed`: Section spacing, breathing room between major elements (24px)
 *
 * @example
 * ```tsx
 * // Form layout
 * <div className={`flex flex-col ${MOBILE.SPACING.normal}`}>
 *   <Input />
 *   <Input />
 * </div>
 * ```
 */
const SPACING = {
  /** 8px - Compact layouts, related items */
  tight: "gap-2" as const,
  /** 16px - Standard spacing between elements */
  normal: "gap-4" as const,
  /** 24px - Section spacing, breathing room */
  relaxed: "gap-6" as const,
} as const;

/**
 * Typography sizes optimized for mobile readability
 *
 * Ensures text is readable on small screens while preventing iOS auto-zoom.
 *
 * **Why 16px on mobile?**
 * iOS Safari automatically zooms in on input fields with font-size < 16px.
 * Using `text-base` (16px) on mobile prevents this disruptive behavior.
 *
 * **When to use:**
 * - `touch`: All input fields, interactive text (16px mobile, 14px desktop)
 * - `label`: Form labels, secondary text (14px all breakpoints)
 *
 * @example
 * ```tsx
 * // Input component
 * <input className={MOBILE.TYPOGRAPHY.touch} />
 *
 * // Form label
 * <label className={MOBILE.TYPOGRAPHY.label}>Email</label>
 * ```
 */
const TYPOGRAPHY = {
  /** 16px mobile, 14px desktop - Prevents iOS zoom on input focus */
  touch: "text-base md:text-sm" as const,
  /** 14px all breakpoints - Labels and secondary text */
  label: "text-sm" as const,
} as const;

/**
 * Interaction state styles for accessibility and feedback
 *
 * Provides visual feedback for touch interactions and keyboard navigation.
 *
 * **Accessibility rationale:**
 * - `active`: Visual feedback on press (WCAG 2.5.2 - Pointer Cancellation)
 * - `focus`: Keyboard focus indicator (WCAG 2.4.7 - Focus Visible)
 *
 * **When to use:**
 * - `active`: Apply to all tappable elements (buttons, cards, list items)
 * - `focus`: Apply to all keyboard-navigable elements (inputs, buttons, links)
 *
 * @example
 * ```tsx
 * // Button with touch feedback
 * <button className={`btn ${MOBILE.INTERACTION.active}`}>
 *   Tap Me
 * </button>
 *
 * // Input with focus indicator
 * <input className={MOBILE.INTERACTION.focus} />
 * ```
 */
const INTERACTION = {
  /** Touch feedback: scale and opacity on press (CSS-only, no JS) */
  active:
    "active:scale-95 active:opacity-90 transition-transform duration-75" as const,
  /** Keyboard focus indicator: visible ring on tab navigation */
  focus:
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" as const,
} as const;

/**
 * Mobile design token system
 *
 * Centralized mobile-first design values for touch-optimized interfaces.
 * Import and use these tokens instead of hardcoding px values or Tailwind classes directly.
 *
 * @example
 * ```tsx
 * import { MOBILE } from "@/lib/design-tokens/mobile";
 *
 * // Button component
 * <Button className={MOBILE.TOUCH_TARGETS.comfortable}>
 *   Primary Action
 * </Button>
 *
 * // Form layout
 * <form className={`flex flex-col ${MOBILE.SPACING.normal}`}>
 *   <input className={MOBILE.TYPOGRAPHY.touch} />
 * </form>
 * ```
 */
export const MOBILE = {
  TOUCH_TARGETS,
  SPACING,
  TYPOGRAPHY,
  INTERACTION,
} as const;
