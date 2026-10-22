import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

// Initialise Gemini client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Available high-performance models ranked by current health & quota
const RELIABLE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3-flash-preview',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
];

// Status API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    defaultModel: 'gemini-3.5-flash',
    supportedModels: RELIABLE_MODELS,
  });
});

// Title generation for conversations
app.post('/api/chat/title', async (req, res) => {
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.status(500).json({ error: 'API key is not configured' });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let titleText = 'New Conversation';
    for (const modelToTry of RELIABLE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: `Generate a short, concise 3 to 6 word title summarizing this initial user message. Return ONLY the title text, with no quotes, no markdown, and no preamble: "${prompt.slice(0, 300)}"`,
        });
        const extracted = response.text?.trim()?.replace(/^["']|["']$/g, '');
        if (extracted) {
          titleText = extracted;
          break;
        }
      } catch (err) {
        // Try next model
      }
    }

    res.json({ title: titleText.slice(0, 45) });
  } catch (error: any) {
    console.error('Error generating title:', error);
    res.json({ title: 'New Conversation' });
  }
});

// Helper to convert client messages to Gemini contents structure with full validation
function formatContents(messages: any[]) {
  // 1. Filter out completely empty messages (no text and no images)
  const validMessages = (messages || []).filter((m: any) => {
    const hasText = Boolean(m.content && typeof m.content === 'string' && m.content.trim().length > 0);
    const hasImages = Boolean(Array.isArray(m.images) && m.images.length > 0);
    return hasText || hasImages;
  });

  if (validMessages.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  // 2. Map to Gemini format
  const mapped = validMessages.map((m: any) => {
    const parts: any[] = [];
    if (Array.isArray(m.images) && m.images.length > 0) {
      for (const img of m.images) {
        if (img.data && img.mimeType) {
          const base64Data = img.data.includes(';base64,')
            ? img.data.split(';base64,')[1]
            : img.data;
          parts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: base64Data,
            },
          });
        }
      }
    }
    if (m.content && m.content.trim()) {
      parts.push({ text: m.content.trim() });
    }
    const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
    return { role, parts };
  });

  // 3. Ensure strictly alternating user/model sequence and starts with 'user'
  const alternating: any[] = [];
  for (const item of mapped) {
    if (alternating.length === 0) {
      if (item.role === 'user') {
        alternating.push(item);
      }
    } else {
      const prev = alternating[alternating.length - 1];
      if (prev.role === item.role) {
        // Merge parts into previous message
        prev.parts.push(...item.parts);
      } else {
        alternating.push(item);
      }
    }
  }

  // If alternating is empty, fallback to the last user message
  if (alternating.length === 0) {
    const lastUser = mapped.slice().reverse().find((m: any) => m.role === 'user');
    if (lastUser) {
      alternating.push(lastUser);
    } else {
      alternating.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }
  }

  // Ensure the very last message in contents is from 'user'
  if (alternating[alternating.length - 1].role !== 'user') {
    alternating.pop();
  }

  return alternating.length > 0 ? alternating : [{ role: 'user', parts: [{ text: 'Hello' }] }];
}

// Robust Chat API (JSON POST) - Immune to proxy buffering, responds in 1-2s!
app.post('/api/chat', async (req, res) => {
  const ai = getAiClient();
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured. Please check your Settings > Secrets panel.',
    });
  }

  const {
    messages,
    systemInstruction,
    temperature = 0.7,
    enableSearch = false,
    model = 'gemini-3.5-flash',
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const contents = formatContents(messages);

  const config: any = {};
  if (systemInstruction && typeof systemInstruction === 'string') {
    config.systemInstruction = systemInstruction;
  }
  if (typeof temperature === 'number') {
    config.temperature = Math.max(0, Math.min(2, temperature));
  }
  if (enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const requestedModel = model && RELIABLE_MODELS.includes(model) ? model : 'gemini-3.5-flash';
  const modelsToTry = [requestedModel, ...RELIABLE_MODELS].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    try {
      console.log(`[Esy AI] Generating response with model: ${currentModel}`);
      const response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config,
      });

      const text = response.text || '';
      const grounding = response.candidates?.[0]?.groundingMetadata;
      const webChunks = grounding?.groundingChunks?.map((gc: any) => gc.web).filter(Boolean);
      const searchQueries = grounding?.webSearchQueries;

      console.log(`[Esy AI] Generated response successfully (${text.length} chars) using ${currentModel}`);
      return res.json({
        text,
        webChunks: webChunks && webChunks.length > 0 ? webChunks : undefined,
        searchQueries: searchQueries && searchQueries.length > 0 ? searchQueries : undefined,
        model: currentModel,
      });
    } catch (err: any) {
      console.warn(`[Esy AI] Model ${currentModel} failed:`, err?.message || err);
      lastError = err;
    }
  }

  console.error('[Esy AI] All models failed. Last error:', lastError);
  const errMsg = lastError?.message || '';
  let userFriendlyError = 'The AI service is momentarily busy. Please try sending your message again.';

  if (lastError?.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
    userFriendlyError = 'Daily quota was temporarily exceeded. Please try again in a few moments.';
  } else if (lastError?.status === 503 || errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
    userFriendlyError = 'The AI model is experiencing a temporary demand surge. Please click Retry in a moment.';
  } else if (lastError?.status === 403 || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID')) {
    userFriendlyError = 'Invalid API key. Please check your settings in the Secrets panel.';
  }

  return res.status(500).json({ error: userFriendlyError });
});

