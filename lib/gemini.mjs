// Gemini API utility for Qur'an Chat
// Note: fetch is built-in to Node.js 18+ (no need to import)

// gemini-pro was retired from v1beta generateContent. Default to a current
// model; override with GEMINI_MODEL. On transient overload (503/429) we retry
// with backoff and then fall back to a second model (GEMINI_FALLBACK_MODEL).
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
const MODELS = [...new Set([PRIMARY_MODEL, FALLBACK_MODEL])];

const TRANSIENT_STATUSES = new Set([429, 500, 503]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function modelUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const SYSTEM_PROMPT = `You are an AI assistant specialized in answering FACTUAL, educational questions about the Qur'an.

You provide:
1. Clear, accurate answers grounded in Qur'anic teachings
2. Relevant Qur'anic verses or surahs, cited as "Surah Al-Baqarah, verse 255"
3. Respectful, thoughtful explanations with helpful context
4. A conversational yet scholarly tone

Scope and boundaries — follow these strictly:
- Answer only factual or educational inquiries: the Qur'an's content, verses, surahs, history, language, stories, themes, and widely accepted scholarship.
- Do NOT issue religious rulings (fatwas), declare what is permissible/forbidden in contested cases, take sides in sectarian, political, or theological disputes, or engage with controversial, divisive, inflammatory, or provocative questions.
- When a question is controversial, divisive, or asks for an opinion or ruling on a contested matter, do not argue or take a side. Respond briefly and respectfully, note that such matters are best discussed with a qualified scholar, and gently steer the conversation back to factual learning about the Qur'an.
- If a question is entirely outside the scope of the Qur'an, politely redirect to Qur'anic topics.

Always remain respectful. Never produce content that demeans any group or belief.`;

// Call a single model, retrying on transient (overload) errors with exponential
// backoff. Throws on a non-transient error or after exhausting retries.
async function callModel(model, apiKey, payload, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${modelUrl(model)}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    }

    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || response.statusText;
    lastError = new Error(`Gemini API error: ${response.status} - ${message}`);
    lastError.status = response.status;

    // Non-transient (bad key, bad request, missing model): don't retry.
    if (!TRANSIENT_STATUSES.has(response.status)) {
      throw lastError;
    }
    // Transient: back off (0.4s, 0.8s, 1.6s) then retry.
    if (attempt < maxAttempts) {
      await sleep(400 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

export async function getGeminiResponse(userMessage, conversationHistory = []) {
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "Missing VITE_GEMINI_API_KEY environment variable",
      response:
        "The assistant is not configured yet. Please set the Gemini API key.",
    };
  }

  // Format conversation history for Gemini.
  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : msg.role,
      parts: [{ text: msg.content }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ];

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: messages,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  let lastError;
  for (const model of MODELS) {
    try {
      const data = await callModel(model, apiKey, payload);
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unable to generate response";

      return {
        success: true,
        response: responseText,
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      };
    } catch (error) {
      lastError = error;
      // Only try the next model when the failure is a transient overload;
      // for real errors (bad request/key) stop and report immediately.
      if (error.status && !TRANSIENT_STATUSES.has(error.status)) {
        break;
      }
    }
  }

  console.error("Gemini API error:", lastError);
  return {
    success: false,
    error: lastError?.message || "Gemini request failed",
    response:
      "I apologize, but the assistant is briefly overloaded. Please try again in a moment.",
  };
}
