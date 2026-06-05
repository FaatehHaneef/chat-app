/**
 * API service for communicating with backend.
 */

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) ||
  'http://localhost:8000';

async function handle(res) {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.detail || '';
    } catch {
      // body wasn't json
    }
    const err = new Error(detail || `API error: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function submitQuery(query, conversationId = null) {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, conversation_id: conversationId })
  });
  return handle(res);
}

export async function submitClarification(clarifiedQuery, conversationId) {
  const res = await fetch(`${API_BASE_URL}/clarification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: clarifiedQuery, conversation_id: conversationId })
  });
  return handle(res);
}

export async function listConversations() {
  const res = await fetch(`${API_BASE_URL}/conversations`, { method: 'GET' });
  return handle(res);
}

export async function loadConversation(conversationId) {
  const res = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/load`,
    { method: 'GET' }
  );
  return handle(res);
}

export async function endConversation(conversationId) {
  const res = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/end`,
    { method: 'POST' }
  );
  return handle(res);
}
