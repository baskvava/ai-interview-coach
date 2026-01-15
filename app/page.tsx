"use client";

import { useState } from "react";
import { LandingPage } from "./_components/LandingPage";
import { SettingsModal } from "./_components/SettingsModal";
import { InterviewPage } from "./interview/InterviewPage";

type ProblemSummary = {
  id: string | number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
};

export default function Home() {
  const [selectedProblemSummary, setSelectedProblemSummary] =
    useState<ProblemSummary | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Lifted state for settings
  const [selectedTheme, setSelectedTheme] = useState<string>("vscode-dark");
  const [selectedFont, setSelectedFont] = useState<string>("default");

  const handleSelectProblem = (summary: ProblemSummary) => {
    setSelectedProblemSummary(summary);
  };

  return (
    <div>
      {/* <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        onThemeChange={setSelectedTheme}
        onFontChange={setSelectedFont}
        activeTheme={selectedTheme}
        activeFont={selectedFont}
      /> */}

      <LandingPage
        onSelectProblem={handleSelectProblem}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* <InterviewPage
        // problemSummary={selectedProblemSummary}
        problemSummary={{ id: "a", title: "two sum", difficulty: "Easy" }}
        // onBack={handleBackToHome}
        onBack={() => {}}
        onOpenSettings={() => setShowSettings(true)}
      /> */}
    </div>
  );
}
