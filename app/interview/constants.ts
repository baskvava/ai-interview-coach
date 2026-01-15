import {
  type FontConfig,
  type LanguageConfig,
  type ThemeConfig,
} from "./types";

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
export { LANGUAGES, THEMES, FONTS };
