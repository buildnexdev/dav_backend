import { env } from '../config/env.js';
import { SYSTEM_PROMPT } from '../data/systemPrompt.js';
import { getVerifiedFallbackAnswer } from './fallback.service.js';
import { ctaForMessage } from '../utils/cta.js';

function buildMessages(userMessage, history = []) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  history.slice(-6).forEach((item) => {
    if (!item?.content) return;
    messages.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content)
    });
  });

  messages.push({ role: 'user', content: userMessage });
  return messages;
}

async function callOpenAICompatible(url, apiKey, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `AI request failed (${res.status})`);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data?.choices?.[0]?.message?.content?.trim() || null;
}

async function callGemini(apiKey, model, userMessage, history) {
  const contents = [];

  history.slice(-6).forEach((item) => {
    if (!item?.content) return;
    contents.push({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(item.content) }]
    });
  });

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: env.ai.temperature,
        maxOutputTokens: env.ai.maxTokens
      }
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Gemini request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}

export async function generateChatReply({ message, history }) {
  const { provider, apiKey, model, temperature, maxTokens } = env.ai;

  if (apiKey) {
    try {
      let text = null;

      if (provider === 'gemini') {
        text = await callGemini(apiKey, model, message, history);
      } else if (provider === 'groq') {
        text = await callOpenAICompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          apiKey,
          {
            model,
            messages: buildMessages(message, history),
            temperature,
            max_tokens: maxTokens
          }
        );
      } else {
        text = await callOpenAICompatible(
          'https://api.openai.com/v1/chat/completions',
          apiKey,
          {
            model,
            messages: buildMessages(message, history),
            temperature,
            max_tokens: maxTokens
          }
        );
      }

      if (text) {
        return {
          success: true,
          response: text,
          provider,
          cta: ctaForMessage(message)
        };
      }
    } catch (error) {
      console.error('[ai.service]', error.message);
    }
  }

  const fallback = getVerifiedFallbackAnswer(message);
  return {
    success: true,
    response: fallback.text,
    provider: 'portfolio-knowledge-engine',
    cta: fallback.cta
  };
}
