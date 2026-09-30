// ============================================================
// ExamShield — Exam Session Context
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  ExamSession,
  ExamSecurityEvent,
  SessionStatus,
  SecurityStatus,
} from "../types";
import type { Exam, StudentAnswer } from "../types";

// ------ State shape ------

interface SessionState {
  session: ExamSession | null;
  exam: Exam | null;
  answers: StudentAnswer[];
  currentQuestionIndex: number;
}

// ------ Actions ------

type Action =
  | { type: "CREATE_SESSION"; payload: { exam: Exam; studentName: string; candidateId: string } }
  | { type: "SET_STATUS"; payload: SessionStatus }
  | { type: "SET_SECURITY_STATUS"; payload: SecurityStatus }
  | { type: "START_EXAM" }
  | { type: "ADD_EVENT"; payload: ExamSecurityEvent }
  | { type: "SET_ANSWER"; payload: StudentAnswer }
  | { type: "SET_QUESTION_INDEX"; payload: number }
  | { type: "SUBMIT_EXAM" }
  | { type: "RESET" };

// ------ Reducer ------

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "CREATE_SESSION": {
      const { exam, studentName, candidateId } = action.payload;
      const session: ExamSession = {
        sessionId: uuidv4(),
        examId: exam.id,
        candidateId,
        studentName,
        startedAt: null,
        submittedAt: null,
        status: "system_check",
        securityStatus: "CHECKING",
        events: [],
      };
      return { ...state, session, exam, answers: [], currentQuestionIndex: 0 };
    }

    case "SET_STATUS":
      if (!state.session) return state;
      return { ...state, session: { ...state.session, status: action.payload } };

    case "SET_SECURITY_STATUS":
      if (!state.session) return state;
      return { ...state, session: { ...state.session, securityStatus: action.payload } };

    case "START_EXAM":
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          status: "active",
          startedAt: new Date().toISOString(),
        },
      };

    case "ADD_EVENT":
      if (!state.session) return state;
      return {
        ...state,
        session: { ...state.session, events: [...state.session.events, action.payload] },
      };

    case "SET_ANSWER": {
      const existing = state.answers.findIndex(
        (a) => a.questionId === action.payload.questionId
      );
      const answers =
        existing >= 0
          ? state.answers.map((a, i) => (i === existing ? action.payload : a))
          : [...state.answers, action.payload];
      return { ...state, answers };
    }

    case "SET_QUESTION_INDEX":
      return { ...state, currentQuestionIndex: action.payload };

    case "SUBMIT_EXAM":
      if (!state.session) return state;
      return {
        ...state,
        session: {
          ...state.session,
          status: "submitted",
          submittedAt: new Date().toISOString(),
        },
      };

    case "RESET":
      return { session: null, exam: null, answers: [], currentQuestionIndex: 0 };

    default:
      return state;
  }
}

// ------ Context ------

interface SessionContextValue {
  state: SessionState;
  createSession: (exam: Exam, studentName: string, candidateId: string) => void;
  setStatus: (status: SessionStatus) => void;
  setSecurityStatus: (status: SecurityStatus) => void;
  startExam: () => void;
  addEvent: (event: ExamSecurityEvent) => void;
  setAnswer: (answer: StudentAnswer) => void;
  setQuestionIndex: (index: number) => void;
  submitExam: () => void;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    session: null,
    exam: null,
    answers: [],
    currentQuestionIndex: 0,
  });

  const createSession = useCallback(
    (exam: Exam, studentName: string, candidateId: string) =>
      dispatch({ type: "CREATE_SESSION", payload: { exam, studentName, candidateId } }),
    []
  );
  const setStatus = useCallback(
    (status: SessionStatus) => dispatch({ type: "SET_STATUS", payload: status }),
    []
  );
  const setSecurityStatus = useCallback(
    (status: SecurityStatus) => dispatch({ type: "SET_SECURITY_STATUS", payload: status }),
    []
  );
  const startExam = useCallback(() => dispatch({ type: "START_EXAM" }), []);
  const addEvent = useCallback(
    (event: ExamSecurityEvent) => dispatch({ type: "ADD_EVENT", payload: event }),
    []
  );
  const setAnswer = useCallback(
    (answer: StudentAnswer) => dispatch({ type: "SET_ANSWER", payload: answer }),
    []
  );
  const setQuestionIndex = useCallback(
    (index: number) => dispatch({ type: "SET_QUESTION_INDEX", payload: index }),
    []
  );
  const submitExam = useCallback(() => dispatch({ type: "SUBMIT_EXAM" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return (
    <SessionContext.Provider
      value={{
        state,
        createSession,
        setStatus,
        setSecurityStatus,
        startExam,
        addEvent,
        setAnswer,
        setQuestionIndex,
        submitExam,
        reset,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
