import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    // 1. 修正：前端送來的是 "messages" 陣列，不是單一 "message" 字串
    const { messages } = await request.json();

    // 2. 修正：對話模式應該呼叫 /api/chat，而不是 /api/generate
    const ollamaResponse = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5",
        messages: messages, // 傳送完整的對話歷史
        stream: true,
      }),
    });

    if (!ollamaResponse.ok || !ollamaResponse.body) {
      throw new Error(`Ollama API Error: ${ollamaResponse.statusText}`);
    }

    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // 3. 新增：Buffer 機制，處理可能被切斷的 JSON
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // 串流結束時，如果 buffer 還有剩餘資料（極少見），嘗試處理
              if (buffer.trim()) {
                try {
                  const json = JSON.parse(buffer);
                  if (json.message?.content) {
                    controller.enqueue(encoder.encode(json.message.content));
                  }
                } catch (e) {
                  console.error("Final buffer parse error", e);
                }
              }
              controller.close();
              break;
            }

            // 解碼當前收到的區塊
            const chunk = decoder.decode(value, { stream: true });

            // 把新收到的資料接在 buffer 後面
            buffer += chunk;

            // 尋找換行符號，逐行處理
            const lines = buffer.split("\n");

            // 重要：最後一行可能是不完整的（因為被切斷），要留給下一次處理
            // 所以我們只處理 lines.length - 1 的部分
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim() === "") continue;

              try {
                const json = JSON.parse(line);

                // 4. 修正：/api/chat 的回傳結構是 json.message.content
                // /api/generate 才是 json.response
                const content = json.message?.content;

                if (content) {
                  controller.enqueue(encoder.encode(content));
                }

                // 處理結束訊號 (Ollama 有時會在最後一包送 done: true)
                if (json.done) {
                  // 通常不需要做什麼，因為外層 while loop 會根據 reader done 退出
                }
              } catch (e) {
                console.error("Error parsing JSON line:", line, e);
                // JSON 解析失敗通常是因為 buffer 機制沒寫好，現在加上 buffer 後應該很少發生
              }
            }
          }
        } catch (err) {
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