// Streaming Chat API (SSE) with buffer flushes
app.post('/api/chat/stream', async (req, res) => {
  const ai = getAiClient();
  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured. Please check your Settings > Secrets panel.',
    });
  }

  const {
    messages,
    systemInstruction,
    temperature = 0.7,
    enableSearch = false,
    model = 'gemini-3.5-flash',
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const contents = formatContents(messages);

  const config: any = {};
  if (systemInstruction && typeof systemInstruction === 'string') {
    config.systemInstruction = systemInstruction;
  }
  if (typeof temperature === 'number') {
    config.temperature = Math.max(0, Math.min(2, temperature));
  }
  if (enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  let isClosed = false;
  req.on('close', () => {
    isClosed = true;
  });

  const requestedModel = model && RELIABLE_MODELS.includes(model) ? model : 'gemini-3.5-flash';
  const modelsToTry = [requestedModel, ...RELIABLE_MODELS].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

  let streamSucceeded = false;
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    if (isClosed || streamSucceeded) break;

    try {
      console.log(`[Esy AI] Attempting stream with: ${currentModel}`);
      const stream = await ai.models.generateContentStream({
        model: currentModel,
        contents,
        config,
      });

      let chunksEmitted = 0;

      for await (const chunk of stream) {
        if (isClosed) break;

        let text = '';
        try {
          text = chunk.text || '';
        } catch {
          // ignore
        }

        const grounding = chunk.candidates?.[0]?.groundingMetadata;
        const webChunks = grounding?.groundingChunks?.map((gc: any) => gc.web).filter(Boolean);
        const searchQueries = grounding?.webSearchQueries;

        const payload = {
          text,
          webChunks: webChunks && webChunks.length > 0 ? webChunks : undefined,
          searchQueries: searchQueries && searchQueries.length > 0 ? searchQueries : undefined,
        };

        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        (res as any).flush?.();
        chunksEmitted++;
      }

      if (chunksEmitted > 0) {
        streamSucceeded = true;
        break;
      }
    } catch (modelError: any) {
      console.warn(`[Esy AI] Model ${currentModel} stream failed:`, modelError?.message || modelError);
      lastError = modelError;
      if (isClosed) break;
    }
  }

  // Fallback to unary if stream yielded 0 chunks
  if (!streamSucceeded && !isClosed) {
    for (const fallbackModel of RELIABLE_MODELS) {
      try {
        const unaryResponse = await ai.models.generateContent({
          model: fallbackModel,
          contents,
          config,
        });

        const text = unaryResponse.text || '';
        const grounding = unaryResponse.candidates?.[0]?.groundingMetadata;
        const webChunks = grounding?.groundingChunks?.map((gc: any) => gc.web).filter(Boolean);
        const searchQueries = grounding?.webSearchQueries;

        res.write(
          `data: ${JSON.stringify({
            text,
            webChunks: webChunks && webChunks.length > 0 ? webChunks : undefined,
            searchQueries: searchQueries && searchQueries.length > 0 ? searchQueries : undefined,
          })}\n\n`
        );
        (res as any).flush?.();
        streamSucceeded = true;
        break;
      } catch (unaryErr: any) {
        lastError = unaryErr;
      }
    }
  }

  if (!streamSucceeded && !isClosed) {
    res.write(
      `data: ${JSON.stringify({
        error: 'The AI model is temporarily busy. Please click Retry below.',
      })}\n\n`
    );
  }

  if (!isClosed) {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// Mount Vite or serve static assets
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Esy AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
