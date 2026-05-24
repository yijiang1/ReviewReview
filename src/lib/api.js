// ── Provider + Model configuration ────────────────────────────────────────────
export const MODELS = {
  anthropic: [
    {
      id: 'claude-sonnet-4-20250514',
      label: 'Claude Sonnet 4',
      tag: 'Best quality',
      inputPer1M: 3.00,
      outputPer1M: 15.00,
      searchCostPer1K: 10.00,
    },
    {
      id: 'claude-haiku-3-5-20241022',
      label: 'Claude Haiku 3.5',
      tag: 'Faster & cheaper',
      inputPer1M: 0.80,
      outputPer1M: 4.00,
      searchCostPer1K: 10.00,
    },
  ],
  openai: [
    {
      id: 'gpt-4o',
      label: 'GPT-4o',
      tag: 'Best quality',
      inputPer1M: 2.50,
      outputPer1M: 10.00,
      searchCostPer1K: 25.00,
    },
    {
      id: 'gpt-4o-mini',
      label: 'GPT-4o mini',
      tag: 'Faster & cheaper',
      inputPer1M: 0.15,
      outputPer1M: 0.60,
      searchCostPer1K: 25.00,
    },
  ],
  gemini: [
    {
      id: 'gemini-2.5-pro-preview-05-06',
      label: 'Gemini 2.5 Pro',
      tag: 'Best quality',
      inputPer1M: 1.25,
      outputPer1M: 10.00,
      searchCostPer1K: 35.00,
    },
    {
      id: 'gemini-2.0-flash',
      label: 'Gemini 2.0 Flash',
      tag: 'Fast & affordable',
      inputPer1M: 0.075,
      outputPer1M: 0.30,
      searchCostPer1K: 35.00,
    },
    {
      id: 'gemini-1.5-flash',
      label: 'Gemini 1.5 Flash',
      tag: 'Budget option',
      inputPer1M: 0.075,
      outputPer1M: 0.30,
      searchCostPer1K: 35.00,
    },
  ],
};

// Average token usage per run (based on typical paper + prompts)
// Call 1 (research + search): ~3K input, ~4K output, 1 search request
// Call 2 (structured eval):   ~6K input, ~2K output
const AVG_INPUT_TOKENS  = 9_000;
const AVG_OUTPUT_TOKENS = 6_000;

export function estimateRunCost(provider, modelId) {
  const model = MODELS[provider]?.find(m => m.id === modelId);
  if (!model) return null;

  const tokenCost  = (AVG_INPUT_TOKENS  / 1_000_000 * model.inputPer1M)
                   + (AVG_OUTPUT_TOKENS / 1_000_000 * model.outputPer1M);
  const searchCost = model.searchCostPer1K / 1_000; // 1 grounding/search call

  const total = tokenCost + searchCost;
  const fmt   = total < 0.001 ? '<$0.001'
              : total < 0.01  ? `~$${total.toFixed(4)}`
              :                 `~$${total.toFixed(3)}`;

  return { tokenCost, searchCost, total, formatted: fmt };
}

// ── Provider configuration ─────────────────────────────────────────────────
export const PROVIDERS = {
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    storageKey: 'rr_key_anthropic',
    placeholder: 'sk-ant-api03-…',
    validate: k => k.startsWith('sk-ant'),
    docsUrl: 'https://console.anthropic.com/keys',
    docsLabel: 'console.anthropic.com',
    note: 'Requires claude-sonnet-4 with web search enabled.',
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    storageKey: 'rr_key_openai',
    placeholder: 'sk-proj-…',
    validate: k => k.startsWith('sk-'),
    docsUrl: 'https://platform.openai.com/api-keys',
    docsLabel: 'platform.openai.com',
    note: 'Uses the Responses API with web_search_preview.',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    storageKey: 'rr_key_gemini',
    placeholder: 'AIzaSy…',
    validate: k => k.length > 20,
    docsUrl: 'https://aistudio.google.com/app/apikey',
    docsLabel: 'aistudio.google.com',
    note: 'Uses Google Search grounding (billed per request).',
  },
};

const PROVIDER_STORAGE_KEY = 'rr_provider';

export function getSelectedProvider() {
  return localStorage.getItem(PROVIDER_STORAGE_KEY) || 'anthropic';
}
export function setSelectedProvider(id) {
  localStorage.setItem(PROVIDER_STORAGE_KEY, id);
}

export function getApiKey(providerId) {
  const id = providerId || getSelectedProvider();
  return localStorage.getItem(PROVIDERS[id]?.storageKey || '') || '';
}
export function setApiKey(providerId, key) {
  localStorage.setItem(PROVIDERS[providerId].storageKey, key.trim());
}
export function clearApiKey(providerId) {
  localStorage.removeItem(PROVIDERS[providerId].storageKey);
}
export function isKeyValid(providerId, key) {
  return PROVIDERS[providerId]?.validate(key) ?? false;
}

export function getSelectedModel(provider) {
  const stored = localStorage.getItem(`rr_model_${provider}`);
  // Validate stored model still exists in catalog
  if (stored && MODELS[provider]?.some(m => m.id === stored)) return stored;
  return MODELS[provider]?.[0]?.id || '';
}
export function setSelectedModel(provider, modelId) {
  localStorage.setItem(`rr_model_${provider}`, modelId);
}

// ── Anthropic ──────────────────────────────────────────────────────────────
async function fetchAnthropic(userPrompt, systemPrompt, apiKey, model, useSearch, maxTokens) {
  const body = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: userPrompt }],
  };
  if (systemPrompt) body.system = systemPrompt;
  if (useSearch) body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || `Anthropic API error ${r.status}`);
  }
  const data = await r.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

// ── OpenAI ─────────────────────────────────────────────────────────────────
async function fetchOpenAI(userPrompt, systemPrompt, apiKey, model, useSearch, maxTokens) {
  if (useSearch) {
    const body = {
      model,
      tools: [{ type: 'web_search_preview' }],
      input: (systemPrompt ? `${systemPrompt}\n\n` : '') + userPrompt,
      max_output_tokens: maxTokens,
    };
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error?.message || `OpenAI API error ${r.status}`);
    }
    const data = await r.json();
    return (data.output || [])
      .flatMap(item => item.content || [])
      .filter(c => c.type === 'output_text')
      .map(c => c.text)
      .join('\n');
  } else {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: userPrompt });

    const body = { model, max_tokens: maxTokens, messages };
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.error?.message || `OpenAI API error ${r.status}`);
    }
    const data = await r.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

// ── Gemini ─────────────────────────────────────────────────────────────────
async function fetchGemini(userPrompt, systemPrompt, apiKey, model, useSearch, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };
  if (useSearch) body.tools = [{ google_search: {} }];

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error?.message || `Gemini API error ${r.status}`);
  }
  const data = await r.json();
  return (data.candidates?.[0]?.content?.parts || [])
    .filter(p => p.text)
    .map(p => p.text)
    .join('\n');
}

// ── Unified call ───────────────────────────────────────────────────────────
export async function callAI({ provider, apiKey, model, userPrompt, systemPrompt, useSearch = false, maxTokens = 4000 }) {
  const modelId = model || getSelectedModel(provider);
  switch (provider) {
    case 'anthropic': return fetchAnthropic(userPrompt, systemPrompt, apiKey, modelId, useSearch, maxTokens);
    case 'openai':    return fetchOpenAI(userPrompt, systemPrompt, apiKey, modelId, useSearch, maxTokens);
    case 'gemini':    return fetchGemini(userPrompt, systemPrompt, apiKey, modelId, useSearch, maxTokens);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
