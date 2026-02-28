import { useAppStore } from "../../stores/appStore";
import { formatYear } from "../../utils/timeScale";
import erasData from "../../data/eras.json";
import type { Era } from "../../types";

const eras = erasData as Era[];

export default function Timeline() {
  const currentYear = useAppStore((s) => s.currentYear);
  const setCurrentYear = useAppStore((s) => s.setCurrentYear);

  const handleEraClick = (era: Era) => {
    const midYear = Math.round((era.startYear + era.endYear) / 2);
    setCurrentYear(midYear);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg-panel)] border-t border-[var(--color-border)] px-6 py-3">
      <div className="flex items-center gap-4 mb-2">
        <span className="text-sm font-mono text-[var(--color-primary)] min-w-[140px]">
          {formatYear(Math.round(currentYear))}
        </span>
        <input
          type="range"
          min={0}
          max={1000}
          value={500}
          onChange={(e) => {
            const t = Number(e.target.value) / 1000;
            const year = -4_500_000_000 + t * (2026 - -4_500_000_000);
            setCurrentYear(Math.round(year));
          }}
          className="flex-1 accent-[var(--color-primary)] h-1 cursor-pointer"
        />
      </div>

      {/* Era chips */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {eras.map((era) => (
          <button
            key={era.id}
            onClick={() => handleEraClick(era)}
            className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition-all hover:opacity-100 opacity-70 cursor-pointer border-none"
            style={{ background: era.color, color: "#fff" }}
          >
            {era.label}
          </button>
        ))}
      </div>
    </div>
  );
}
