/**
 * Canonical layout spacing values for consistent page structure.
 *
 * These constants enforce a unified spacing system across all pages,
 * reducing complexity and preventing layout inconsistencies.
 *
 * Usage: Import in PageLayout component and page-level components only.
 * Do NOT use directly in small UI components (buttons, inputs, etc).
 *
 * IMPORTANT: Padding values match Nav and Footer components for perfect alignment.
 */
export const LAYOUT = {
  /**
   * Page-level layout
   */
  page: {
    /**
     * Responsive padding (matches Nav/Footer):
     * - Horizontal: 16px mobile, 24px tablet, 32px desktop
     * - Top: 24px mobile, 32px tablet, 40px desktop
     * - Bottom: 96px mobile (bottom nav buffer), 64px md, 48px lg+
     */
    padding:
      "px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-24 md:pb-16 lg:pb-12" as const,
    /**
     * Max content width: 760px (custom max-w)
     * Narrower for form-focused pages, better readability
     */
    maxWidth: "max-w-[760px] mx-auto" as const,
    /** Vertical spacing between major sections (cards) */
    spacing: "space-y-10" as const, // 2.5rem / 40px - Consistent breathing room
    /** Spacing applied below page titles */
    titleSpacing: "mb-8" as const,
  },

  /**
   * Section-level layout (within a TerminalPanel or card)
   */
  section: {
    /** Vertical spacing between related items (form fields, list items) */
    spacing: "space-y-3" as const, // 0.75rem / 12px
  },
} as const;
