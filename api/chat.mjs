// Vercel API endpoint: POST /api/chat
// Handles chat messages and returns AI responses

import { supabaseAdmin } from "../lib/supabase.mjs";
import { getGeminiResponse } from "../lib/gemini.mjs";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { conversationId, userMessage, userId } = req.body;

    if (!conversationId || !userMessage || !userId) {
      return res
        .status(400)
        .json({
          error:
            "Missing required fields: conversationId, userMessage, userId",
        });
    }

    // Fetch conversation history
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Error fetching messages:", fetchError);
      return res.status(500).json({ error: "Failed to fetch conversation" });
    }

    // Insert user message
    const { data: userMsg, error: insertError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting user message:", insertError);
      return res.status(500).json({ error: "Failed to save message" });
    }

    // Get AI response from Gemini
    const aiResult = await getGeminiResponse(userMessage, messages);

    if (!aiResult.success) {
      return res
        .status(500)
        .json({ error: aiResult.error || "Failed to generate response" });
    }

    // Insert assistant message
    const { data: assistantMsg, error: assistantError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: aiResult.response,
      })
      .select()
      .single();

    if (assistantError) {
      console.error("Error inserting assistant message:", assistantError);
      return res.status(500).json({ error: "Failed to save assistant response" });
    }

    // Log the interaction
    await supabaseAdmin.from("chat_logs").insert({
      user_id: userId,
      conversation_id: conversationId,
      prompt: userMessage,
      response: aiResult.response,
      tokens_used: aiResult.inputTokens + aiResult.outputTokens,
    });

    // Return both messages
    res.status(200).json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      tokensUsed: aiResult.inputTokens + aiResult.outputTokens,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
