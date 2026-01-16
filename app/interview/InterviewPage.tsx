"use client";

import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Clock,
  Code2,
  FileText,
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type StarterCodeMap,
  type ProblemSummary,
  type Problem,
  type Message,
  type ReportData,
  type ChatMessagePayload,
} from "./types";

import { LANGUAGES } from "./constants";
import { SYSTEM_INSTRUCTIONS } from "@/ai.config";

import { ChatMessage } from "./_components/ChatMessage";
import { CodeEditor } from "./_components/CodeEditor";

// --- API Helper (Direct Ollama call for non-streaming tasks) ---
async function callOllama(
  prompt: string,
  systemInstruction: string = "",
  responseMimeType: string = "text/plain"
) {
  try {
    const endpoint = "http://localhost:11434/api/chat";
    const messages = [];

    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const body: any = {
      model: "qwen2.5",
      messages: messages,
      stream: false, // Disable streaming, get full response at once
    };

    if (responseMimeType === "application/json") {
      body.format = "json";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Ollama API call failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || "";
  } catch (error) {
    console.error("Ollama API Error:", error);
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error(
        "Make sure Ollama is running and CORS is configured if calling from a browser."
      );
    }
    throw error;
  }
}

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
  /**
   * @todo
   * Move chat messages state management to a separate hook/component
   */
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
    // const fetchProblemDetails = async () => {
    //   setIsLoadingProblem(true);
    //   setErrorMsg("");
    //   try {
    // const prompt = `Generate a comprehensive ALGORITHMIC coding interview problem for the title: "${problemSummary.title}".
    // Difficulty: ${problemSummary.difficulty}.
    // CRITICAL INSTRUCTION: Frame the problem description as a REAL-WORLD SOFTWARE ENGINEERING SCENARIO.
    // For example, if the algorithm is "Two Sum", describe it as "Finding two transactions that sum to a specific value for fraud detection".
    // Requirements:
    // 1. "starterCodeMap": MUST contain full function signature, TODO body, and closing brace.
    // 2. "examples": Include input/output and explanation.
    // 3. Return strictly JSON.
    // Output Schema:
    // {
    //     "id": "${problemSummary.id}",
    //     "title": "${problemSummary.title}",
    //     "difficulty": "${problemSummary.difficulty}",
    //     "description": "Markdwon supported string",
    //     "examples": [{ "input": "...", "output": "...", "explanation": "..." }],
    //     "constraints": ["..."],
    //     "starterCodeMap": { "javascript": "...", "python": "..." }
    // }`;
    //     const responseText = await callOllama(
    //       prompt,
    //       "You are a senior technical interviewer focused on Algorithms. Return JSON only.",
    //       "application/json"
    //     );
    // const data = JSON.parse(responseText);
    // // Fix: Clean double-escaped newlines in the code strings
    // if (data.starterCodeMap) {
    //   for (const lang in data.starterCodeMap) {
    //     if (typeof data.starterCodeMap[lang] === "string") {
    //       data.starterCodeMap[lang] = data.starterCodeMap[lang].replace(
    //         /\\n/g,
    //         "\n"
    //       );
    //     }
    //   }
    // }
    // setProblem(data);
    // setCode(data.starterCodeMap["javascript"] || "");
    // // Initial greeting
    // setMessages([
    //   {
    //     id: "init-1",
    //     sender: "ai",
    //     text: `Hello! I'm your AI Interviewer. Today we'll be tackling the algorithmic problem "${data.title}".\n\nTake some time to read the description. Feel free to discuss your approach (Time/Space complexity) with me. Ready when you are!`,
    //     timestamp: new Date(),
    //   },
    // ]);
    //   } catch (e: any) {
    //     console.error("Failed to generate problem", e);
    //     setErrorMsg("Failed to generate problem. Please try again.");
    //   } finally {
    //     setIsLoadingProblem(false);
    //   }
    // };
    // fetchProblemDetails();
    const fetchProblemDetails = async (
      messagesPayload: ChatMessagePayload[]
    ) => {
      try {
        // Call Next.js backend API (Server-to-Server to Ollama)
        const res = await fetch("/api/generate-problem/groq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Send the entire messages array directly
          body: JSON.stringify({ messages: messagesPayload }),
        });

        // console.log("fetchProblemDetails res:", data);
        if (!res.ok || !res.body) throw new Error(res.statusText);
        console.log("fetchProblemDetails res", res);

        const data = await res.json();
        console.log("Generated Problem Raw Data:", data);
        // 1. 移除可能存在的 Markdown 標記 (```json 和 ```)
        const cleanContent = data.content
          .replace(/^```json\s*/, "") // 移除開頭的 ```json
          .replace(/^```\s*/, "") // 或者移除開頭單純的 ```
          .replace(/\s*```$/, ""); // 移除結尾的 ```
        const content = JSON.parse(cleanContent);
        console.log("Generated Problem Content:", content);
        if (content.starterCodeMap) {
          for (const lang in content.starterCodeMap) {
            if (typeof content.starterCodeMap[lang] === "string") {
              content.starterCodeMap[lang] = content.starterCodeMap[
                lang
              ].replace(/\\n/g, "\n");
            }
          }
        }
        setProblem(content);
        setCode(content.starterCodeMap["javascript"] || "");
        // Initial greeting
        setMessages([
          {
            id: "init-1",
            sender: "ai",
            text: `Hello! I'm your AI Interviewer. Today we'll be tackling the algorithmic problem "${data.title}".\n\nTake some time to read the description. Feel free to discuss your approach (Time/Space complexity) with me. Ready when you are!`,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        console.error("Streaming error:", error);
        // If error occurs, append error message to conversation
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.sender === "ai" && lastMsg.text === "") {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, text: "⚠️ Connection error occurred." },
            ];
          }
          return prev;
        });
      } finally {
        setIsLoadingProblem(false);
      }
    };

    fetchProblemDetails([
      {
        role: "system",
        content: SYSTEM_INSTRUCTIONS.PROBLEM_GEN(problemSummary),
      },
    ]);
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

  const systemPrompt = SYSTEM_INSTRUCTIONS.CHAT_GEN(problem, selectedLanguage);

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
      // Remove logic (simplified for brevity)
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
      // Insert logic
      const formatLines = (text: string) =>
        text
          .split("\n")
          .map((line) => `${commentPrefix}${line}`)
          .join("\n");
      // ... construct problemBlock ...
      const problemBlock = `${headerStart}...\n\n`; // simplified for brevity
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

  // ------------------------------------------------------------------
  //  MODIFIED: startStreaming
  //  Receives a structured array of messages
  // ------------------------------------------------------------------
  const startStreaming = async (messagesPayload: ChatMessagePayload[]) => {
    try {
      // Call Next.js backend API (Server-to-Server to Ollama)
      const res = await fetch("/api/stream-chat/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the entire messages array directly
        body: JSON.stringify({ messages: messagesPayload }),
      });

      if (!res.ok || !res.body) throw new Error(res.statusText);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Initialize AI response message
      const aiMessageId = Date.now().toString();
      addMessage({
        id: aiMessageId,
        sender: "ai",
        text: "", // Initially empty
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });

        // Real-time update of the last (AI) message content
        setMessages((prev) => {
          const lastMsg = prev[prev.length - 1];
          // Ensure we are updating the correct AI message
          if (lastMsg.id === aiMessageId) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, text: lastMsg.text + textChunk },
            ];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Streaming error:", error);
      // If error occurs, append error message to conversation
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.sender === "ai" && lastMsg.text === "") {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, text: "⚠️ Connection error occurred." },
          ];
        }
        return prev;
      });
    }
  };

  // ------------------------------------------------------------------
  //  MODIFIED: handleSendMessage
  //  Constructs the message history with roles and context injection
  // ------------------------------------------------------------------
  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    // 1. Display user message in UI
    addMessage({ id: Date.now().toString(), sender: "user", text: textToSend });
    setInputText("");
    setIsAiTyping(true);

    try {
      // 2. Construct System Message
      const systemMessage: ChatMessagePayload = {
        role: "system",
        content: systemPrompt,
      };

      // 3. Construct History (exclude UI hint messages of System type)
      const historyMessages: ChatMessagePayload[] = messages
        .filter((m) => m.type !== "system")
        .map((m) => ({
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.text,
        }));

      // 4. Construct current message (including Context Injection)
      // Here we inject the current code state to AI hiddenly, but UI only shows user's original input
      const contextRichContent = `
            ${textToSend}

            ---
            [Context Info]
            Language: ${LANGUAGES[selectedLanguage].name}
            Current Code:
            \`\`\`${selectedLanguage}
            ${code}
            \`\`\`
            `;

      const currentUserMessage: ChatMessagePayload = {
        role: "user",
        content: contextRichContent,
      };

      // 5. Combine into full Payload
      const payload = [systemMessage, ...historyMessages, currentUserMessage];

      // 6. Start streaming
      await startStreaming(payload);
    } catch (e: any) {
      console.error("Send message failed", e);
      addMessage({
        id: Date.now().toString(),
        sender: "ai",
        text: "Sorry, I encountered an error connecting to the server.",
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setRunCount((prev) => prev + 1);
    setActiveTab("chat");

    const reviewPrompt = `
      Act as a technical interviewer.
      [Language]: ${LANGUAGES[selectedLanguage].name}
      [Code]:
      ${code}

      Evaluate: Logic correctness, Big O, Edge cases.
      Format: Start with status (✅/⚠️), then feedback.
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
      addMessage({
        id: Date.now().toString(),
        sender: "ai",
        type: "code-feedback",
        text: "⚠️ Unable to connect to AI server.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleEndInterview = async () => {
    setShowReport(true);
    setReportData(null);

    if (!problem) return;

    try {
      const starterCode =
        problem.starterCodeMap[selectedLanguage as keyof StarterCodeMap] || "";

      // Simple transcript summary
      const transcript = messages
        .map((m) => `[${m.sender}]: ${m.text}`)
        .join("\n");

      const prompt = `
        Evaluate candidate performance.
        [Problem]: ${problem.title}
        [Code]: ${code}
        [Starter]: ${starterCode}
        [Transcript]: ${transcript}
        
        Return JSON: { "scores": { "problemSolving": 0-100, "codeQuality": 0-100, "communication": 0-100 }, "feedback": "..." }
      `;

      const responseText = await callOllama(
        prompt,
        "You are a strict technical interviewer. Return JSON only.",
        "application/json"
      );
      const report = JSON.parse(responseText);
      setReportData(report);
    } catch (e) {
      console.error("Report generation failed", e);
    }
  };

  const handleGetHint = () => {
    setHintCount((prev) => prev + 1);
    // Directly call handleSendMessage with default text
    handleSendMessage(
      "I'm stuck. Can you give me a hint without giving away the answer?"
    );
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
            AI Interviewer is preparing...
          </h2>
          <p className="text-gray-400 text-sm">
            Generating requirements for "{problemSummary.title}"
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="h-screen bg-[#111] flex flex-col items-center justify-center text-center space-y-6 p-8">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#111] text-gray-200 font-sans overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <header className="h-14 bg-[#181818] border-b border-gray-700 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center space-x-2">
            <Terminal size={20} className="text-indigo-500" />
            <span className="font-bold text-lg hidden md:inline">
              AI Interview<span className="text-indigo-500">Pro</span>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            <Clock size={14} className="text-gray-400" />
            <span className="font-mono text-sm">{formatTime(timer)}</span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-white"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handleEndInterview}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded"
          >
            End
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Code Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-700 min-w-87.5 md:min-w-125">
          <div className="h-10 bg-[#1e1e1e] border-b border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2 text-xs">
              <Code2 size={14} className="text-gray-400" />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-gray-300 hover:text-white focus:outline-none cursor-pointer"
              >
                {Object.entries(LANGUAGES).map(([key, lang]) => (
                  <option key={key} value={key} className="bg-[#1e1e1e]">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  setCode(
                    problem?.starterCodeMap[
                      selectedLanguage as keyof StarterCodeMap
                    ] || ""
                  )
                }
                className="text-gray-400 hover:text-white"
                title="Reset Code"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-medium ${
                  isRunning
                    ? "bg-gray-600"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isRunning ? (
                  <span>Analyzing...</span>
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
        <div className="w-100 lg:w-112.5 flex flex-col bg-[#181818] border-l border-gray-700">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("problem")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 ${
                activeTab === "problem"
                  ? "border-indigo-500 text-white bg-gray-800"
                  : "border-transparent text-gray-400"
              }`}
            >
              <FileText size={16} />
              <span>Problem</span>
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 ${
                activeTab === "chat"
                  ? "border-indigo-500 text-white bg-gray-800"
                  : "border-transparent text-gray-400"
              }`}
            >
              <MessageSquare size={16} />
              <span>AI Chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {activeTab === "problem" && problem && (
              <div className="p-6 space-y-6 text-sm text-gray-300">
                <h2 className="text-xl font-bold text-white">
                  {problem.title}
                </h2>
                <div className="whitespace-pre-wrap">{problem.description}</div>
                {problem.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="bg-[#252526] p-3 rounded border border-gray-700"
                  >
                    <div>
                      <span className="text-gray-500">Input:</span> {ex.input}
                    </div>
                    <div>
                      <span className="text-gray-500">Output:</span> {ex.output}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-[#1e1e1e] border-t border-gray-700">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={handleGetHint}
                      disabled={isAiTyping}
                      className="text-xs flex items-center space-x-1 text-indigo-400 hover:text-indigo-300"
                    >
                      <Sparkles size={12} />
                      <span>Need a Hint?</span>
                    </button>
                  </div>
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
                      className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
