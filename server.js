require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, slow down.' }
});

app.use('/api/', limiter);

// Serve static files from project root so frontend can be opened at /ai-simulator.html
app.use(express.static(path.join(__dirname)));

// Simple in-memory usage counters (not persistent across restarts)
const usage = { totalRequests: 0, byProvider: {} };

function logUsage(entry) {
  usage.totalRequests += 1;
  usage.byProvider[entry.provider] = (usage.byProvider[entry.provider] || 0) + 1;
  const line = `${new Date().toISOString()} | ${entry.provider} | topic=${entry.topic} | count=${entry.count} | difficulty=${entry.difficulty}\n`;
  fs.appendFile(path.join(__dirname, 'ai-usage.log'), line, () => {});
}

function buildPrompt({ topic, difficulty, count }) {
  return `Create ${count} ${difficulty} multiple-choice question(s) about ${topic} focusing on cybersecurity awareness. ` +
    `Return strictly JSON with top-level key \"questions\" which is an array of objects with keys: id (number), question (string), choices (array of strings), correct_answer (string, one of choices), explanation (string), difficulty (string). No extra text.`;
}

app.post('/api/generate-questions', async (req, res) => {
  try {
    const { topic = 'phishing', difficulty = 'easy', count = 1 } = req.body;
    const prompt = buildPrompt({ topic, difficulty, count });

    // Provider selection: prefer Gemini (Google) if GOOGLE_API_KEY or GOOGLE_APPLICATION_CREDENTIALS is present,
    // otherwise prefer OpenAI if OPENAI_API_KEY is present. If no provider key is configured, fall back to a mock generator.
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const openaiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    let parsed = null;
    let providerUsed = 'mock';

    if (googleKey) {
      providerUsed = 'google-gemini';
      try {
        // Try a simple API-key-based call to Google's Generative API (text-bison / Gemini family).
        const model = process.env.GOOGLE_MODEL || 'models/text-bison-001:generate';
        const url = `https://generativelanguage.googleapis.com/v1beta2/${model}${process.env.GOOGLE_API_KEY ? `?key=${process.env.GOOGLE_API_KEY}` : ''}`;
        const body = { prompt: { text: prompt }, temperature: 0.7, maxOutputTokens: 600 };
        const providerResponse = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await providerResponse.json();
        const text = data?.candidates?.[0]?.content || data?.output?.[0]?.content || JSON.stringify(data);
        try { parsed = JSON.parse(text); } catch (e) {
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}');
          if (start !== -1 && end !== -1) parsed = JSON.parse(text.slice(start, end + 1));
        }
      } catch (err) {
        console.error('Gemini call failed:', err.message);
      }
    }

    if (!parsed && openaiKey) {
      providerUsed = 'openai';
      try {
        const providerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.7 })
        });
        const data = await providerResponse.json();
        const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
        if (text) {
          try { parsed = JSON.parse(text); } catch (e) {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) parsed = JSON.parse(text.slice(start, end + 1));
          }
        }
      } catch (err) {
        console.error('OpenAI call failed:', err.message);
      }
    }

    // If no provider configured or parsing failed, return deterministic mock questions so the UI works without keys.
    if (!parsed) {
      providerUsed = 'mock';
      parsed = generateMockQuestions(topic, difficulty, count);
    }

    // Simple validation
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(502).json({ error: 'Provider returned unexpected schema.' });
    }

    // Log usage (file + in-memory)
    logUsage({ provider: providerUsed, topic, difficulty, count });

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Health + usage endpoints
app.get('/api/status', (req, res) => res.json({ status: 'ok', usage }));

function generateMockQuestions(topic, difficulty, count) {
  const samples = [];
  for (let i = 1; i <= count; i++) {
    samples.push({
      id: i,
      question: `Sample ${difficulty} question ${i} about ${topic}: Which action is safest?`,
      choices: ['Click link', 'Ignore email', 'Verify via official site', 'Reply with password'],
      correct_answer: 'Verify via official site',
      explanation: 'Always verify using the official site or app; do not trust links in unexpected emails.',
      difficulty
    });
  }
  return { questions: samples };
}

app.listen(PORT, () => console.log(`AI proxy server listening on port ${PORT}`));
