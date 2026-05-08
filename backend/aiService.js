const fetch = require('node-fetch');

// Initialize our AI service
const initializeAI = () => {
  console.log('Hugging Face AI service initialized');
  
  // Check if the token is available
  if (!process.env.HUGGINGFACE_TOKEN) {
    console.warn('Warning: HUGGINGFACE_TOKEN environment variable not set. API calls may fail.');
  }
};

// ============================================
// QUESTION TYPE DETECTION (NEW for homework)
// ============================================
function detectQuestionType(question) {
  const lower = question.toLowerCase();
  if (lower.startsWith('what is') || lower.startsWith('define') || lower.includes('definition of') || lower.includes('meaning of')) {
    return 'definition';
  }
  if (lower.startsWith('how') || lower.startsWith('why') || lower.includes('explain') || lower.includes('describe')) {
    return 'explanation';
  }
  if (lower.includes('example') || lower.includes('show me') || lower.includes('give me a sample')) {
    return 'example';
  }
  return 'general';
}

// ============================================
// SENTIMENT ANALYSIS (NEW for homework)
// ============================================
function detectSentiment(question) {
  const lower = question.toLowerCase();
  const frustrated = ['frustrated', 'frustrating', 'angry', 'hate', 'stupid', 'annoying', 'useless', 'terrible', 'awful', 'ugh', 'this is hard', 'so hard'];
  const confused = ['confused', "don't understand", 'do not understand', 'lost', 'unclear', 'stuck', 'idk', "don't get it"];
  const positive = ['thank', 'thanks', 'great', 'awesome', 'love', 'helpful', 'amazing', 'cool', 'nice'];

  for (let word of frustrated) if (lower.includes(word)) return 'frustrated';
  for (let word of confused) if (lower.includes(word)) return 'confused';
  for (let word of positive) if (lower.includes(word)) return 'positive';
  return 'neutral';
}

// Apply sentiment-based prefix to response
function applySentimentPrefix(sentiment, response) {
  if (sentiment === 'frustrated') {
    return "I understand this can be frustrating. Take a deep breath - learning takes time, and I am here to help you. " + response;
  }
  if (sentiment === 'confused') {
    return "No worries, let me try to explain it more clearly. " + response;
  }
  if (sentiment === 'positive') {
    return "I am glad you are enjoying learning! " + response;
  }
  return response;
}

