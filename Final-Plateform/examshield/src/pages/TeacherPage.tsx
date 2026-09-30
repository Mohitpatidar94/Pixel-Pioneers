// ExamShield — Teacher/Evaluator placeholder page
import React from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { DEMO_EXAMS } from "../data/exams";

export function TeacherPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82d4] rounded"
            aria-label="Back to home"
          >
            <Logo size="sm" />
          </button>
          <Badge variant="info">Evaluator View</Badge>
        </div>
      </header>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1f2328]">Teacher / Evaluator</h1>
            <p className="text-sm text-[#57606a] mt-1">
              Manage exams and review integrity reports.
              Full evaluator analytics will be implemented by team Member 3.
            </p>
          </div>

          {/* Demo exams */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-[#57606a] uppercase tracking-wide">
              Available Exams
            </h2>
            {DEMO_EXAMS.map((exam) => (
              <Card key={exam.id} padding="md" className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[#1f2328]">{exam.title}</h3>
                    <p className="text-xs text-[#57606a] mt-0.5">{exam.subject}</p>
                  </div>
                  <Badge variant="default">{exam.key}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#57606a]">
                  <span className="px-2 py-1 bg-[#f7f8fa] border border-[#e5e7eb] rounded">
                    {exam.questions.length} questions
                  </span>
                  <span className="px-2 py-1 bg-[#f7f8fa] border border-[#e5e7eb] rounded">
                    {exam.settings.duration} min
                  </span>
                  <span className="px-2 py-1 bg-[#f7f8fa] border border-[#e5e7eb] rounded">
                    Security: {exam.settings.securityLevel}
                  </span>
                  <span className="px-2 py-1 bg-[#f7f8fa] border border-[#e5e7eb] rounded">
                    {exam.settings.oneQuestionMode ? "One-at-a-time" : "All questions"}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Integration note */}
          <div className="mt-8 p-4 rounded-xl bg-white border border-[#e5e7eb]">
            <p className="text-sm font-medium text-[#1f2328] mb-1">Evaluator Analytics Module</p>
            <p className="text-sm text-[#57606a]">
              Full evaluator analytics, integrity report signing, and session review will be
              implemented by Member 3 (Digital Signature + Evaluator Analytics).
              This page is the integration point for that module.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
