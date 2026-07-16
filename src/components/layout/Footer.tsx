export function Footer() {
  return (
    <footer className="border-t bg-muted/30 text-muted-foreground py-6 mt-12 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>&copy; 2026 Asset Inventory Management App</span>
        <div className="flex items-center gap-3">
          <span>Built with SheetJS &amp; Firebase</span>
        </div>
      </div>
    </footer>
  )
}
