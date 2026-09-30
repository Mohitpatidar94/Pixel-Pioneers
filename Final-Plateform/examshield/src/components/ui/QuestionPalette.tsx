// ExamShield Design System — QuestionPalette
import React from "react";

type QuestionState = "answered" | "unanswered" | "current";

interface PaletteItem {
  number: number;
  state: QuestionState;
}

interface QuestionPaletteProps {
  items: PaletteItem[];
  onSelect: (index: number) => void;
  className?: string;
}

const stateStyles: Record<QuestionState, string> = {
  current:    "bg-[#3b82d4] text-white border-[#3b82d4] ring-2 ring-[#3b82d4]/30",
  answered:   "bg-[#dcfce7] text-[#166534] border-[#86efac]",
  unanswered: "bg-white text-[#57606a] border-[#e5e7eb] hover:border-[#3b82d4]",
};

export function QuestionPalette({ items, onSelect, className = "" }: QuestionPaletteProps) {
  const answered = items.filter((i) => i.state === "answered").length;
  const unanswered = items.filter((i) => i.state === "unanswered").length;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-[#57606a]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#dcfce7] border border-[#86efac]" />
          Answered ({answered})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-white border border-[#e5e7eb]" />
          Not answered ({unanswered})
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5" role="list" aria-label="Question palette">
        {items.map((item, idx) => (
          <button
            key={item.number}
            onClick={() => onSelect(idx)}
            className={`h-9 w-full rounded border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82d4] ${stateStyles[item.state]}`}
            aria-label={`Question ${item.number}${item.state === "answered" ? ", answered" : ""}${item.state === "current" ? ", current" : ""}`}
            aria-current={item.state === "current" ? "true" : undefined}
            role="listitem"
          >
            {item.number}
          </button>
        ))}
      </div>
    </div>
  );
}
