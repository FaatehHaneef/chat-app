// Gemini API utility for Qur'an Chat
// Note: fetch is built-in to Node.js 18+ (no need to import)

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

const SYSTEM_PROMPT = `You are an AI assistant specialized in answering questions about the Qur'an. 
You provide:
1. Clear, accurate answers grounded in Qur'anic teachings
2. Relevant Qur'anic verses or surahs when applicable
3. Respectful, thoughtful explanations
4. Context and depth for understanding

Always cite relevant verses (e.g., "Surah Al-Baqarah, verse 255").
Keep responses conversational and accessible while maintaining Islamic scholarship standards.
If a question is outside the scope of Qur'anic knowledge, politely redirect to Qur'anic topics.`;

export async function getGeminiResponse(userMessage, conversationHistory = []) {
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY environment variable");
  }

  try {
    // Format conversation history for Gemini
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

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error: ${response.status} - ${errorData.error?.message}`
      );
    }

    const data = await response.json();

    // Extract the response text
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
    console.error("Gemini API error:", error);
    return {
      success: false,
      error: error.message,
      response:
        "I apologize, but I encountered an error processing your question. Please try again.",
    };
  }
}
