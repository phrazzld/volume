/**
 * Canonical layout spacing values for consistent page structure.
 *
 * These constants enforce a unified spacing system across all pages,
 * reducing complexity and preventing layout inconsistencies.
 *
 * Usage: Import in PageLayout component and page-level components only.
 * Do NOT use directly in small UI components (buttons, inputs, etc).
 */
export const LAYOUT = {
  /**
   * Page-level layout
   */
  page: {
    /** Responsive padding: mobile (12px), tablet (16px), desktop (24px) */
    padding: "p-3 sm:p-4 lg:p-6" as const,
    /** Max content width: 896px (same as Tailwind's max-w-4xl) */
    maxWidth: "max-w-4xl mx-auto" as const,
    /** Vertical spacing between major sections (TerminalPanels, cards) */
    spacing: "space-y-4" as const, // 1rem / 16px
  },

  /**
   * Section-level layout (within a TerminalPanel or card)
   */
  section: {
    /** Vertical spacing between related items (form fields, list items) */
    spacing: "space-y-3" as const, // 0.75rem / 12px
  },
} as const;
