# BrainBytes - AI-Powered Learning Platform

BrainBytes is a multi-container learning application that provides AI-powered tutoring across multiple subjects. Built with Node.js, Next.js, and MongoDB, integrated with the Hugging Face Inference API.

## Architecture

The application consists of three Docker containers:
- **Frontend** (Next.js) - User interface running on port 8080
- **Backend** (Express.js) - REST API running on port 3000
- **MongoDB** - Database running on port 27017

## Prerequisites

- Docker Desktop installed
- Git installed
- Hugging Face account with API token (free)

## Setup & Running the Application

### 1. Clone the repository
```bash
git clone https://github.com/Elocin-MMDC/Brainbytes-Multi-Container.git
cd Brainbytes-Multi-Container
```

### 2. Set up your Hugging Face token

Create a `.env` file in the project root:
```
HUGGINGFACE_TOKEN=your_hugging_face_token_here
```

To get a free token:
1. Sign up at https://huggingface.co
2. Click your avatar → Access Tokens
3. Create a fine-grained token with **Inference** permissions:
   - Make calls to inference providers
   - Make calls to Inference Endpoints
4. Copy the token into your `.env` file

### 3. Build and start the containers
```bash
docker-compose up --build
```

### 4. Open your browser
- Chat Interface: http://localhost:8080
- Profile Page: http://localhost:8080/profile
- Dashboard: http://localhost:8080/dashboard
- API: http://localhost:3000

### 5. To stop the application
```bash
docker-compose down
```

## Testing the Application

### Chat Page
Try asking these questions to test different AI features:

**Question Type Detection:**
- `What is algebra?` → definition response
- `Explain photosynthesis` → explanation response
- `Give me an example of a noun` → example response

**Sentiment Analysis:**
- `I'm so frustrated!` → empathetic response
- `I'm confused about gravity` → patient, clearer response
- `Thank you, this is great!` → positive acknowledgment

**Math Solver:**
- `What is 5 + 3?` → returns "The answer is 8"
- `What is 1+1?` → returns "The answer to 1+1 is 2"

**Subject Detection:**
- Questions about algebra, geometry → detected as Math
- Questions about photosynthesis, gravity, atoms → detected as Science
- Questions about Rizal, Philippines → detected as History
- Questions about nouns, verbs → detected as English
- Questions in Filipino/Tagalog → detected as Filipino

## API Documentation

### AI Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Send message; returns AI response with subject, question type, and sentiment |

**Request:**
```json
{ "message": "What is algebra?", "subject": "Math" }
```

**Response:**
```json
{
  "userMessage": "What is algebra?",
  "aiResponse": "Algebra is a branch of mathematics...",
  "subject": "Math",
  "questionType": "definition",
  "sentiment": "neutral"
}
```

### User Profiles (CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create a new user profile |
| GET | `/api/users` | Get all user profiles |
| GET | `/api/users/:id` | Get a single user by ID |
| PUT | `/api/users/:id` | Update a user profile |
| DELETE | `/api/users/:id` | Delete a user profile |

**Request body:**
```json
{
  "name": "Juan Dela Cruz",
  "email": "juan@example.com",
  "preferredSubjects": ["Math", "Science"]
}
```

### Learning Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/materials` | Create a new learning material |
| GET | `/api/materials` | Get all materials (optional `?subject=Math`) |
| GET | `/api/materials/:id` | Get a single material by ID |

**Request body:**
```json
{
  "subject": "Math",
  "topic": "Quadratic Equations",
  "content": "A quadratic equation is..."
}
```

### Messages & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages` | Get chat history (optional `?subject=Math`) |
| GET | `/api/dashboard/recent` | Get recent activity, total messages, and subject counts |

## Database Schema Design

### Message Collection
Stores all chat conversations with AI metadata.
```javascript
{
  text: String,           // user's question
  response: String,       // AI's answer
  subject: String,        // detected/selected subject (Math, Science, History, English, Filipino, General)
  questionType: String,   // definition | explanation | example | general
  sentiment: String,      // frustrated | confused | positive | neutral
  createdAt: Date
}
```

