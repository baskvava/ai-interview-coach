"use client";

import {
  AlertCircle,
  ArrowLeft,
  Bot,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type StarterCodeMap = {
  javascript: string;
  python: string;
  java: string;
  typescript: string;
};

type ProblemSummary = {
  id: string | number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

type Problem = {
  id: string | number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCodeMap: StarterCodeMap;
};

type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: Date;
  type?: "text" | "code-feedback" | "system";
};

type ReportData = {
  scores: {
    problemSolving: number;
    codeQuality: number;
    communication: number;
  };
  feedback: string;
};

type LanguageConfig = {
  name: string;
  fileName: string;
};

type ThemeConfig = {
  name: string;
  bg: string;
  text: string;
  gutterBg: string;
  gutterText: string;
  border: string;
};

type FontConfig = {
  name: string;
  value: string;
  url?: string;
};

const LANGUAGES: Record<string, LanguageConfig> = {
  javascript: { name: "JavaScript", fileName: "solution.js" },
  python: { name: "Python", fileName: "solution.py" },
  java: { name: "Java", fileName: "Solution.java" },
  typescript: { name: "TypeScript", fileName: "solution.ts" },
};

const THEMES: Record<string, ThemeConfig> = {
  "vscode-dark": {
    name: "VS Code Dark",
    bg: "#1e1e1e",
    text: "#d4d4d4",
    gutterBg: "#1e1e1e",
    gutterText: "#858585",
    border: "#333333",
  },
  "vscode-light": {
    name: "VS Code Light",
    bg: "#ffffff",
    text: "#000000",
    gutterBg: "#ffffff",
    gutterText: "#237893",
    border: "#e5e5e5",
  },
  monokai: {
    name: "Monokai",
    bg: "#272822",
    text: "#f8f8f2",
    gutterBg: "#272822",
    gutterText: "#90908a",
    border: "#49483e",
  },
  dracula: {
    name: "Dracula",
    bg: "#282a36",
    text: "#f8f8f2",
    gutterBg: "#282a36",
    gutterText: "#6272a4",
    border: "#44475a",
  },
  nord: {
    name: "Nord",
    bg: "#2e3440",
    text: "#d8dee9",
    gutterBg: "#2e3440",
    gutterText: "#4c566a",
    border: "#434c5e",
  },
};

const FONTS: Record<string, FontConfig> = {
  default: {
    name: "System Default",
    value:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  "comic-shanns": {
    name: "Comic Shanns Mono",
    value: '"Comic Shanns Mono", monospace',
    url: "https://cdn.jsdelivr.net/npm/comic-shanns-mono@1.0.0/comic-shanns-mono.css",
  },
  "fira-code": {
    name: "Fira Code",
    value: '"Fira Code", monospace',
    url: "https://cdn.jsdelivr.net/npm/firacode@6.2.0/distr/fira_code.css",
  },
};

// --- Configuration ---
// In a real open-source environment, this would likely be empty or an env variable.
// We will modify callGemini to look for a user-provided key first.
const defaultEnvKey = "";

// --- API Helper ---

// async function callGemini(
//   prompt: string,
//   systemInstruction: string = "",
//   responseMimeType: string = "text/plain"
// ) {
//   try {
//     // 1. Check for user-provided key in localStorage
//     const userKey = localStorage.getItem("gemini_api_key");
//     // 2. Fallback to env key (if any)
//     const apiKey = userKey || defaultEnvKey;

//     if (!apiKey) {
//       throw new Error("API_KEY_MISSING");
//     }

//     const body: any = {
//       contents: [{ parts: [{ text: prompt }] }],
//       systemInstruction: { parts: [{ text: systemInstruction }] },
//     };

//     if (responseMimeType === "application/json") {
//       body.generationConfig = { responseMimeType: "application/json" };
//     }

//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(body),
//       }
//     );

//     if (!response.ok) {
//       if (response.status === 400 || response.status === 403) {
//         throw new Error("INVALID_API_KEY");
//       }
//       throw new Error(`API call failed: ${response.statusText}`);
//     }

//     const data = await response.json();
//     return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
//   } catch (error) {
//     console.error("Gemini API Error:", error);
//     throw error;
//   }
// }
async function callOllama(
  prompt: string,
  systemInstruction: string = "",
  responseMimeType: string = "text/plain"
) {
  try {
    // 1. Ollama Endpoint (Default is localhost:11434)
    // 記得要先確保 Ollama 應用程式已開啟
    const endpoint = "http://localhost:11434/api/chat";

    // 2. Construct Messages
    const messages = [];

    // Add system instruction if present
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    // Add user prompt
    messages.push({ role: "user", content: prompt });

    // 3. Construct Body
    const body: any = {
      model: "qwen2.5", // 確保你有先執行 `ollama pull llama3`, qwen2.5:14b, qwen2.5
      messages: messages,
      stream: false, // 關閉串流，一次拿回完整回應
    };

    // Handle JSON format request
    if (responseMimeType === "application/json") {
      body.format = "json";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama API call failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Ollama response structure: data.message.content
    return data.message?.content || "";
  } catch (error) {
    console.error("Ollama API Error:", error);
    // 檢查是否因為 CORS 或服務未啟動導致的錯誤
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(
        "Make sure Ollama is running and CORS is configured if calling from a browser."
      );
    }
    throw error;
  }
}

const ChatMessage = ({ message }: { message: Message }) => {
  const isAi = message.sender === "ai";

  return (
    <div
      className={`flex w-full mb-4 ${isAi ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`flex max-w-[85%] ${isAi ? "flex-row" : "flex-row-reverse"}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAi ? "bg-indigo-600 mr-2" : "bg-gray-600 ml-2"
          }`}
        >
          {isAi ? (
            <Bot size={20} className="text-white" />
          ) : (
            <span className="text-white text-xs font-bold">YOU</span>
          )}
        </div>

        <div
          className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${
            message.type === "system"
              ? "bg-gray-800 text-gray-400 border border-gray-700 w-full text-center italic"
              : isAi
              ? "bg-gray-700 text-gray-100 rounded-tl-none"
              : "bg-indigo-600 text-white rounded-tr-none"
          }`}
        >
          {message.text}
          <div
            className={`text-[10px] mt-1 ${
              isAi ? "text-gray-400" : "text-indigo-200"
            } text-right`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CodeEditor = ({
  code,
  setCode,
  language,
  themeKey,
  fontKey,
}: {
  code: string;
  setCode: (s: string) => void;
  language: string;
  themeKey: string;
  fontKey: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = THEMES[themeKey];
  const font = FONTS[fontKey];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      setCode(value.substring(0, start) + "    " + value.substring(end));

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const lines = code.split("\n").length;

  return (
    <div
      className="relative h-full w-full font-mono text-sm overflow-hidden flex flex-col transition-colors duration-300"
      style={{ backgroundColor: theme.bg, fontFamily: font.value }}
    >
      <div className="flex-1 flex relative">
        <div
          className="w-12 text-right pr-3 pt-4 select-none leading-6 transition-colors duration-300"
          style={{
            backgroundColor: theme.gutterBg,
            color: theme.gutterText,
            borderRight: `1px solid ${theme.border}`,
            fontFamily: font.value,
          }}
        >
          {Array.from({ length: Math.max(lines, 20) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent p-4 outline-none resize-none leading-6 whitespace-pre transition-colors duration-300"
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          style={{
            tabSize: 4,
            color: theme.text,
            fontFamily: font.value,
          }}
        />
      </div>
      <div className="h-6 bg-[#007acc] text-white text-xs flex items-center px-4 justify-between select-none">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1">
            <span className="font-bold">Language:</span>
            <span>{LANGUAGES[language].name}</span>
          </span>
        </div>
        <span>Ln {lines}, Col 1</span>
      </div>
    </div>
  );
};

export const InterviewPage = ({
  problemSummary,
  onBack,
  onOpenSettings,
}: {
  problemSummary: ProblemSummary;
  onBack: () => void;
  onOpenSettings: () => void;
}) => {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState<"problem" | "chat">("problem");
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("javascript");
  const [selectedTheme, setSelectedTheme] = useState<string>("vscode-dark");
  const [selectedFont, setSelectedFont] = useState<string>("default");

  const [code, setCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timer, setTimer] = useState(0);

  const [runCount, setRunCount] = useState(0);
  const [hintCount, setHintCount] = useState(0);

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Fetch Full Problem Details on Mount ---
  useEffect(() => {
    const fetchProblemDetails = async () => {
      setIsLoadingProblem(true);
      setErrorMsg("");
      try {
        const prompt = `Generate a comprehensive ALGORITHMIC coding interview problem for the title: "${problemSummary.title}".
        Difficulty: ${problemSummary.difficulty}.

        CRITICAL INSTRUCTION: Frame the problem description as a REAL-WORLD SOFTWARE ENGINEERING SCENARIO. 
        For example, if the algorithm is "Two Sum", describe it as "Finding two transactions that sum to a specific value for fraud detection" or "Matching two products to hit a coupon value".
        Do not just say "Given an array of integers...". The goal is to teach practical application.

        Requirements for "starterCodeMap":
        - Provide the full function signature.
        - **The function MUST have a body (use "// TODO" or "pass") and MUST be closed with "}".**
        - Do not output partial code.

        Requirements for "examples":
        - **Input Format**: Clearly label variable names matching the function signature (e.g., "transactions = [10, 50], target = 60").
        - **Real-World Explanation**: The explanation MUST tie back to the business scenario (e.g., "Transaction #1 ($10) and Transaction #2 ($50) sum to the target $60").
        - **Coverage**: Include at least 3 examples:
          1. A standard happy path.
          2. An edge case (e.g., empty input, single element, or no solution).
          3. A complex case (e.g., negative numbers or large inputs).

        Example format for starterCodeMap:
        {
          "javascript": "function solve(nums) { \n    // TODO \n}",
          "python": "def solve(nums):\n    pass"
        }

        Return a JSON object with this EXACT structure (no markdown).

        Your Task:
        {
            "id": "${problemSummary.id}",
            "title": "${problemSummary.title}",
            "difficulty": "${problemSummary.difficulty}",
            "description": "A professional problem description set in a real-world context (in English). Use markdown for formatting (e.g., "code blocks" for variable names).",
            "examples": [
                { 
                    "input": "arg1 = [value], arg2 = value", 
                    "output": "expected_return_value", 
                    "explanation": "Detailed explanation linking back to the real-world scenario." 
                }
            ],
            "constraints": ["Constraint 1", "Constraint 2 (e.g., Time Complexity O(n))"],
            "starterCodeMap": {
                "javascript": "...",
                "python": "...",
                "java": "...",
                "typescript": "..."
            }
        }

        Ensure code is correctly escaped string.`;

        const responseText = await callOllama(
          prompt,
          "You are a senior technical interviewer focused on Algorithms.",
          "application/json"
        );
        const data = JSON.parse(responseText);

        // Fix: Clean double-escaped newlines in the code strings
        if (data.starterCodeMap) {
          for (const lang in data.starterCodeMap) {
            if (typeof data.starterCodeMap[lang] === "string") {
              data.starterCodeMap[lang] = data.starterCodeMap[lang].replace(
                /\\n/g,
                "\n"
              );
            }
          }
        }
        console.log("Fetched Problem Data:", data);
        setProblem(data);
        setCode(data.starterCodeMap["javascript"] || "");

        // Initial greeting
        setMessages([
          {
            id: "init-1",
            sender: "ai",
            text: `Hello! I'm your AI Interviewer. Today we'll be tackling the algorithmic problem "${data.title}".\n\nTake some time to read the description. Feel free to discuss your approach (Time/Space complexity) with me. Ready when you are!`,
            timestamp: new Date(),
          },
        ]);
      } catch (e: any) {
        console.error("Failed to generate problem", e);
        if (e.message === "API_KEY_MISSING") {
          setErrorMsg(
            "Please set your API Key in Settings to generate the problem."
          );
        }
      } finally {
        setIsLoadingProblem(false);
      }
    };

    fetchProblemDetails();
  }, [problemSummary]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const langKey = selectedLanguage as keyof StarterCodeMap;
      setCode(problem.starterCodeMap[langKey] || "");
    }
  }, [selectedLanguage, problem]);

  // Determine if problem is inserted
  const commentPrefix = selectedLanguage === "python" ? "# " : "// ";
  const headerStart = problem ? `${commentPrefix}Problem: ${problem.id}` : "";
  const isProblemInserted = code.startsWith(headerStart);

  const systemPrompt = `You are a professional, patient, and Socratic technical interviewer.
  Current Problem: "${problem?.title}".
  User Language: "${LANGUAGES[selectedLanguage].name}".
  Problem Description: "${problem?.description}".
  
  Your core responsibilities:
  1. **Guide, don't solve**: Your goal is to evaluate the candidate's algorithmic thinking.
  2. **Progressive Hinting**:
     - If the code is wrong, don't give the answer immediately. Point out logic flaws or edge cases first.
     - Only provide concrete code fixes if the candidate fails repeatedly.
  3. **Checkpoints**:
     - Logic correctness.
     - Time complexity (Big O).
     - Space complexity.
     - Edge cases handling.
  4. **Tone**: Professional, encouraging, concise.
  5. **Language**: Please answer in English.`;

  useEffect(() => {
    if (showReport || isLoadingProblem || errorMsg) return;

    const interval = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showReport, isLoadingProblem, errorMsg]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, isAiTyping]);

  const addMessage = (msg: Omit<Message, "timestamp">) => {
    setMessages((prev) => [...prev, { ...msg, timestamp: new Date() }]);
  };

  const handleLanguageChange = (langKey: string) => {
    setSelectedLanguage(langKey);
  };

  const handleToggleProblem = () => {
    if (!problem) return;
    const separator = `${commentPrefix}${"=".repeat(60)}`;

    if (isProblemInserted) {
      const firstSepIndex = code.indexOf(separator);
      if (firstSepIndex !== -1) {
        const secondSepIndex = code.indexOf(
          separator,
          firstSepIndex + separator.length
        );
        if (secondSepIndex !== -1) {
          let endIndex = secondSepIndex + separator.length;
          while (endIndex < code.length && code[endIndex] === "\n") {
            endIndex++;
          }
          setCode(code.substring(endIndex));
        }
      }
    } else {
      const formatLines = (text: string) =>
        text
          .split("\n")
          .map((line) => `${commentPrefix}${line}`)
          .join("\n");
      const header = `${commentPrefix}Problem: ${problem.id}. ${problem.title}`;
      const description = formatLines(problem.description);
      const examplesTitle = `${commentPrefix}Examples:`;
      const examples = problem.examples
        .map((ex, idx) => {
          const exLines = [
            `${commentPrefix}Example ${idx + 1}:`,
            `${commentPrefix}  Input: ${ex.input}`,
            `${commentPrefix}  Output: ${ex.output}`,
          ];
          if (ex.explanation)
            exLines.push(`${commentPrefix}  Explanation: ${ex.explanation}`);
          return exLines.join("\n");
        })
        .join(`\n${commentPrefix}\n`);
      const constraintsTitle = `${commentPrefix}Constraints:`;
      const constraints = problem.constraints
        .map((c) => `${commentPrefix}  - ${c}`)
        .join("\n");

      const problemBlock = [
        header,
        separator,
        description,
        commentPrefix,
        examplesTitle,
        examples,
        commentPrefix,
        constraintsTitle,
        constraints,
        separator,
        "\n",
      ].join("\n");

      setCode((prev) => problemBlock + prev);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    addMessage({ id: Date.now().toString(), sender: "user", text: textToSend });
    setInputText("");
    setIsAiTyping(true);

    const historyContext = messages
      .slice(-10)
      .map(
        (m) =>
          `[${m.sender === "user" ? "Candidate" : "Interviewer"}]: ${m.text}`
      )
      .join("\n");

    const conversationContext = `
      [Context]:
      ${historyContext}
      
      [Language]:
      ${LANGUAGES[selectedLanguage].name}

      [Current Code]:
      ${code}

      [User Message]:
      ${textToSend}
    `;

    try {
      const aiResponseText = await callOllama(
        conversationContext,
        systemPrompt
      );
      addMessage({
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponseText,
      });
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        addMessage({
          id: Date.now().toString(),
          sender: "ai",
          type: "system",
          text: "Please set your API Key in Settings to continue.",
        });
      } else {
        addMessage({
          id: Date.now().toString(),
          sender: "ai",
          text: "Sorry, connection error occurred.",
        });
      }
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setRunCount((prev) => prev + 1);
    setActiveTab("chat");

    const reviewPrompt = `
      Act as a technical interviewer and review the candidate's algorithmic solution.
      
      [Language]: ${LANGUAGES[selectedLanguage].name}
      [User Content]:
      ${code}

      Please evaluate:
      1. Logic correctness.
      2. Time complexity (Big O).
      3. Space complexity.
      4. Edge cases.
      
      Format: Start with an overall status (✅ or ⚠️), then provide specific feedback. Keep it encouraging.
    `;

    try {
      const aiResponseText = await callOllama(reviewPrompt, systemPrompt);
      addMessage({
        id: Date.now().toString(),
        sender: "ai",
        type: "code-feedback",
        text: aiResponseText,
      });
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        addMessage({
          id: Date.now().toString(),
          sender: "ai",
          type: "system",
          text: "Please set your API Key in Settings to run code.",
        });
      } else {
        addMessage({
          id: Date.now().toString(),
          sender: "ai",
          type: "code-feedback",
          text: "⚠️ Unable to connect to AI server.",
        });
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleEndInterview = async () => {
    setShowReport(true);
    setReportData(null);

    if (!problem) return;

    try {
      const langKey = selectedLanguage as keyof StarterCodeMap;
      const starterCode = problem.starterCodeMap[langKey] || "";

      const transcript = messages
        .map((m) => `[${m.sender}]: ${m.text}`)
        .join("\n");

      const prompt = `
        You are a strict technical interviewer evaluating a candidate's performance.
        
        [Problem]: ${problem.title} (${problem.difficulty})
        [Time Spent]: ${formatTime(timer)}
        [Executions]: ${runCount}
        [Hints Used]: ${hintCount}
        
        [Candidate's Final Code]:
        ${code}
        
        [Starter Code]:
        ${starterCode}
        
        [Chat Transcript]:
        ${transcript}
        
        TASK:
        Generate a performance report in JSON format.
        
        CRITICAL EVALUATION RULES:
        1. **Did they write code?** Compare the [Candidate's Final Code] with the [Starter Code]. If they are very similar or identical, the candidate did NOT attempt the problem. In this case, scores MUST be between 0 and 20.
        2. **Logic Correctness**: If code exists, does it solve the problem? 
        3. **Communication**: Did they ask good questions in the transcript?
        
        RETURN JSON STRUCTURE (No markdown):
        {
          "scores": {
            "problemSolving": number (0-100),
            "codeQuality": number (0-100),
            "communication": number (0-100)
          },
          "feedback": "A short, honest paragraph (2-4 sentences). If they wrote no code, explicitly say 'You didn't write any code' and encourage them to try. If they failed, explain why. Be realistic, not overly positive."
        }
      `;

      const responseText = await callOllama(
        prompt,
        "You are a strict code interviewer.",
        "application/json"
      );
      const report = JSON.parse(responseText);
      setReportData(report);
    } catch (e) {
      console.error("Failed to generate report", e);
      setReportData({
        scores: { problemSolving: 0, codeQuality: 0, communication: 0 },
        feedback:
          "Failed to generate report due to connection error. Please try again.",
      });
    }
  };

  const handleGetHint = () => {
    setHintCount((prev) => prev + 1);
    handleSendMessage(
      "I'm stuck. Can you give me a hint without giving away the answer?"
    );
  };

  const handleExport = () => {
    if (!problem || !reportData) return;

    const reportContent = `
========================================
AI INTERVIEW REPORT
========================================
Date: ${new Date().toLocaleString()}
Problem: ${problem.title} (${problem.difficulty})
Time Spent: ${formatTime(timer)}
Code Executions: ${runCount}
Hints Used: ${hintCount}

----------------------------------------
SCORES
----------------------------------------
Problem Solving: ${reportData.scores.problemSolving}/100
Code Quality:    ${reportData.scores.codeQuality}/100
Communication:   ${reportData.scores.communication}/100

----------------------------------------
FEEDBACK
----------------------------------------
${reportData.feedback}

----------------------------------------
PROBLEM DESCRIPTION
----------------------------------------
${problem.description}

----------------------------------------
YOUR SOLUTION (${LANGUAGES[selectedLanguage].name})
----------------------------------------
${code}

----------------------------------------
INTERVIEW TRANSCRIPT
----------------------------------------
${messages.map((m) => `[${m.sender.toUpperCase()}]: ${m.text}`).join("\n\n")}

========================================
Generated by AI InterviewPro
========================================
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview_report_${problem.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoadingProblem) {
    return (
      <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot size={24} className="text-indigo-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">
            AI Interviewer is preparing the problem...
          </h2>
          <p className="text-gray-400 text-sm">
            Generating requirements and test cases for "{problemSummary.title}"
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-center space-y-6 p-8">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-md">
          <div className="flex justify-center mb-4">
            <AlertCircle size={48} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Configuration Required
          </h2>
          <p className="text-gray-300 text-sm mb-6">{errorMsg}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              Go Back
            </button>
            <button
              onClick={onOpenSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-sm flex items-center gap-2"
            >
              <Settings size={16} /> Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#111] text-gray-200 font-sans overflow-hidden animate-in fade-in duration-500">
      {/* End Interview Report Modal */}
      {/* <InterviewReportModal
        show={showReport}
        onClose={() => setShowReport(false)}
        report={reportData}
        stats={{
          time: formatTime(timer),
          lines: code.split("\n").length,
          runs: runCount,
          hints: hintCount,
        }}
        onExport={handleExport}
        problemTitle={problem ? problem.title : "Unknown Problem"}
      /> */}

      {/* Header */}
      <header className="h-14 bg-[#181818] border-b border-gray-700 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
            title="Back to Home"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-md">
              <Terminal size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden md:inline">
              AI Interview<span className="text-indigo-500">Pro</span>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            <Clock size={14} className="text-gray-400" />
            <span className="font-mono text-sm">{formatTime(timer)}</span>
          </div>
          <div className="h-6 w-px bg-gray-700 mx-1"></div>
          <button
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handleEndInterview}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded transition-colors font-medium"
          >
            End Interview
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Code Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-700 min-w-[350px] md:min-w-[500px]">
          <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2 text-xs">
              <Code2 size={14} className="text-gray-400" />
              <div className="relative group">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-transparent text-gray-300 hover:text-white font-medium focus:outline-none cursor-pointer pr-4"
                >
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <option key={key} value={key} className="bg-[#1e1e1e]">
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-0 text-gray-400">
                  <ChevronRight size={12} className="rotate-90" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleProblem}
                className={`text-gray-400 hover:text-white transition-colors ${
                  isProblemInserted
                    ? "text-indigo-400 hover:text-indigo-300"
                    : ""
                }`}
                title={
                  isProblemInserted
                    ? "Remove Problem Comment"
                    : "Insert Problem Comment"
                }
              >
                <FileText
                  size={14}
                  className={isProblemInserted ? "text-indigo-400" : ""}
                />
              </button>
              <button
                onClick={() =>
                  setCode(
                    problem?.starterCodeMap[
                      selectedLanguage as keyof StarterCodeMap
                    ] || ""
                  )
                }
                className="text-gray-400 hover:text-white transition-colors"
                title="Reset Code"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                  isRunning
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Run & Review</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <CodeEditor
            code={code}
            setCode={setCode}
            language={selectedLanguage}
            themeKey={selectedTheme}
            fontKey={selectedFont}
          />
        </div>

        {/* Right Panel: Problem & Chat */}
        <div className="w-[400px] lg:w-[450px] flex flex-col bg-[#181818] flex-shrink-0 border-l border-gray-700">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("problem")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors border-b-2 ${
                activeTab === "problem"
                  ? "border-indigo-500 text-white bg-gray-800"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <FileText size={16} />
              <span>Description</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors border-b-2 ${
                activeTab === "chat"
                  ? "border-indigo-500 text-white bg-gray-800"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <MessageSquare size={16} />
              <span>AI Interviewer</span>
              {messages.length > 0 && activeTab !== "chat" && (
                <span className="w-2 h-2 bg-red-500 rounded-full ml-1 animate-pulse"></span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {activeTab === "problem" && problem && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-white">
                      {problem.title}
                    </h2>
                  </div>
                </div>

                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {problem.description}
                </div>

                {problem.examples.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white">Examples:</h3>
                    {problem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-[#252526] p-3 rounded-md border border-gray-700 text-sm font-mono"
                      >
                        <div className="mb-1">
                          <span className="text-gray-500">Input:</span>{" "}
                          <span className="text-gray-300">{ex.input}</span>
                        </div>
                        <div className="mb-1">
                          <span className="text-gray-500">Output:</span>{" "}
                          <span className="text-gray-300">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="mt-2 text-gray-400 text-xs italic">
                            Explanation: {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {problem.constraints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">
                      Constraints:
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="font-mono">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                      <Cpu size={48} className="mb-2" />
                      <p>Waiting to start...</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isAiTyping && (
                    <div className="flex w-full mb-4 justify-start">
                      <div className="flex max-w-[80%] flex-row">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 mr-2 flex items-center justify-center flex-shrink-0">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-gray-700 text-gray-400 p-3 rounded-lg rounded-tl-none flex items-center space-x-1">
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="px-4 pb-2 flex justify-end">
                  <button
                    onClick={handleGetHint}
                    disabled={isAiTyping}
                    className="text-xs flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Sparkles size={12} />
                    <span>Need a Hint?</span>
                  </button>
                </div>
                <div className="p-4 bg-[#1e1e1e] border-t border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="Type a message..."
                      className="w-full bg-[#2d2d2d] text-gray-200 pl-4 pr-10 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-700"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputText.trim() || isAiTyping}
                      className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    Powered by Gemini 2.5. AI can make mistakes. Use for
                    practice.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
