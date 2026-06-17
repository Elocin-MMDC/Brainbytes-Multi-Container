/**
 * aiService.js
 * Primary:  Groq API (llama-3.3-70b-versatile) — free, fast
 * Fallback: Rule-based intelligent responses
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'; 
const fetch = require('node-fetch');

// ─────────────────────────────────────────────
// FALLBACK: Rule-based knowledge base
// ─────────────────────────────────────────────
const knowledgeBase = {
  algebra: {
    definition: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols to solve equations.',
    explanation: 'Algebra works by using variables (like x or y) to represent unknown values, then using mathematical operations to find what those values are.',
    example: 'Example: If x + 3 = 7, then x = 4. We solve for x by subtracting 3 from both sides.',
  },
  geometry: {
    definition: 'Geometry is the branch of mathematics concerned with shapes, sizes, and properties of figures and spaces.',
    explanation: 'Geometry studies points, lines, angles, surfaces, and solids to understand spatial relationships.',
    example: 'Example: A triangle has 3 sides and its angles always add up to 180 degrees.',
  },
  photosynthesis: {
    definition: 'Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar.',
    explanation: 'Plants capture light energy using chlorophyll in their leaves. This energy converts CO₂ and water into glucose and oxygen.',
    example: 'Example: A plant placed near a window grows better because it gets more sunlight for photosynthesis.',
  },
  gravity: {
    definition: 'Gravity is a natural force that attracts objects with mass toward each other.',
    explanation: 'Every object with mass creates a gravitational pull. Earth\'s gravity pulls everything toward its center at 9.8 m/s².',
    example: 'Example: When you drop a ball, gravity pulls it down to the ground.',
  },
  atoms: {
    definition: 'An atom is the smallest unit of ordinary matter that forms a chemical element.',
    explanation: 'Atoms consist of a nucleus (protons and neutrons) surrounded by electrons.',
    example: 'Example: A hydrogen atom has 1 proton and 1 electron — the simplest atom.',
  },
  'jose rizal': {
    definition: 'José Rizal was a Filipino nationalist and national hero of the Philippines.',
    explanation: 'Rizal fought for Philippine independence through his writings — Noli Me Tangere and El Filibusterismo.',
    example: 'Example: Rizal\'s execution on December 30, 1896 sparked the Philippine Revolution.',
  },
  noun: {
    definition: 'A noun is a word that names a person, place, thing, or idea.',
    explanation: 'Nouns serve as the subject or object in a sentence.',
    example: 'Example: In "Maria loves books," both "Maria" and "books" are nouns.',
  },
  verb: {
    definition: 'A verb is a word that describes an action, state, or occurrence.',
    explanation: 'Verbs are the core of a sentence, telling us what the subject does or is.',
    example: 'Example: In "She runs every morning," the word "runs" is the verb.',
  },
};

const sentimentResponses = {
  frustrated: "I understand this might be challenging. Let's take it step by step — ",
  confused: "No worries, let me explain this more clearly — ",
  positive: "Great attitude! Keep it up! ",
  neutral: '',
};

function detectQuestionType(question) {
  const q = question.toLowerCase();
  if (/what is|define|meaning of|what are/.test(q)) return 'definition';
  if (/how|why|explain|describe/.test(q)) return 'explanation';
  if (/example|show me|give me|sample/.test(q)) return 'example';
  return 'general';
}

function detectSentiment(question) {
  const q = question.toLowerCase();
  if (/frustrated|frustrating|hate|stupid|ugh|ayaw|hindi ko gets/.test(q)) return 'frustrated';
  if (/confused|don't understand|hindi ko maintindihan|lost|stuck|di ko gets/.test(q)) return 'confused';
  if (/thanks|thank you|great|love|helpful|salamat|galing/.test(q)) return 'positive';
  return 'neutral';
}

function detectSubject(question) {
  const q = question.toLowerCase();
  if (/algebra|geometry|calculus|equation|math|number|fraction|decimal/.test(q)) return 'Math';
  if (/photosynthesis|gravity|atom|science|physics|chemistry|biology|element/.test(q)) return 'Science';
  if (/rizal|history|philippine|revolution|war|colonial|bayani/.test(q)) return 'History';
  if (/noun|verb|adjective|english|grammar|sentence|paragraph/.test(q)) return 'English';
  if (/filipino|tagalog|wika|salita|pangngalan|pandiwa/.test(q)) return 'Filipino';
  return 'General';
}

function solveMath(question) {
  const match = question.match(/what is\s+([\d\s\+\-\*\/\.]+)\??/i);
  if (match) {
    try {
      const result = eval(match[1].trim());
      if (typeof result === 'number') return `The answer is ${result}`;
    } catch (_) {}
  }
  return null;
}

function getRuleBasedResponse(question) {
  const mathResult = solveMath(question);
  if (mathResult) return mathResult;

  const q = question.toLowerCase();
  const questionType = detectQuestionType(question);

  for (const [topic, responses] of Object.entries(knowledgeBase)) {
    if (q.includes(topic)) {
      return responses[questionType] || responses.definition;
    }
  }

  return "That's a great question! I'm still learning about that topic. Try asking about Math, Science, History, or English subjects!";
}

// ─────────────────────────────────────────────
// PRIMARY: Groq API
// ─────────────────────────────────────────────
async function callGroq(question) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are BrainBytes, a friendly AI tutor for Filipino students. 
You help with Math, Science, History, English, and Filipino subjects.
Keep answers clear and concise (2-4 sentences).
Be encouraging and patient.
Reply in the same language the student uses (English or Taglish is okay).`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'Groq API error');
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text.trim();
}

// ─────────────────────────────────────────────
// MAIN: generateResponse (hybrid)
// ─────────────────────────────────────────────
async function generateResponse(question) {
  const questionType = detectQuestionType(question);
  const sentiment = detectSentiment(question);
  const subject = detectSubject(question);
  const sentimentPrefix = sentimentResponses[sentiment];

  let aiResponse;
  let source = 'groq';

  try {
    aiResponse = await callGroq(question);
    if (sentiment === 'frustrated' || sentiment === 'confused') {
      aiResponse = sentimentPrefix + aiResponse;
    }
  } catch (err) {
    console.warn('Groq unavailable, using fallback:', err.message);
    source = 'fallback';
    const ruleResponse = getRuleBasedResponse(question);
    aiResponse = sentimentPrefix + ruleResponse;
  }

  return { aiResponse, subject, questionType, sentiment, source };
}

function initializeAI() {
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  GROQ_API_KEY not set — will use rule-based fallback only.');
  } else {
    console.log('✅ Groq AI initialized (llama-3.3-70b-versatile)');
  }
}

module.exports = { initializeAI, generateResponse, detectQuestionType, detectSentiment };