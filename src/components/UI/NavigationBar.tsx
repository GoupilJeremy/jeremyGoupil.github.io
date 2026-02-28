export default function NavigationBar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-3 bg-[var(--color-bg-panel)] border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-wide">
          <span className="text-[var(--color-primary)]">Tech</span>
          <span className="text-[var(--color-text)]">Line</span>
        </h1>
        <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
          Encyclopédie interactive des Sciences & Technologies
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)]">Phase 0 — Prototype</span>
      </div>
    </nav>
  );
}
