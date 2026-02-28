import { useAppStore } from "../../stores/appStore";
import { formatYear } from "../../utils/timeScale";
import categoriesData from "../../data/categories.json";

export default function EventPanel() {
  const selectedEvent = useAppStore((s) => s.selectedEvent);
  const isPanelOpen = useAppStore((s) => s.isPanelOpen);
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);

  if (!selectedEvent || !isPanelOpen) return null;

  const category = categoriesData.find((c) => c.id === selectedEvent.category);

  return (
    <div className="absolute top-14 right-4 bottom-20 w-80 bg-[var(--color-bg-panel)] border border-[var(--color-border)] rounded-lg overflow-y-auto z-20">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-[var(--color-text)]">{selectedEvent.title}</h2>
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg leading-none cursor-pointer bg-transparent border-none"
          >
            &times;
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: category?.color ?? "#95a5a6", color: "#fff" }}
          >
            {category?.label ?? selectedEvent.category}
          </span>
          <span className="text-xs text-[var(--color-primary)] font-mono">
            {formatYear(selectedEvent.year)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {selectedEvent.protagonist && (
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Protagoniste
            </h3>
            <p className="text-sm text-[var(--color-text)]">{selectedEvent.protagonist}</p>
          </div>
        )}

        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Lieu
          </h3>
          <p className="text-sm text-[var(--color-text)]">{selectedEvent.location.name}</p>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
            Description
          </h3>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">
            {selectedEvent.summary}
          </p>
        </div>

        {selectedEvent.impact && (
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
              Impact
            </h3>
            <p className="text-sm text-[var(--color-text)] leading-relaxed">
              {selectedEvent.impact}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
