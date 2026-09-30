// ExamShield — App Router
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import { LandingPage } from "./pages/LandingPage";
import { EnterExamPage } from "./pages/EnterExamPage";
import { SystemCheckPage } from "./pages/SystemCheckPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { ExamReadyPage } from "./pages/ExamReadyPage";
import { ExamWorkspacePage } from "./pages/ExamWorkspacePage";
import { SubmittedPage } from "./pages/SubmittedPage";
import { TeacherPage } from "./pages/TeacherPage";

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/teacher" element={<TeacherPage />} />

          {/* Student exam flow */}
          <Route path="/enter-exam" element={<EnterExamPage />} />
          <Route path="/system-check" element={<SystemCheckPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/exam-ready" element={<ExamReadyPage />} />
          <Route path="/exam" element={<ExamWorkspacePage />} />
          <Route path="/submitted" element={<SubmittedPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
