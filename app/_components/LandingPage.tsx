"use client";

import { AlertCircle, Code2, Loader2, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// --- Configuration ---
// In a real open-source environment, this would likely be empty or an env variable.
// We will modify callGemini to look for a user-provided key first.
const defaultEnvKey = "";

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
    // 1. 準備訊息陣列 (Messages)
    const messages = [];

    // 如果有 System Instruction，加入 system role
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    // 加入使用者的 prompt
    messages.push({ role: "user", content: prompt });

    // 2. 建構 Request Body
    const body: any = {
      model: "qwen2.5", // 指定使用 qwen2.5
      messages: messages,
      stream: false, // 設為 false 以便一次取得完整回應 (非串流)
    };

    // 如果需要 JSON 格式
    if (responseMimeType === "application/json") {
      body.format = "json";
    }

    // 3. 發送請求到本地 Ollama
    // 注意：如果是瀏覽器環境，需要設定 Ollama 環境變數 OLLAMA_ORIGINS="*"
    const response = await fetch("http://localhost:11434/api/chat", {
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

    // 4. 解析回應 (Ollama 的結構與 Gemini 不同)
    return data.message?.content || "";
  } catch (error) {
    console.error("Ollama API Error:", error);
    throw error;
  }
}

type ProblemSummary = {
  id: string | number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

export const LandingPage = ({
  onSelectProblem,
  onOpenSettings,
}: {
  onSelectProblem: (summary: ProblemSummary) => void;
  onOpenSettings: () => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<ProblemSummary[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  console.log({ results });

  // Fetch recommendations
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const query = searchTerm;
        // const prompt = `Provide a list of 5 algorithmic coding interview problem titles related to "${query}".

        // Focus ONLY on algorithms and data structures.
        // Return a JSON array of objects. Each object must have:
        // - "id": a unique string or number
        // - "title": the name of the problem (in English)
        // - "difficulty": one of "Easy", "Medium", "Hard"

        // Example JSON: [{"id": 1, "title": "Two Sum", "difficulty": "Easy"}]
        // Strictly JSON only.`;

        // const responseText = await callOllama(prompt, "", "application/json");
        // console.log("Raw response:", responseText);
        // const data = JSON.parse(responseText);
        // console.log("Parsed data:", data);
        // if (Array.isArray(data)) {
        //   setResults(data);
        // }
        // 1. 改良後的 Prompt
        const prompt = `You are a strict API. Return a JSON array of 5 algorithmic coding interview problems related to "${query}".
          Output format: [{"id": string, "title": string, "difficulty": "Easy"|"Medium"|"Hard"}]
          Do not output markdown. Return ONLY the raw JSON array.`;

        const responseText = await callOllama(prompt, "", "application/json");
        console.log("Raw response:", responseText);

        // 2. 加入清洗邏輯 (Cleaning Logic)
        // 移除可能存在的 markdown 標記 (```json 和 ```)
        const cleanJson = responseText.replace(/```json|```/g, "").trim();

        try {
          const data = JSON.parse(cleanJson);

          if (Array.isArray(data)) {
            setResults(data);
          } else {
            /**
             * @todo: Handle different response structures if needed
             * Raw response: {
                  "id": "twoSum",
                  "title": "Two Sum",
                  "difficulty": "Easy"
              }

              Raw response: {
                  "problems": [
                      {"id": "TW001", "title": "Two Sum", "difficulty": "Easy"},
                      {"id": "TW002", "title": "Three Sum", "difficulty": "Medium"},
                      {"id": "TW003", "title": "Two City Scheduling", "difficulty": "Hard"},
                      {"id": "TW004", "title": "Palindrome Partitioning II", "difficulty": "Hard"},
                      {"id": "TW005", "title": "Longest Substring Without Repeating Characters", "difficulty": "Medium"}
                  ]
              }
             */
            setResults(Object.values(data.problems || data.data || data)); // 根據實際回應結構調整
          }
        } catch (e) {
          console.error("Parse failed:", e);
        }
      } catch (error: any) {
        if (error.message === "API_KEY_MISSING") {
          setErrorMsg("Please set your API Key in Settings to search.");
        } else {
          console.error("Search failed", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-[#111] text-gray-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* <div className="absolute top-4 right-4 z-20">
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-400 hover:text-white transition-colors bg-[#1e1e1e] rounded-full border border-gray-700"
        >
          <Settings size={20} />
        </button>
      </div> */}

      <div className="w-full max-w-2xl flex flex-col items-center z-10">
        <div className="flex items-center gap-3 mb-10 transform hover:scale-105 transition-transform duration-500">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-2xl shadow-indigo-500/20">
            <Code2 size={48} className="text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              AI Interview<span className="text-indigo-400">Pro</span>
            </h1>
            <p className="text-gray-400 text-sm tracking-widest uppercase mt-1">
              Master Algorithms & Data Structures
            </p>
          </div>
        </div>

        <div className="w-full relative">
          <div
            className={`relative group transition-all duration-300 ${
              isFocused ? "scale-105" : ""
            }`}
          >
            <div
              className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-75 blur transition duration-500 ${
                isFocused ? "opacity-75" : ""
              }`}
            ></div>
            <div className="relative flex items-center bg-[#1e1e1e] rounded-full border border-gray-700 shadow-xl">
              <Search className="ml-6 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder="Search algorithms (e.g. Two Sum, Dynamic Programming...)"
                className="w-full bg-transparent text-white px-4 py-4 rounded-full focus:outline-none text-lg placeholder-gray-500"
              />
              {isLoading && (
                <Loader2
                  className="mr-6 animate-spin text-indigo-500"
                  size={20}
                />
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 text-red-200 rounded text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
              <button
                onClick={onOpenSettings}
                className="underline hover:text-white"
              >
                Open Settings
              </button>
            </div>
          )}

          {results.length > 0 && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-[#1e1e1e] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-top-4 fade-in duration-200">
              <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider bg-[#252526] flex justify-between items-center">
                <span>Recommended Problems</span>
                <span className="text-indigo-400 text-[10px] bg-indigo-400/10 px-2 py-0.5 rounded-full">
                  {searchTerm ? "Search Results" : "Popular"}
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {results.map((problem, idx) => (
                  <Link key={idx} href="interview">
                    <button
                      // onClick={() => onSelectProblem(problem)}

                      className="w-full text-left px-6 py-4 hover:bg-[#2d2d2d] transition-colors border-b border-gray-800 last:border-0 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-mono text-gray-400 group-hover:bg-indigo-900 group-hover:text-indigo-300 transition-colors">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-gray-200 font-medium group-hover:text-white flex items-center gap-2">
                            {problem.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            problem.difficulty === "Easy"
                              ? "border-green-800 text-green-400 bg-green-900/20"
                              : problem.difficulty === "Medium"
                              ? "border-yellow-800 text-yellow-400 bg-yellow-900/20"
                              : "border-red-800 text-red-400 bg-red-900/20"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {!searchTerm && (
          <div className="mt-8 flex gap-3 flex-wrap justify-center opacity-50 hover:opacity-100 transition-opacity">
            <span className="text-sm text-gray-500 py-1">Try searching:</span>
            {[
              "Two Sum",
              "Reverse Linked List",
              "Binary Tree Level Order",
              "Merge Intervals",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchTerm(tag)}
                className="px-3 py-1 bg-[#252526] hover:bg-[#333] border border-gray-700 rounded-full text-xs text-gray-300 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 text-xs text-gray-600">
        © 2026 AI Interview Pro. All rights reserved.
      </div>
    </div>
  );
};
