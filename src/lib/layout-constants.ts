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
     * - Vertical: 12px mobile, 16px tablet, 24px desktop
     */
    padding: "px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6" as const,
    /**
     * Max content width: 768px (max-w-3xl)
     * Narrower for form-focused pages, better readability
     */
    maxWidth: "max-w-3xl mx-auto" as const,
    /** Vertical spacing between major sections (cards) */
    spacing: "space-y-12" as const, // 3rem / 48px - Better visual separation
  },

  /**
   * Section-level layout (within a TerminalPanel or card)
   */
  section: {
    /** Vertical spacing between related items (form fields, list items) */
    spacing: "space-y-3" as const, // 0.75rem / 12px
  },
} as const;
