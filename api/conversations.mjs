// Vercel API endpoint: Conversation management (/api/conversations)

import { supabaseAdmin } from "../lib/supabase.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // GET carries userId in the query string; the other verbs use the body.
    const userId = req.method === "GET" ? req.query.userId : req.body?.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    if (req.method === "GET") {
      // Fetch all conversations for user
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return res.status(500).json({ error: "Failed to fetch conversations" });
      }

      return res.status(200).json(data);
    } else if (req.method === "POST") {
      // Create new conversation
      const { title } = req.body;

      const { data, error } = await supabaseAdmin
        .from("conversations")
        .insert({
          user_id: userId,
          title: title || "New Conversation",
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return res.status(500).json({
          error: "Failed to create conversation",
          details: error.message,
          code: error.code,
          hint: error.hint,
        });
      }

      return res.status(201).json(data);
    } else if (req.method === "PUT") {
      // Update conversation
      const { conversationId, title } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: "Missing conversationId" });
      }

      const { data, error } = await supabaseAdmin
        .from("conversations")
        .update({
          title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating conversation:", error);
        return res.status(500).json({ error: "Failed to update conversation" });
      }

      return res.status(200).json(data);
    } else if (req.method === "DELETE") {
      // Delete conversation
      const { conversationId } = req.body;

      if (!conversationId) {
        return res.status(400).json({ error: "Missing conversationId" });
      }

      const { error } = await supabaseAdmin
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error deleting conversation:", error);
        return res.status(500).json({ error: "Failed to delete conversation" });
      }

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
