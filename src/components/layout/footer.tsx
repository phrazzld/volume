export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-12 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">© 2025</p>
          <a
            href="https://github.com/phrazzld/volume"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
