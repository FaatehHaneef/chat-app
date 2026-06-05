/**
 * API service for Qur'an Chat - communicating with Vercel backend.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For local dev, use localhost; in prod on Vercel the API is same-origin,
// so the base is empty and requests go to /api/chat, /api/conversations.
const API_BASE_URL =
  import.meta.env.DEV && import.meta.env.VITE_LOCAL_API_URL
    ? import.meta.env.VITE_LOCAL_API_URL
    : import.meta.env.VITE_API_URL || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function handle(res) {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || body?.detail || '';
    } catch {
      // body wasn't json
    }
    const err = new Error(detail || `API error: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Get current user
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`Auth error: ${error.message}`);
  }
  return data.user;
}

// Sign in with anonymous session (or email if needed)
export async function signInAnonymous() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(`Auth error: ${error.message}`);
  }
  return data.user;
}

// Send a chat message and get response
export async function sendMessage(conversationId, userMessage, userId) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      userMessage,
      userId,
    }),
  });
  return handle(res);
}

// List conversations for user
export async function listConversations(userId) {
  const res = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return handle(res);
}

// Create new conversation
export async function createConversation(userId, title = 'New Conversation') {
  const res = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      title,
    }),
  });
  return handle(res);
}

// Update conversation title
export async function updateConversation(userId, conversationId, title) {
  const res = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      conversationId,
      title,
    }),
  });
  return handle(res);
}

// Delete conversation
export async function deleteConversation(userId, conversationId) {
  const res = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      conversationId,
    }),
  });
  return handle(res);
}

// Load conversation messages
export async function loadConversationMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }
  return data;
}
