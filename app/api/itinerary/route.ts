import { NextRequest } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GROQ_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let payload: { city?: unknown; interests?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const city = typeof payload.city === "string" ? payload.city.trim() : "";
  const interests =
    typeof payload.interests === "string" ? payload.interests.trim() : "";

  if (!city) {
    return Response.json({ error: "Please enter a city." }, { status: 400 });
  }
  if (!interests) {
    return Response.json(
      { error: "Please enter at least one interest." },
      { status: 400 },
    );
  }

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant. Create a day trip itinerary for a city based on the traveller's interests. Use short markdown headings for Morning, Afternoon and Evening.",
        },
        { role: "user", content: `City: ${city}\nInterests: ${interests}` },
      ],
    }),
  });

  const upstreamBody = upstream.body;
  if (!upstream.ok || !upstreamBody) {
    const detail = await upstream.text().catch(() => "");
    return Response.json(
      {
        error: `Groq request failed (${upstream.status}). ${detail.slice(0, 300)}`,
      },
      { status: 502 },
    );
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const chunk = JSON.parse(data);
              const delta: string | undefined =
                chunk?.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // Groq sends keep-alive comments that are not JSON.
            }
          }
        }
      } catch {
        controller.enqueue(
          encoder.encode("\n\n[The itinerary stream was interrupted.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
