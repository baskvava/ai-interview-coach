import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // 1. Check API Key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set" },
        { status: 500 }
      );
    }

    // 2. Call Groq API (OpenAI compatible interface)
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // Recommended: Latest Llama 3.3 70B
          messages: [
            {
              role: "system",
              // 必須在 system prompt 強調輸出 JSON，否則開啟 json_object 模式可能會報錯
              content:
                "You are a helpful assistant. You must output strictly valid JSON.",
            },
            ...messages,
          ],
          stream: false, // <--- 修改：設為 false 或直接移除 (預設為 false)
          temperature: 0.7,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API Error: ${groqResponse.status} - ${errorText}`);
    }

    // 3. Parse JSON Response directly
    // 非串流模式下，直接解析完整的 JSON 物件
    const data = await groqResponse.json();

    // OpenAI 格式的非串流回應結構通常位於 choices[0].message.content
    // 注意：串流時是 .delta.content，非串流時是 .message.content
    const content = data.choices?.[0]?.message?.content || "";

    // 4. Return JSON Response
    return NextResponse.json({ role: "assistant", content: content });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