// Function to get response from Hugging Face API
async function generateResponse(question) {
  // Define categories based on content
  const lowerQuestion = question.toLowerCase();
  
  const isMath = lowerQuestion.includes('calculate') || 
                 lowerQuestion.includes('math') ||
                 lowerQuestion.includes('algebra') ||
                 lowerQuestion.includes('geometry') ||
                 lowerQuestion.includes('1+1') ||
                 /[+\-*\/=]/.test(lowerQuestion);
  
  const isHistory = lowerQuestion.includes('history') ||
                    lowerQuestion.includes('capital') ||
                    lowerQuestion.includes('philippines') ||
                    lowerQuestion.includes('president') ||
                    lowerQuestion.includes('rizal');

  const isScience = lowerQuestion.includes('science') ||
                    lowerQuestion.includes('evaporation') ||
                    lowerQuestion.includes('precipitation') ||
                    lowerQuestion.includes('water') ||
                    lowerQuestion.includes('chemical') ||
                    lowerQuestion.includes('photosynthesis') ||
                    lowerQuestion.includes('gravity') ||
                    lowerQuestion.includes('atom');

  const isEnglish = lowerQuestion.includes('english') ||
                    lowerQuestion.includes('grammar') ||
                    lowerQuestion.includes('noun') ||
                    lowerQuestion.includes('verb');

  const isFilipino = lowerQuestion.includes('filipino') ||
                     lowerQuestion.includes('tagalog');

  // Determine the category based on keyword matching
  let category = 'general';
  if (isMath) category = 'Math';
  else if (isHistory) category = 'History';
  else if (isScience) category = 'Science';
  else if (isEnglish) category = 'English';
  else if (isFilipino) category = 'Filipino';

  // Detect question type and sentiment
  const questionType = detectQuestionType(question);
  const sentiment = detectSentiment(question);

  // Check for direct matches to provide immediate responses without API call
  if (lowerQuestion === 'what is 1+1' || lowerQuestion === '1+1') {
    return {
      category: 'Math',
      questionType,
      sentiment,
      response: applySentimentPrefix(sentiment, "The answer to 1+1 is 2.")
    };
  }
  
  if (lowerQuestion === 'what is evaporation') {
    return {
      category: 'Science',
      questionType,
      sentiment,
      response: applySentimentPrefix(sentiment, "Evaporation is the process where liquid water changes into water vapor (gas). This happens when water molecules gain enough energy from heat to break free from the liquid's surface. Evaporation occurs at temperatures below water's boiling point and is a key part of the water cycle. It happens all around us - from wet clothes drying to puddles disappearing after rain.")
    };
  }
  
  if (lowerQuestion === 'what is science') {
    return {
      category: 'Science',
      questionType,
      sentiment,
      response: applySentimentPrefix(sentiment, "Science is the systematic study of the natural world through observation, experimentation, and the formulation and testing of hypotheses. It aims to discover patterns and principles that help us understand how things work. The scientific method involves making observations, asking questions, forming hypotheses, conducting experiments, analyzing data, and drawing conclusions. Science encompasses many fields including physics, chemistry, biology, astronomy, geology, and more.")
    };
  }

  // Math expression solver
  if (lowerQuestion.includes('what is') && /[+\-*\/]/.test(lowerQuestion)) {
    try {
      const expr = question.replace(/[^0-9+\-*/().]/g, '');
      const result = eval(expr);
      return {
        category: 'Math',
        questionType,
        sentiment,
        response: applySentimentPrefix(sentiment, 'The answer is ' + result + '.')
      };
    } catch (e) {
      // fall through to API
    }
  }

  // For other questions, try the API with a strict timeout
  try {
    const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
    
    let input = question;
    if (category === 'Math') input = `Answer this math question: ${question}`;
    else if (category === 'History') input = `Answer this history question: ${question}`;
    else if (category === 'Science') input = `Answer this science question: ${question}`;

    const token = process.env.HUGGINGFACE_TOKEN;
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        inputs: input,
        options: { wait_for_model: false }
      }),
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      return {
        category,
        questionType,
        sentiment,
        response: applySentimentPrefix(sentiment, getDetailedResponse(category, questionType, question))
      };
    }

    const result = await response.json();
    
    if (result && result[0] && result[0].generated_text) {
      return {
        category,
        questionType,
        sentiment,
        response: applySentimentPrefix(sentiment, result[0].generated_text)
      };
    } else {
      return {
        category,
        questionType,
        sentiment,
        response: applySentimentPrefix(sentiment, getDetailedResponse(category, questionType, question))
      };
    }
  } catch (error) {
    console.error("Error calling Hugging Face API:", error.message);
    return {
      category,
      questionType,
      sentiment,
      response: applySentimentPrefix(sentiment, getDetailedResponse(category, questionType, question))
    };
  }
}

// ============================================
// EXPANDED KNOWLEDGE BASE (NEW for homework)
// ============================================
const knowledgeBase = {
  'algebra': {
    definition: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols. It uses letters (variables) to represent unknown numbers.',
    explanation: 'In algebra, we use letters like x or y to represent numbers we do not know yet. We solve equations to find the value of these unknowns. For example, if x + 5 = 10, we find that x = 5.',
    example: 'Example: If 2x + 3 = 11, subtract 3 from both sides: 2x = 8. Then divide by 2: x = 4.'
  },
  'geometry': {
    definition: 'Geometry is the branch of mathematics concerned with shapes, sizes, properties of space, and relative positions of figures.',
    explanation: 'Geometry helps us understand shapes like circles, triangles, and squares. It teaches us about angles, area, perimeter, and volume.',
    example: 'Example: The area of a rectangle is length times width. If length = 5 and width = 3, then area = 15 square units.'
  },
  'photosynthesis': {
    definition: 'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose (food) and oxygen.',
    explanation: 'Plants take in carbon dioxide from the air and water from the soil. Using sunlight as energy captured by chlorophyll, they convert these into glucose for food and release oxygen as a byproduct.',
    example: 'Example: A leaf absorbs sunlight, takes in CO2, and combines it with water from roots to produce glucose (C6H12O6) and oxygen (O2).'
  },
  'gravity': {
    definition: 'Gravity is the force that attracts objects with mass toward each other. On Earth, it pulls objects toward the planet center.',
    explanation: 'Gravity keeps us on the ground and makes objects fall. The strength depends on the mass of the objects and the distance between them. Earth gravity is 9.8 meters per second squared.',
    example: 'Example: When you drop a ball, gravity pulls it toward the ground at 9.8 m/s squared acceleration.'
  },
  'atom': {
    definition: 'An atom is the smallest unit of ordinary matter that retains the properties of a chemical element. It consists of a nucleus (protons and neutrons) and electrons.',
    explanation: 'Atoms are made of three main particles: protons (positive charge), neutrons (no charge), and electrons (negative charge). The protons and neutrons are in the nucleus, while electrons orbit around it.',
    example: 'Example: A hydrogen atom has 1 proton and 1 electron. A carbon atom has 6 protons, 6 neutrons, and 6 electrons.'
  },
  'rizal': {
    definition: 'Dr. Jose Rizal (1861-1896) was a Filipino nationalist, writer, ophthalmologist, and the national hero of the Philippines.',
    explanation: 'Rizal wrote two famous novels, Noli Me Tangere and El Filibusterismo, that exposed Spanish colonial abuses. He was executed by the Spanish on December 30, 1896, which inspired the Philippine Revolution.',
    example: 'Example: His novel Noli Me Tangere depicted the suffering of Filipinos under Spanish rule and inspired the fight for independence.'
  },
  'noun': {
    definition: 'A noun is a word that names a person, place, thing, or idea.',
    explanation: 'Nouns are one of the basic parts of speech. They can be common (like dog, city) or proper (like Rover, Manila). They can also be concrete (touchable) or abstract (ideas like love).',
    example: 'Examples: teacher (person), school (place), book (thing), happiness (idea).'
  },
  'verb': {
    definition: 'A verb is a word that expresses an action, occurrence, or state of being.',
    explanation: 'Verbs tell us what someone or something is doing. They show physical actions (run, jump), mental actions (think, believe), or states of being (is, are, was).',
    example: 'Examples: She runs every morning. He thinks deeply. They are happy.'
  }
};

