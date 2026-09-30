// ExamShield Design System — QuestionCard
import React from "react";
import type { Question, AnswerValue } from "../../types";
import { Badge } from "./Badge";

interface QuestionCardProps {
  question: Question;
  answer: AnswerValue;
  onChange: (value: AnswerValue) => void;
  showNumber?: boolean;
}

export function QuestionCard({ question, answer, onChange, showNumber = true }: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        {showNumber && (
          <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#3b82d4] text-white text-sm font-bold">
            {question.number}
          </span>
        )}
        <div className="flex-1">
          <p className="text-[#1f2328] text-base leading-relaxed font-medium">{question.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="info">{typeLabel(question.type)}</Badge>
            <span className="text-xs text-[#57606a]">{question.points} {question.points === 1 ? "point" : "points"}</span>
          </div>
        </div>
      </div>

      {/* Answer area */}
      <div className="pl-0 md:pl-11">
        {(question.type === "mcq" || question.type === "true_false") && question.options && (
          <MCQInput
            options={question.options}
            value={answer as string}
            onChange={onChange}
          />
        )}

        {question.type === "multiple_select" && question.options && (
          <MultiSelectInput
            options={question.options}
            value={answer as string[]}
            onChange={onChange}
          />
        )}

        {question.type === "short_answer" && (
          <textarea
            className="w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-sm text-[#1f2328] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82d4] focus:border-[#3b82d4] resize-none"
            rows={3}
            placeholder="Type your answer here…"
            value={answer as string}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Answer for question ${question.number}`}
          />
        )}

        {(question.type === "long_answer") && (
          <textarea
            className="w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-sm text-[#1f2328] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82d4] focus:border-[#3b82d4] resize-none"
            rows={7}
            placeholder="Type your detailed answer here…"
            value={answer as string}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Answer for question ${question.number}`}
          />
        )}

        {question.type === "fill_blank" && (
          <input
            type="text"
            className="w-full rounded-lg border border-[#e5e7eb] px-3.5 py-2.5 text-sm text-[#1f2328] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82d4] focus:border-[#3b82d4]"
            placeholder="Fill in the blank…"
            value={answer as string}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Answer for question ${question.number}`}
          />
        )}
      </div>
    </div>
  );
}

// ------ Sub-components ------

function MCQInput({
  options,
  value,
  onChange,
}: {
  options: { id: string; text: string }[];
  value: string;
  onChange: (v: AnswerValue) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5" role="radiogroup">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors
            ${value === opt.id
              ? "border-[#3b82d4] bg-[#eff6ff]"
              : "border-[#e5e7eb] bg-white hover:border-[#93c5fd]"
            }`}
        >
          <input
            type="radio"
            name="mcq-option"
            value={opt.id}
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="mt-0.5 accent-[#3b82d4] shrink-0"
          />
          <span className="text-sm text-[#1f2328] leading-relaxed">{opt.text}</span>
        </label>
      ))}
    </div>
  );
}

function MultiSelectInput({
  options,
  value,
  onChange,
}: {
  options: { id: string; text: string }[];
  value: string[];
  onChange: (v: AnswerValue) => void;
}) {
  const selected = value ?? [];
  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors
            ${selected.includes(opt.id)
              ? "border-[#3b82d4] bg-[#eff6ff]"
              : "border-[#e5e7eb] bg-white hover:border-[#93c5fd]"
            }`}
        >
          <input
            type="checkbox"
            value={opt.id}
            checked={selected.includes(opt.id)}
            onChange={() => toggle(opt.id)}
            className="mt-0.5 accent-[#3b82d4] shrink-0"
          />
          <span className="text-sm text-[#1f2328] leading-relaxed">{opt.text}</span>
        </label>
      ))}
    </div>
  );
}

function typeLabel(type: Question["type"]): string {
  switch (type) {
    case "mcq": return "Multiple Choice";
    case "multiple_select": return "Multiple Select";
    case "true_false": return "True / False";
    case "short_answer": return "Short Answer";
    case "long_answer": return "Long Answer";
    case "fill_blank": return "Fill in the Blank";
    default: return type;
  }
}
