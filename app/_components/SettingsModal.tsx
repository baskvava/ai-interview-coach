"use client";

// --- Settings Modal Component ---

import {
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Key,
  Palette,
  Settings,
  Type,
  X,
} from "lucide-react";
import { useState } from "react";

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

export const SettingsModal = ({
  show,
  onClose,
  onThemeChange,
  onFontChange,
  activeTheme,
  activeFont,
}: {
  show: boolean;
  onClose: () => void;
  onThemeChange: (key: string) => void;
  onFontChange: (key: string) => void;
  activeTheme: string;
  activeFont: string;
}) => {
  const [activeSection, setActiveSection] = useState<string>("api");
  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem("gemini_api_key") || ""
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveKey = () => {
    localStorage.setItem("gemini_api_key", apiKeyInput);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev === section ? "" : section));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] w-full max-w-md rounded-lg shadow-2xl border border-gray-700 flex flex-col max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Settings size={18} />
            <span>Preferences</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto">
          {/* API Key Section */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection("api")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#252526] transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-200">
                <Key size={18} className="text-gray-400" />
                <span>API Configuration</span>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  activeSection === "api" ? "rotate-90" : ""
                }`}
              />
            </button>
            {activeSection === "api" && (
              <div className="p-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                <p className="text-xs text-gray-400 mb-3">
                  To use the AI features, you need to provide your own Google
                  Gemini API Key. It will be stored locally in your browser.
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 uppercase">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#2d2d2d] text-white px-3 py-2 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      Get API Key <ExternalLink size={10} />
                    </a>
                    <button
                      onClick={handleSaveKey}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        isSaved
                          ? "bg-green-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {isSaved ? "Saved!" : "Save Key"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Section */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection("theme")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#252526] transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-200">
                <Palette size={18} className="text-gray-400" />
                <span>Editor Theme</span>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  activeSection === "theme" ? "rotate-90" : ""
                }`}
              />
            </button>
            {activeSection === "theme" && (
              <div className="p-4 pt-0 grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-200">
                {Object.entries(THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => onThemeChange(key)}
                    className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                      activeTheme === key
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-700 hover:border-gray-600 bg-[#252526]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-600 shadow-sm"
                        style={{ backgroundColor: theme.bg }}
                      ></div>
                      <span className="text-sm font-medium text-gray-200">
                        {theme.name}
                      </span>
                    </div>
                    {activeTheme === key && (
                      <CheckCircle size={16} className="text-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Font Section */}
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleSection("font")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#252526] transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-200">
                <Type size={18} className="text-gray-400" />
                <span>Font Settings</span>
              </div>
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  activeSection === "font" ? "rotate-90" : ""
                }`}
              />
            </button>
            {activeSection === "font" && (
              <div className="p-4 pt-0 grid grid-cols-1 gap-2 animate-in slide-in-from-top-2 duration-200">
                {Object.entries(FONTS).map(([key, font]) => (
                  <button
                    key={key}
                    onClick={() => onFontChange(key)}
                    className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                      activeFont === key
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-700 hover:border-gray-600 bg-[#252526]"
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium text-gray-200">
                        {font.name}
                      </span>
                      <span
                        className="text-xs text-gray-500"
                        style={{ fontFamily: font.value }}
                      >
                        Example: 01iIlL
                      </span>
                    </div>
                    {activeFont === key && (
                      <CheckCircle size={16} className="text-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end bg-[#1e1e1e]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
