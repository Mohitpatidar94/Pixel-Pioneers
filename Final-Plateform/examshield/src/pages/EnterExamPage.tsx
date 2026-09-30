// ExamShield — Exam Key Entry Page
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { findExamByKey } from "../data/exams";
import { useSession } from "../context/SessionContext";

interface FormErrors {
  examKey?: string;
  studentName?: string;
}

export function EnterExamPage() {
  const navigate = useNavigate();
  const { createSession } = useSession();

  const [examKey, setExamKey] = useState("");
  const [studentName, setStudentName] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!examKey.trim()) errs.examKey = "Please enter your exam key.";
    if (!studentName.trim()) errs.studentName = "Please enter your full name.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    // Simulate async verification (could call Node.js API later)
    await new Promise((r) => setTimeout(r, 800));

    const exam = findExamByKey(examKey.trim());
    if (!exam) {
      setServerError("Invalid exam key. Please check and try again.");
      setLoading(false);
      return;
    }

    createSession(exam, studentName.trim(), candidateId.trim() || "N/A");
    navigate("/system-check");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center">
          <button
            onClick={() => navigate("/")}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82d4] rounded"
            aria-label="Back to home"
          >
            <Logo size="sm" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md" padding="lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-xl font-bold text-[#1f2328]">Enter Your Exam</h1>
            <p className="text-sm text-[#57606a] mt-1">
              Enter the exam key provided by your teacher.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label="Exam Key"
              placeholder="e.g. EXAM-2026-001"
              value={examKey}
              onChange={(e) => {
                setExamKey(e.target.value.toUpperCase());
                if (errors.examKey) setErrors((prev) => ({ ...prev, examKey: undefined }));
              }}
              error={errors.examKey}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              required
              aria-required="true"
            />

            <Input
              label="Full Name"
              placeholder="Your full name"
              value={studentName}
              onChange={(e) => {
                setStudentName(e.target.value);
                if (errors.studentName) setErrors((prev) => ({ ...prev, studentName: undefined }));
              }}
              error={errors.studentName}
              autoComplete="name"
              required
              aria-required="true"
            />

            <Input
              label="Candidate ID (optional)"
              placeholder="Student / Roll number"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              autoComplete="off"
            />

            {serverError && (
              <div
                className="rounded-lg border border-[#fca5a5] bg-[#fee2e2] px-4 py-3 text-sm text-[#991b1b]"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Continue
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 rounded-lg bg-[#f7f8fa] border border-[#e5e7eb]">
            <p className="text-xs text-[#57606a] font-medium mb-1">Demo exam keys:</p>
            <ul className="text-xs text-[#57606a] space-y-0.5 list-disc list-inside">
              <li><code className="font-mono">EXAM-2026-001</code> — Computer Science Fundamentals (30 min)</li>
              <li><code className="font-mono">EXAM-2026-002</code> — Data Analytics Basics (25 min)</li>
            </ul>
          </div>
        </Card>
      </main>
    </div>
  );
}
