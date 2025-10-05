export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-terminal-bg border-t border-terminal-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-12 flex items-center justify-between">
          <p className="text-sm font-mono text-terminal-textSecondary uppercase">
            © 2025
          </p>
          <a
            href="https://github.com/phrazzld/volume"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-terminal-textSecondary uppercase hover:text-terminal-info transition-colors"
          >
            GITHUB ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