### UserProfile Collection
Stores user account information and learning preferences.
```javascript
{
  name: String,                  // required
  email: String,                 // required, unique
  preferredSubjects: [String],   // array of preferred subjects
  createdAt: Date,
  updatedAt: Date
}
```

### LearningMaterial Collection
Stores learning content organized by subject and topic.
```javascript
{
  subject: String,    // required (Math, Science, History, English, Filipino)
  topic: String,      // required (specific topic name)
  content: String,    // required (the learning content)
  createdAt: Date
}
```

## AI Implementation

### Hybrid Approach (Hugging Face API + Intelligent Fallback)

The AI uses a **hybrid approach** as recommended by the activity:

1. **Primary**: Attempts to call the Hugging Face Inference API (`facebook/bart-large-cnn`) for AI-generated responses
2. **Fallback**: When the API is unavailable, times out, or rate-limited, the system uses a local intelligent response system

The AI logic is separated into `aiService.js` which exports:
- `initializeAI()` - validates environment and token
- `generateResponse(question)` - main hybrid logic
- `detectQuestionType(question)` - detects definition/explanation/example/general
- `detectSentiment(question)` - detects frustrated/confused/positive/neutral

### Note on Node.js Compatibility
The backend uses Node.js 14 (alpine). `AbortController` is not natively available in Node.js 14, so the API timeout is handled without it. The fallback system ensures the app always responds even when the API is unavailable.

### AI Features

#### 1. Expanded Knowledge Base
Training data covers multiple subjects, each with three response types:
- **Math**: algebra, geometry
- **Science**: photosynthesis, gravity, atoms, evaporation, precipitation
- **History**: Jose Rizal, Philippines capital
- **English**: nouns, verbs

#### 2. Question Type Detection
- **Definition**: triggered by "what is", "define", "meaning of"
- **Explanation**: triggered by "how", "why", "explain", "describe"
- **Example**: triggered by "example", "show me", "give me a sample"
- **General**: default for other questions

#### 3. Sentiment Analysis
- **Frustrated** ("frustrated", "frustrating", "hate", "stupid", "ugh") → empathetic prefix added
- **Confused** ("confused", "don't understand", "lost", "stuck") → clearer explanation prefix added
- **Positive** ("thanks", "great", "love", "helpful") → positive acknowledgment
- **Neutral** → default response style

#### 4. Subject Auto-Classification
Messages are automatically classified into subjects based on keyword detection. Enables filtering in chat and analytics in dashboard.

#### 5. Math Expression Solver
Evaluates expressions like "What is 5 + 3?" and returns direct numeric answers.

## Frontend Features

### Chat Page (/)
- AI conversation with typing indicator
- **Subject filter dropdown** (All, Math, Science, History, English, Filipino, General)
- Each AI response shows detected Subject, Question Type, and Sentiment
- Auto-scroll to latest message
- Conversation history loaded on page visit

### Profile Page (/profile)
- Create user profiles with name, email, preferred subjects
- View, edit, and delete existing profiles
- Multi-select subject preference buttons

### Dashboard Page (/dashboard)
- Total conversation count card
- Per-subject conversation breakdown
- Recent activity feed (last 10 conversations)
- Shows Question Type and Sentiment per conversation

## Project Structure

```
brainbytes-multi-container/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js          # Express server with all API endpoints
│   └── aiService.js       # AI service module (Hugging Face and Enhancements)
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── pages/
│       ├── index.js       # Chat page with subject filter
│       ├── profile.js     # User profile management
│       └── dashboard.js   # Learning activity dashboard
├── docker-compose.yml
├── .env                   # Hugging Face token (gitignored)
├── .gitignore
└── README.md
```

## Team Members
- Mara Julienne Rose Cervantes
- Christine Joy Cortes 
- Sarah Nicole Hular 
- Michelle Joi Quesada 
- Eldan Eunice Sinsuan

## License
This project is for educational purposes as part of the DevOps course.
