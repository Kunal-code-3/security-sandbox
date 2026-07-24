require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, slow down.' }
});

app.use('/api/', limiter);

// Block .env from being served
app.use('/.env', (req, res) => res.status(403).json({ error: 'Forbidden' }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Simple in-memory usage counters (not persistent across restarts)
const usage = { totalRequests: 0, byProvider: {} };

function logUsage(entry) {
  usage.totalRequests += 1;
  usage.byProvider[entry.provider] = (usage.byProvider[entry.provider] || 0) + 1;
  const line = `${new Date().toISOString()} | ${entry.provider} | topic=${entry.topic} | count=${entry.count} | difficulty=${entry.difficulty}\n`;
  fs.appendFile(path.join(__dirname, 'ai-usage.log'), line, () => {});
}

function buildPrompt({ topic, difficulty, count }) {
  return `You are a cybersecurity awareness trainer. Create exactly ${count} ${difficulty}-level multiple-choice question(s) about "${topic}" for cybersecurity awareness training.

Each question should:
- Be realistic and educational
- Test practical knowledge employees need
- Have exactly 4 answer choices
- Include a clear explanation of why the correct answer is right

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Explanation of why this is correct.",
      "difficulty": "${difficulty}"
    }
  ]
}`;
}

// ========================
// Parse JSON from AI text (handles markdown fences, extra text)
// ========================
function extractJSON(text) {
  if (!text) return null;

  // Try direct parse first
  try { return JSON.parse(text); } catch (e) { /* continue */ }

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (e) { /* continue */ }
  }

  // Find first { to last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { /* continue */ }
  }

  return null;
}

// ========================
// GEMINI API (Primary)
// ========================
async function callGemini(prompt, apiKey) {
  const model = process.env.GOOGLE_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Gemini API error');
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return extractJSON(text);
}

// ========================
// OPENAI API (Fallback)
// ========================
async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.8
    })
  });

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  return extractJSON(text);
}

