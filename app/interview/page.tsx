"use client";
import { InterviewPage } from "./InterviewPage";

export default function Page() {
  return (
    <InterviewPage
      // problemSummary={selectedProblemSummary}
      problemSummary={{ id: "a", title: "two sum", difficulty: "Easy" }}
      // onBack={handleBackToHome}
      onBack={() => {}}
      // onOpenSettings={() => setShowSettings(true)}
      onOpenSettings={() => {}}
    />
  );
}
