// ============================================================
// ExamShield — Demo Exam Data
// ============================================================

import type { Exam } from "../types";

export const DEMO_EXAMS: Exam[] = [
  {
    id: "exam-cs-001",
    key: "EXAM-2026-001",
    title: "Computer Science Fundamentals",
    subject: "Computer Science",
    instructions:
      "Answer all questions carefully. You may not use any external resources. " +
      "This exam is proctored locally — your webcam feed is analysed on your device only.",
    settings: {
      duration: 30,
      oneQuestionMode: true,
      allowBackNavigation: true,
      securityLevel: "HIGH",
      autoSubmitOnExpiry: true,
    },
    questions: [
      {
        id: "cs-q1",
        number: 1,
        type: "mcq",
        text: "Which data structure follows the Last-In-First-Out (LIFO) principle?",
        options: [
          { id: "a", text: "Queue" },
          { id: "b", text: "Stack" },
          { id: "c", text: "Linked List" },
          { id: "d", text: "Binary Tree" },
        ],
        correctAnswer: "b",
        points: 1,
      },
      {
        id: "cs-q2",
        number: 2,
        type: "mcq",
        text: "What is the time complexity of binary search on a sorted array of n elements?",
        options: [
          { id: "a", text: "O(n)" },
          { id: "b", text: "O(n²)" },
          { id: "c", text: "O(log n)" },
          { id: "d", text: "O(1)" },
        ],
        correctAnswer: "c",
        points: 1,
      },
      {
        id: "cs-q3",
        number: 3,
        type: "true_false",
        text: "An array and a linked list have the same time complexity for random access.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "false",
        points: 1,
      },
      {
        id: "cs-q4",
        number: 4,
        type: "mcq",
        text: "Which sorting algorithm has the best average-case time complexity?",
        options: [
          { id: "a", text: "Bubble Sort" },
          { id: "b", text: "Insertion Sort" },
          { id: "c", text: "Merge Sort" },
          { id: "d", text: "Selection Sort" },
        ],
        correctAnswer: "c",
        points: 1,
      },
      {
        id: "cs-q5",
        number: 5,
        type: "multiple_select",
        text: "Which of the following are valid object-oriented programming principles? (Select all that apply)",
        options: [
          { id: "a", text: "Encapsulation" },
          { id: "b", text: "Compilation" },
          { id: "c", text: "Inheritance" },
          { id: "d", text: "Polymorphism" },
        ],
        correctAnswer: ["a", "c", "d"],
        points: 2,
      },
      {
        id: "cs-q6",
        number: 6,
        type: "mcq",
        text: "What does SQL stand for?",
        options: [
          { id: "a", text: "Structured Query Language" },
          { id: "b", text: "Simple Query Logic" },
          { id: "c", text: "Standard Question Language" },
          { id: "d", text: "Sequential Query Loader" },
        ],
        correctAnswer: "a",
        points: 1,
      },
      {
        id: "cs-q7",
        number: 7,
        type: "short_answer",
        text: "What is the primary purpose of a compiler in programming?",
        points: 2,
      },
      {
        id: "cs-q8",
        number: 8,
        type: "mcq",
        text: "In networking, what does HTTP stand for?",
        options: [
          { id: "a", text: "HyperText Transfer Protocol" },
          { id: "b", text: "High Transfer Text Protocol" },
          { id: "c", text: "Hyperlink Text Transmission Protocol" },
          { id: "d", text: "Host Transfer Text Procedure" },
        ],
        correctAnswer: "a",
        points: 1,
      },
      {
        id: "cs-q9",
        number: 9,
        type: "true_false",
        text: "RAM (Random Access Memory) is non-volatile storage.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "false",
        points: 1,
      },
      {
        id: "cs-q10",
        number: 10,
        type: "long_answer",
        text: "Explain the difference between a process and a thread in operating systems. Provide one example of when you would prefer threads over processes.",
        points: 3,
      },
    ],
  },
  {
    id: "exam-da-002",
    key: "EXAM-2026-002",
    title: "Data Analytics Basics",
    subject: "Data Analytics",
    instructions:
      "Answer all questions to the best of your ability. Show clear reasoning for descriptive questions. " +
      "This exam is proctored locally — your webcam feed is analysed on your device only.",
    settings: {
      duration: 25,
      oneQuestionMode: false,
      allowBackNavigation: true,
      securityLevel: "MEDIUM",
      autoSubmitOnExpiry: true,
    },
    questions: [
      {
        id: "da-q1",
        number: 1,
        type: "mcq",
        text: "Which measure of central tendency is most affected by extreme outliers?",
        options: [
          { id: "a", text: "Mode" },
          { id: "b", text: "Median" },
          { id: "c", text: "Mean" },
          { id: "d", text: "Range" },
        ],
        correctAnswer: "c",
        points: 1,
      },
      {
        id: "da-q2",
        number: 2,
        type: "mcq",
        text: "In a dataset, what does a correlation coefficient of -1 indicate?",
        options: [
          { id: "a", text: "No correlation" },
          { id: "b", text: "Perfect positive correlation" },
          { id: "c", text: "Perfect negative correlation" },
          { id: "d", text: "Weak negative correlation" },
        ],
        correctAnswer: "c",
        points: 1,
      },
      {
        id: "da-q3",
        number: 3,
        type: "true_false",
        text: "A bar chart is suitable for displaying continuous numerical data.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "false",
        points: 1,
      },
      {
        id: "da-q4",
        number: 4,
        type: "multiple_select",
        text: "Which of the following are common data cleaning tasks? (Select all that apply)",
        options: [
          { id: "a", text: "Handling missing values" },
          { id: "b", text: "Removing duplicate records" },
          { id: "c", text: "Encrypting the database" },
          { id: "d", text: "Standardising data formats" },
        ],
        correctAnswer: ["a", "b", "d"],
        points: 2,
      },
      {
        id: "da-q5",
        number: 5,
        type: "mcq",
        text: "What type of chart is best for showing the proportion of parts to a whole?",
        options: [
          { id: "a", text: "Line chart" },
          { id: "b", text: "Scatter plot" },
          { id: "c", text: "Pie chart" },
          { id: "d", text: "Histogram" },
        ],
        correctAnswer: "c",
        points: 1,
      },
      {
        id: "da-q6",
        number: 6,
        type: "short_answer",
        text: "What is the difference between structured and unstructured data? Give one example of each.",
        points: 2,
      },
      {
        id: "da-q7",
        number: 7,
        type: "mcq",
        text: "Which Python library is most commonly used for data manipulation and analysis?",
        options: [
          { id: "a", text: "NumPy" },
          { id: "b", text: "Matplotlib" },
          { id: "c", text: "Pandas" },
          { id: "d", text: "Scikit-learn" },
        ],
        correctAnswer: "c",
        points: 1,
      },
      {
        id: "da-q8",
        number: 8,
        type: "true_false",
        text: "Standard deviation measures the average distance of data points from the mean.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctAnswer: "true",
        points: 1,
      },
      {
        id: "da-q9",
        number: 9,
        type: "mcq",
        text: "In the context of machine learning, what is 'overfitting'?",
        options: [
          { id: "a", text: "A model that performs well on training data but poorly on new data" },
          { id: "b", text: "A model that performs poorly on both training and test data" },
          { id: "c", text: "A model trained with too little data" },
          { id: "d", text: "A model with no parameters" },
        ],
        correctAnswer: "a",
        points: 1,
      },
      {
        id: "da-q10",
        number: 10,
        type: "long_answer",
        text: "Describe the steps you would take to analyse a new dataset from scratch. Include how you would handle data quality issues and what visualisations you might create.",
        points: 3,
      },
    ],
  },
];

export function findExamByKey(key: string): Exam | undefined {
  return DEMO_EXAMS.find(
    (e) => e.key.trim().toUpperCase() === key.trim().toUpperCase()
  );
}
