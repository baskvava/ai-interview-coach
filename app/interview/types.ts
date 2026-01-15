export type StarterCodeMap = {
  javascript: string;
  python: string;
  java: string;
  typescript: string;
};

export type ProblemSummary = {
  id: string | number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

export type Problem = {
  id: string | number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCodeMap: StarterCodeMap;
};

export type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: Date;
  type?: "text" | "code-feedback" | "system";
};

export type ReportData = {
  scores: {
    problemSolving: number;
    codeQuality: number;
    communication: number;
  };
  feedback: string;
};

export type LanguageConfig = {
  name: string;
  fileName: string;
};

export type ThemeConfig = {
  name: string;
  bg: string;
  text: string;
  gutterBg: string;
  gutterText: string;
  border: string;
};

export type FontConfig = {
  name: string;
  value: string;
  url?: string;
};

type ChatRole = "system" | "user" | "assistant";

export type ChatMessagePayload = {
  role: ChatRole;
  content: string;
};
