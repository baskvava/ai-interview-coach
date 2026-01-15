import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Get the prompt from the frontend
    const { query } = await request.json();

    // 2. Prepare the payload for Ollama
    const ollamaPayload = {
      model: "qwen2.5",
      messages: [
        {
          role: "system",
          content: "You are a technical interviewer. Return JSON only.",
        },
        {
          role: "user",
          /**
           * @todo improve prompt engineering here
           * Now, we have a simple prompt to generate coding problems.
           * the prompt can generate from another AI model for more complex logic
           * depending on algo, system design, frontend, backend, fullstack, devops, etc.
           */
          content: `You are a strict API. Return a JSON array of 5 algorithmic coding interview problems related to "${query}".
          Output format: [{"id": string, "title": string, "difficulty": "Easy"|"Medium"|"Hard"}]
          Do not output markdown. Return ONLY the raw JSON array.`,
        },
      ],
      stream: false,
    };

    // 3. Call Ollama (Server-to-Server communication)
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaPayload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 4. Return the clean content to your frontend
    return NextResponse.json({
      result: data.message.content,
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