// ========================
// MAIN API ENDPOINT
// ========================
app.post('/api/generate-questions', async (req, res) => {
  try {
    let { topic = 'phishing', difficulty = 'easy', count = 1 } = req.body;

    // Input validation
    count = Math.min(Math.max(parseInt(count) || 1, 1), 10);
    const allowedDifficulties = ['easy', 'medium', 'hard'];
    if (!allowedDifficulties.includes(difficulty)) difficulty = 'easy';
    topic = String(topic).slice(0, 100);

    const prompt = buildPrompt({ topic, difficulty, count });

    const googleKey = process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

    let parsed = null;
    let providerUsed = 'mock';

    // 1. Try Gemini (primary)
    if (googleKey) {
      providerUsed = 'google-gemini';
      try {
        parsed = await callGemini(prompt, googleKey);
        console.log(`✅ Gemini generated ${count} question(s) on "${topic}"`);
      } catch (err) {
        console.error('❌ Gemini call failed:', err.message);
        parsed = null;
      }
    }

    // 2. Try OpenAI (fallback)
    if (!parsed && openaiKey) {
      providerUsed = 'openai';
      try {
        parsed = await callOpenAI(prompt, openaiKey);
        console.log(`✅ OpenAI generated ${count} question(s) on "${topic}"`);
      } catch (err) {
        console.error('❌ OpenAI call failed:', err.message);
        parsed = null;
      }
    }

    // 3. Mock fallback
    if (!parsed) {
      providerUsed = 'mock';
      parsed = generateMockQuestions(topic, difficulty, count);
      console.log(`⚙️  Mock generated ${count} question(s) on "${topic}"`);
    }

    // Validate schema
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(502).json({ error: 'AI returned unexpected format. Try again.' });
    }

    // Log usage
    logUsage({ provider: providerUsed, topic, difficulty, count });

    res.json({ ...parsed, provider: providerUsed });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Health + usage endpoints
app.get('/api/status', (req, res) => {
  const googleKey = process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  res.json({
    status: 'ok',
    providers: {
      gemini: googleKey ? 'configured' : 'not configured',
      openai: openaiKey ? 'configured' : 'not configured'
    },
    usage
  });
});

function generateMockQuestions(topic, difficulty, count) {
  const mockBank = {
    phishing: [
      { question: 'You receive an email from "support@amaz0n-security.com" asking you to verify your account. What should you do?', choices: ['Click the link and verify', 'Forward it to friends', 'Check the sender domain carefully and report it', 'Reply with your password'], correct_answer: 'Check the sender domain carefully and report it', explanation: 'The domain "amaz0n-security.com" uses a zero instead of "o" — a classic phishing trick. Always verify sender domains.' },
      { question: 'Which of these is a common sign of a phishing email?', choices: ['Personalized greeting with your full name', 'Urgent language threatening account closure', 'Email from a known colleague about a meeting', 'A newsletter you subscribed to'], correct_answer: 'Urgent language threatening account closure', explanation: 'Phishing emails often create urgency to pressure you into acting without thinking.' },
      { question: 'A colleague sends you a link via email to a shared document, but the URL looks unusual. What do you do?', choices: ['Open it immediately', 'Hover over the link to check the actual URL', 'Delete your email account', 'Forward it to everyone'], correct_answer: 'Hover over the link to check the actual URL', explanation: 'Hovering over links reveals the actual destination URL, helping you spot malicious redirects.' }
    ],
    'password security': [
      { question: 'Which password is the most secure?', choices: ['password123', 'MyDog2024', 'k$9Lm#pQ2!xZ', 'qwerty'], correct_answer: 'k$9Lm#pQ2!xZ', explanation: 'A strong password uses a random mix of uppercase, lowercase, numbers, and symbols with sufficient length.' },
      { question: 'How often should you change your passwords?', choices: ['Never', 'Every day', 'When there is a known breach or compromise', 'Every hour'], correct_answer: 'When there is a known breach or compromise', explanation: 'Modern security guidance recommends changing passwords when compromised rather than on a fixed schedule.' },
      { question: 'What is the best way to manage multiple passwords?', choices: ['Write them on sticky notes', 'Use the same password everywhere', 'Use a reputable password manager', 'Save them in a text file on your desktop'], correct_answer: 'Use a reputable password manager', explanation: 'Password managers securely store and generate unique passwords for each account.' }
    ],
    malware: [
      { question: 'What is ransomware?', choices: ['A type of antivirus', 'Malware that encrypts files and demands payment', 'A security update', 'A firewall setting'], correct_answer: 'Malware that encrypts files and demands payment', explanation: 'Ransomware encrypts your files and demands a ransom (usually cryptocurrency) to restore access.' },
      { question: 'Which action is most likely to result in a malware infection?', choices: ['Updating your operating system', 'Downloading software from an unknown website', 'Using a VPN', 'Enabling two-factor authentication'], correct_answer: 'Downloading software from an unknown website', explanation: 'Unknown websites may bundle malware with downloads. Always use official sources.' },
      { question: 'What should you do if you suspect your computer has malware?', choices: ['Ignore it and keep working', 'Disconnect from the network and run a security scan', 'Delete all your files', 'Turn off your monitor'], correct_answer: 'Disconnect from the network and run a security scan', explanation: 'Disconnecting prevents malware from spreading, and a security scan can identify and remove threats.' }
    ],
    'social engineering': [
      { question: 'What is social engineering in cybersecurity?', choices: ['Building social media platforms', 'Manipulating people to reveal confidential information', 'Engineering social networks', 'A type of firewall'], correct_answer: 'Manipulating people to reveal confidential information', explanation: 'Social engineering exploits human psychology rather than technical vulnerabilities to gain unauthorized access.' },
      { question: 'Someone calls claiming to be IT support and asks for your login credentials. What should you do?', choices: ['Give them your password', 'Verify their identity through official channels', 'Share your screen', 'Email them your credentials'], correct_answer: 'Verify their identity through official channels', explanation: 'Legitimate IT support will never ask for your password. Always verify through known official contacts.' },
      { question: 'Which is an example of pretexting?', choices: ['Sending spam emails', 'Creating a fake scenario to extract information', 'Installing antivirus software', 'Using a strong password'], correct_answer: 'Creating a fake scenario to extract information', explanation: 'Pretexting involves fabricating a scenario to trick victims into sharing sensitive data or granting access.' }
    ],
    'safe browsing': [
      { question: 'What does the padlock icon in your browser address bar indicate?', choices: ['The website is virus-free', 'The connection uses HTTPS encryption', 'The website is government-approved', 'The website cannot track you'], correct_answer: 'The connection uses HTTPS encryption', explanation: 'The padlock means data between your browser and the site is encrypted, but it doesn\'t guarantee the site itself is trustworthy.' },
      { question: 'Which practice helps protect your privacy while browsing?', choices: ['Using the same password for all sites', 'Clearing cookies and browsing history regularly', 'Clicking on every ad for more information', 'Sharing your location with all websites'], correct_answer: 'Clearing cookies and browsing history regularly', explanation: 'Clearing cookies and history reduces tracking and protects your browsing privacy.' },
      { question: 'What is the risk of using public Wi-Fi without a VPN?', choices: ['Faster internet speed', 'Your data could be intercepted by attackers', 'Better privacy protection', 'Automatic virus removal'], correct_answer: 'Your data could be intercepted by attackers', explanation: 'Public Wi-Fi is often unencrypted, allowing attackers to intercept your data using man-in-the-middle attacks.' }
    ]
  };

  const bank = mockBank[topic] || mockBank['phishing'];
  const samples = [];

  for (let i = 0; i < count; i++) {
    const q = bank[i % bank.length];
    samples.push({
      id: i + 1,
      question: q.question,
      choices: q.choices,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty
    });
  }

  return { questions: samples };
}

app.listen(PORT, async () => {
  // Initialize database
  try {
    await db.initDb();
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
  }

  console.log(`\n🛡  Security Sandbox server running on http://localhost:${PORT}`);
  console.log(`   AI Simulator: http://localhost:${PORT}/ai-simulator.html`);
  const gk = process.env.GOOGLE_API_KEY;
  const ok = process.env.OPENAI_API_KEY;
  if (gk) console.log('   ✅ Gemini API key detected');
  else console.log('   ⚠️  No GOOGLE_API_KEY — set it in .env for AI-generated questions');
  if (ok) console.log('   ✅ OpenAI API key detected');
  console.log('');
});
