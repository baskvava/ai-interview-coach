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
          Authorization: `Bearer ${apiKey}`, // Add authentication
        },
        body: JSON.stringify({
          // model: "llama3-70b-8192", // Old version
          model: "llama-3.3-70b-versatile", // Recommended: Latest Llama 3.3 70B
          messages: messages,
          stream: true, // Enable streaming
          temperature: 0.7, // Optional: Control creativity
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq API Error: ${groqResponse.status} - ${errorText}`);
    }

    if (!groqResponse.body) {
      throw new Error("No response body from Groq");
    }

    const reader = groqResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // Decode the newly received chunk
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Groq/OpenAI streams are separated by "\n\n", but processing line by line works fine
            const lines = buffer.split("\n");

            // Keep the last line (potentially incomplete) for the next loop
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();

              // 3. Parse Groq's SSE format (Server-Sent Events)
              // Format is usually: data: {"id":..., "choices":[{...}]}
              if (!trimmedLine.startsWith("data: ")) continue;

              const jsonStr = trimmedLine.replace("data: ", "");

              // Handle end signal
              if (jsonStr === "[DONE]") continue;

              try {
                const json = JSON.parse(jsonStr);

                // Groq (OpenAI format) content is in choices[0].delta.content
                const content = json.choices?.[0]?.delta?.content;

                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (e) {
                console.error("Error parsing JSON line:", e);
              }
            }
          }
        } catch (err) {
          console.error("Stream reading error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Stream API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