// More detailed fallback responses when the API call fails
function getDetailedResponse(category, questionType, question) {
  const lowerQuestion = question.toLowerCase();
  
  // Check for exact matches first
  if (lowerQuestion === 'what is 1+1' || lowerQuestion === '1+1') {
    return "The answer to 1+1 is 2.";
  }
  
  if (lowerQuestion === 'what is evaporation') {
    return "Evaporation is the process where liquid water changes into water vapor (gas). This happens when water molecules gain enough energy from heat to break free from the liquid's surface. Evaporation occurs at temperatures below water's boiling point and is a key part of the water cycle.";
  }
  
  if (lowerQuestion === 'what is science') {
    return "Science is the systematic study of the natural world through observation, experimentation, and the formulation and testing of hypotheses.";
  }
  
  // Check expanded knowledge base with question type detection
  for (const topic in knowledgeBase) {
    if (lowerQuestion.includes(topic)) {
      const entry = knowledgeBase[topic];
      if (questionType === 'definition' && entry.definition) return entry.definition;
      if (questionType === 'explanation' && entry.explanation) return entry.explanation;
      if (questionType === 'example' && entry.example) return entry.example;
      return entry.definition;
    }
  }
  
  // Specific historical/cultural questions
  if (lowerQuestion.includes('capital of the philippines')) {
    return "The capital of the Philippines is Manila. It's located on the island of Luzon and serves as the country's political, economic, and cultural center.";
  }
  if (lowerQuestion.includes('fish in filipino') || lowerQuestion.includes('fish in tagalog')) {
    return "The word for 'fish' in Filipino (Tagalog) is 'isda'.";
  }

  // Greetings
  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi ') || lowerQuestion === 'hi') {
    return "Hello! I am BrainBytes, your AI tutor. I can help you with Math, Science, History, English, and more. What would you like to learn today?";
  }
  if (lowerQuestion.includes('thank')) {
    return "You are welcome! Feel free to ask me anything else.";
  }

  // Category-based responses
  if (category === 'Science') {
    return "That's an interesting science question! Science helps us understand the natural world through observation and experimentation. I'd be happy to explain more about this specific scientific topic if you provide more details.";
  }
  if (category === 'Math') {
    return "I can help with your math question. In mathematics, it's important to understand the fundamental concepts and formulas. Could you provide more details about your specific math problem?";
  }
  if (category === 'History') {
    return "Interesting question about history or culture! I'd be happy to share more information about this topic if you provide more details.";
  }
  if (category === 'English') {
    return "English develops communication skills! Would you like help with grammar, writing, reading comprehension, or literature?";
  }
  if (category === 'Filipino') {
    return "Magandang araw! Ang Filipino ay ang ating pambansang wika. Anong gusto mong matutunan?";
  }
  
  // Default response
  return "I'm here to help you learn! Try asking 'What is algebra?' or 'Explain photosynthesis' or 'Give me an example of a noun'.";
}

module.exports = {
  initializeAI,
  generateResponse,
  detectQuestionType,
  detectSentiment
};